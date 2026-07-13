import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useTransfer,
  useCreateTransfer,
  useApproveTransfer,
  useCompleteTransfer,
  useCancelTransfer,
  useSubmitTransfer,
  useStartPicking,
  useConfirmPicking,
  useMarkInTransit,
  useReceiveTransfer,
  useRejectTransfer,
  useDispatchTransfer,
} from './hooks/useTransfers';
import { ArrowLeft, ArrowRight, Save, AlertTriangle, Check, X, Play, Truck, Package } from 'lucide-react';
import { message, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { operationsApi } from '@/api/operationsApi';
import { TransferStatus, transferStatusLabel, transferPriorityLabel } from '@/types/wms-enums';
import type { CreateTransferOrderRequest } from '@/types/operations';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';

const getStatusKey = (status: number): string => {
  const found = Object.entries(TransferStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const TransferFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isViewMode = !!id;
  const transferId = Number(id);

  const { data: transferData, isLoading } = useTransfer(transferId);
  const createMutation = useCreateTransfer();
  const approveMutation = useApproveTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();
  const submitMutation = useSubmitTransfer();
  const startPickingMutation = useStartPicking();
  const confirmPickingMutation = useConfirmPicking();
  const dispatchMutation = useDispatchTransfer();
  const markInTransitMutation = useMarkInTransit();
  const receiveTransferMutation = useReceiveTransfer();
  const rejectMutation = useRejectTransfer();

  const [formData, setFormData] = useState<Partial<CreateTransferOrderRequest>>({
    qtyRequested: 0,
    priority: 2,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch master data
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const { data: fromLocationsData } = useQuery({
    queryKey: ['locations', 'from', formData.fromWarehouseId],
    queryFn: () => masterDataApi.getLocations({ warehouseId: formData.fromWarehouseId, pageSize: 500 }),
    enabled: !!formData.fromWarehouseId,
  });

  const { data: stockData } = useQuery({
    queryKey: ['stock', formData.fromWarehouseId, formData.productId],
    queryFn: () => operationsApi.getStockOnHand({ warehouseId: formData.fromWarehouseId, productId: formData.productId, pageSize: 500 }),
    enabled: !!formData.fromWarehouseId && !!formData.productId,
  });

  const allFromLocations = fromLocationsData?.items || [];
  const stockBalances = stockData?.items || [];

  const fromLocations = allFromLocations.filter(loc => {
    if (loc.status !== 1) return false;
    if (formData.productId) {
      const stock = stockBalances.find((s: any) => s.locationId === loc.id);
      return stock && stock.qtyAvailable > 0;
    }
    return true;
  });

  const { data: toLocationsData } = useQuery({
    queryKey: ['locations', 'to', formData.toWarehouseId],
    queryFn: () => masterDataApi.getLocations({ warehouseId: formData.toWarehouseId, pageSize: 500 }),
    enabled: !!formData.toWarehouseId,
  });
  const toLocations = (toLocationsData?.items || []).filter(l => l.status === 1);

  const { data: productsData } = useQuery({
    queryKey: ['products', 'select'],
    queryFn: () => masterDataApi.getProducts({ pageSize: 200 }),
  });
  const products = productsData?.items || [];

  useEffect(() => {
    if (isViewMode && transferData) {
      setFormData({
        fromWarehouseId: transferData.fromWarehouseId,
        toWarehouseId: transferData.toWarehouseId,
        fromLocationId: transferData.fromLocationId,
        toLocationId: transferData.toLocationId,
        productId: transferData.productId,
        uomId: transferData.uomCode ? undefined : undefined, // UoM comes from product
        qtyRequested: transferData.qtyRequested,
        lotNumber: transferData.lotNumber,
        expiryDate: transferData.expiryDate,
        reason: transferData.reason,
        notes: transferData.notes,
        carrier: transferData.carrier,
        vehicle: transferData.vehicle,
        driver: transferData.driver,
        plannedDate: transferData.plannedDate?.substring(0, 10),
        priority: transferData.priority,
      });
    }
  }, [isViewMode, transferData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fromWarehouseId) newErrors.fromWarehouseId = 'Bắt buộc chọn kho nguồn';
    if (!formData.toWarehouseId) newErrors.toWarehouseId = 'Bắt buộc chọn kho đích';
    if (formData.fromWarehouseId && formData.toWarehouseId && formData.fromWarehouseId === formData.toWarehouseId) {
      newErrors.toWarehouseId = 'Kho đích phải khác kho nguồn';
    }
    if (!formData.fromLocationId) newErrors.fromLocationId = 'Bắt buộc chọn vị trí nguồn';
    if (!formData.toLocationId) newErrors.toLocationId = 'Bắt buộc chọn vị trí đích';
    if (formData.fromLocationId && formData.toLocationId && formData.fromLocationId === formData.toLocationId) {
      newErrors.toLocationId = 'Vị trí đích phải khác vị trí nguồn';
    }
    if (!formData.productId) newErrors.productId = 'Bắt buộc chọn sản phẩm';
    if (!formData.qtyRequested || formData.qtyRequested <= 0) {
      newErrors.qtyRequested = 'Số lượng phải > 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { message.error('Vui lòng kiểm tra lại thông tin bắt buộc'); return; }
    const product = products.find(p => p.id === formData.productId);
    createMutation.mutate(
      { ...formData, uomId: product?.uomId || 1 } as CreateTransferOrderRequest,
      { onSuccess: () => navigate('/transfers') }
    );
  };

  const handleSaveAndSubmit = () => {
    if (!validate()) { message.error('Vui lòng kiểm tra lại thông tin bắt buộc'); return; }
    const product = products.find(p => p.id === formData.productId);
    createMutation.mutate(
      { ...formData, uomId: product?.uomId || 1 } as CreateTransferOrderRequest,
      {
        onSuccess: (data) => {
          if (data?.id) {
            submitMutation.mutate({ id: data.id }, { onSuccess: () => navigate('/transfers') });
          } else { navigate('/transfers'); }
        },
      }
    );
  };

  const updateField = (field: keyof CreateTransferOrderRequest, value: any) => {
    if (isViewMode) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    // Reset location when warehouse changes
    if (field === 'fromWarehouseId') setFormData(prev => ({ ...prev, fromWarehouseId: value, fromLocationId: undefined }));
    if (field === 'toWarehouseId') setFormData(prev => ({ ...prev, toWarehouseId: value, toLocationId: undefined }));
  };

  if (isViewMode && isLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const status = transferData?.status as TransferStatus;
  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/transfers')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {isViewMode ? `Phiếu điều chuyển: ${transferData?.transferNumber}` : 'Tạo phiếu điều chuyển'}
              </h1>
              {isViewMode && status && (
                <StatusBadge status={getStatusKey(status)} text={transferStatusLabel[status] || 'Không rõ'} />
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {isViewMode ? 'Chi tiết lệnh điều chuyển hàng hóa nội bộ' : 'Tạo lệnh chuyển hàng giữa các kho'}
            </p>
          </div>
        </div>

        {/* Actions theo status */}
        <div className="flex gap-2 flex-wrap">
          {!isViewMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-white border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-2"
                disabled={createMutation.isPending}
              >
                <Save size={18} /> LƯU NHÁP
              </button>
              <button
                onClick={handleSaveAndSubmit}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                disabled={createMutation.isPending || submitMutation.isPending}
              >
                <ArrowRight size={18} /> TẠO VÀ GỬI DUYỆT
              </button>
            </>
          ) : (
            <>
              {status === TransferStatus.Draft && (
                <>
                  <PermissionGuard permissions="Transfer.Submit">
                    <button onClick={() => submitMutation.mutate({ id: transferId }, { onSuccess: () => navigate('/transfers') })}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      disabled={submitMutation.isPending}>
                      <ArrowRight size={18} /> GỬI DUYỆT
                    </button>
                  </PermissionGuard>
                  <PermissionGuard permissions="Transfer.Cancel">
                    <button onClick={() => cancelMutation.mutate({ id: transferId }, { onSuccess: () => navigate('/transfers') })}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                      disabled={cancelMutation.isPending}>
                      <X size={18} /> HỦY PHIẾU
                    </button>
                  </PermissionGuard>
                </>
              )}
              {status === TransferStatus.Submitted && (
                <>
                  <PermissionGuard permissions="Transfer.Approve">
                    <button onClick={() => approveMutation.mutate({ id: transferId }, { onSuccess: () => navigate('/transfers') })}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      disabled={approveMutation.isPending}>
                      <Check size={18} /> DUYỆT PHIẾU
                    </button>
                  </PermissionGuard>
                  <PermissionGuard permissions="Transfer.Reject">
                    <button onClick={() => rejectMutation.mutate({ id: transferId, data: {} }, { onSuccess: () => navigate('/transfers') })}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
                      <X size={18} /> TỪ CHỐI
                    </button>
                  </PermissionGuard>
                </>
              )}
              {status === TransferStatus.Approved && (
                <PermissionGuard permissions="Transfer.Pick">
                  <button onClick={() => startPickingMutation.mutate({ id: transferId }, { onSuccess: () => navigate('/transfers') })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    disabled={startPickingMutation.isPending}>
                    <Play size={18} /> BẮT ĐẦU XUẤT KHO
                  </button>
                </PermissionGuard>
              )}
              {status === TransferStatus.Picking && (
                <PermissionGuard permissions="Transfer.Ship">
                  <button onClick={async () => {
                      if(window.confirm('Xác nhận đã lấy đủ hàng và tiến hành xuất kho?')) {
                        const confirmPayload = {
                          lines: (transferData?.lines || []).map((l: any) => ({ lineId: l.id, qtyPicked: l.qtyRequested, lotNumber: l.lotNumber })),
                          notes: ''
                        };
                        await confirmPickingMutation.mutateAsync({ id: transferId, data: confirmPayload });
                        await dispatchMutation.mutateAsync({ id: transferId }, { onSuccess: () => navigate('/transfers') });
                      }
                    }}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
                    disabled={confirmPickingMutation.isPending || dispatchMutation.isPending}>
                    <Truck size={18} /> XÁC NHẬN XUẤT KHO
                  </button>
                </PermissionGuard>
              )}
              {status === TransferStatus.Dispatched && (
                <PermissionGuard permissions="Transfer.Ship">
                  <button onClick={() => {
                      if(window.confirm('Xác nhận giao hàng cho đơn vị vận chuyển?')) {
                        const transitPayload = { carrier: '', vehicle: '', driver: '', notes: '' };
                        markInTransitMutation.mutate({ id: transferId, data: transitPayload }, { onSuccess: () => navigate('/transfers') });
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    disabled={markInTransitMutation.isPending}>
                    <Truck size={18} /> GIAO VẬN CHUYỂN
                  </button>
                </PermissionGuard>
              )}
              {status === TransferStatus.InTransit && (
                <PermissionGuard permissions="Transfer.Receive">
                  <button onClick={() => {
                      if(window.confirm('Xác nhận hàng đã đến và bắt đầu nhận hàng?')) {
                        const receivePayload = {
                          lines: (transferData?.lines || []).map((l: any) => ({ lineId: l.id, qtyReceived: l.qtyPicked || l.qtyRequested, notes: '' })),
                          notes: ''
                        };
                        receiveTransferMutation.mutate({ id: transferId, data: receivePayload }, { onSuccess: () => navigate('/transfers') });
                      }
                    }}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                    disabled={receiveTransferMutation.isPending}>
                    <Package size={18} /> XÁC NHẬN NHẬN HÀNG
                  </button>
                </PermissionGuard>
              )}
              {status === TransferStatus.Receiving && (
                <PermissionGuard permissions="Transfer.Complete">
                  <button onClick={() => completeMutation.mutate({ id: transferId }, { onSuccess: () => navigate('/transfers') })}
                    className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors flex items-center gap-2"
                    disabled={completeMutation.isPending}>
                    <Check size={18} /> PUTAWAY / HOÀN TẤT
                  </button>
                </PermissionGuard>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(errors).length > 0 && !isViewMode && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-800 text-sm">Vui lòng kiểm tra lại:</h4>
              <ul className="list-disc ml-5 mt-1 text-sm text-red-700 space-y-1">
                {Object.values(errors).map((err, idx) => err ? <li key={idx}>{err}</li> : null)}
              </ul>
            </div>
          </div>
        )}

        {/* Thông tin kho */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200">1. Thông tin kho</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Từ kho */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="font-medium text-slate-700 text-sm border-b border-slate-200 pb-2">Từ kho (Nguồn)</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kho xuất {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.fromWarehouseId ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                  value={formData.fromWarehouseId || ''}
                  onChange={e => updateField('fromWarehouseId', Number(e.target.value))}
                  disabled={isViewMode}
                >
                  <option value="">-- Chọn kho nguồn --</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
                {errors.fromWarehouseId && <div className="text-red-500 text-xs mt-1">{errors.fromWarehouseId}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vị trí nguồn {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.fromLocationId ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                  value={formData.fromLocationId || ''}
                  onChange={e => setFormData(prev => ({ ...prev, fromLocationId: Number(e.target.value), lotNumber: undefined, expiryDate: undefined }))}
                  disabled={isViewMode || !formData.fromWarehouseId}
                >
                  <option value="">-- Chọn vị trí --</option>
                  {fromLocations.map(l => <option key={l.id} value={l.id}>{l.code}</option>)}
                </select>
                {errors.fromLocationId && <div className="text-red-500 text-xs mt-1">{errors.fromLocationId}</div>}
              </div>
            </div>

            {/* Đến kho */}
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="font-medium text-slate-700 text-sm border-b border-slate-200 pb-2">Đến kho (Đích)</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kho nhận {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.toWarehouseId ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                  value={formData.toWarehouseId || ''}
                  onChange={e => updateField('toWarehouseId', Number(e.target.value))}
                  disabled={isViewMode}
                >
                  <option value="">-- Chọn kho đích --</option>
                  {warehouses.filter(w => w.id !== formData.fromWarehouseId).map(w => (
                    <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                  ))}
                </select>
                {errors.toWarehouseId && <div className="text-red-500 text-xs mt-1">{errors.toWarehouseId}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vị trí đích {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.toLocationId ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                  value={formData.toLocationId || ''}
                  onChange={e => setFormData(prev => ({ ...prev, toLocationId: Number(e.target.value) }))}
                  disabled={isViewMode || !formData.toWarehouseId}
                >
                  <option value="">-- Chọn vị trí --</option>
                  {toLocations.filter(l => l.id !== formData.fromLocationId).map(l => (
                    <option key={l.id} value={l.id}>{l.code}</option>
                  ))}
                </select>
                {errors.toLocationId && <div className="text-red-500 text-xs mt-1">{errors.toLocationId}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Hàng hóa */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200">2. Hàng hóa yêu cầu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sản phẩm {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.productId ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                value={formData.productId || ''}
                onChange={e => {
                  const prodId = Number(e.target.value);
                  const prod = products.find(p => p.id === prodId);
                  setFormData(prev => ({ ...prev, productId: prodId, uomId: prod?.uomId || undefined, fromLocationId: undefined }));
                  if (errors.productId) setErrors(prev => ({ ...prev, productId: '' }));
                }}
                disabled={isViewMode}
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
              </select>
              {errors.productId && <div className="text-red-500 text-xs mt-1">{errors.productId}</div>}
              {selectedProduct && (
                <div className="mt-1 text-xs text-slate-500">
                  Đơn vị tính: <span className="font-medium text-slate-700">{selectedProduct.uomName || selectedProduct.uomCode || '—'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số lượng yêu cầu {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              <div className="flex">
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-l-lg border-r-0 focus:ring-2 focus:ring-primary/50 focus:outline-none ${errors.qtyRequested ? 'border-red-500' : 'border-slate-300'} disabled:bg-slate-100`}
                  value={formData.qtyRequested || ''}
                  onChange={e => updateField('qtyRequested', Number(e.target.value))}
                  min="1"
                  disabled={isViewMode}
                />
                <div className="bg-slate-50 border border-slate-300 rounded-r-lg px-4 py-2 text-slate-500 text-sm flex items-center min-w-[80px]">
                  {isViewMode ? transferData?.uomCode : (selectedProduct?.uomName || selectedProduct?.uomCode || 'Đơn vị')}
                </div>
              </div>
              {errors.qtyRequested && <div className="text-red-500 text-xs mt-1">{errors.qtyRequested}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lô (Lot)</label>
              {isViewMode ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100"
                  value={formData.lotNumber || ''}
                  disabled
                />
              ) : (
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                  value={formData.lotNumber || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const stock = stockBalances.find((s: any) => s.locationId === formData.fromLocationId && (s.lotNumber || '') === val);
                    setFormData(prev => ({ 
                      ...prev, 
                      lotNumber: val || undefined,
                      expiryDate: stock?.expiryDate || prev.expiryDate
                    }));
                  }}
                  disabled={!formData.fromLocationId || !formData.productId}
                >
                  <option value="">-- Tùy chọn (hoặc không có lô) --</option>
                  {stockBalances
                    .filter((s: any) => s.locationId === formData.fromLocationId)
                    .map((s: any, idx) => (
                      <option key={idx} value={s.lotNumber || ''}>
                        {s.lotNumber ? `Lô: ${s.lotNumber}` : 'Không có số lô'} (Tồn: {s.qtyAvailable})
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hạn sử dụng</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.expiryDate?.substring(0, 10) || ''}
                onChange={e => updateField('expiryDate', e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200">3. Thông tin vận chuyển & bổ sung</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị vận chuyển</label>
              <input
                type="text"
                list="carrier-options"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.carrier || ''}
                onChange={e => updateField('carrier', e.target.value)}
                placeholder="Tên hãng vận chuyển..."
                disabled={isViewMode}
              />
              <datalist id="carrier-options">
                <option value="Đội xe nội bộ" />
                <option value="Viettel Post" />
                <option value="Giao Hàng Nhanh (GHN)" />
                <option value="Giao Hàng Tiết Kiệm (GHTK)" />
                <option value="VNPost" />
                <option value="Ahamove" />
                <option value="Đối tác vận chuyển ngoài" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số xe</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.vehicle || ''}
                onChange={e => updateField('vehicle', e.target.value)}
                placeholder="Biển số xe..."
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lái xe</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.driver || ''}
                onChange={e => updateField('driver', e.target.value)}
                placeholder="Tên lái xe..."
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày dự kiến</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.plannedDate || ''}
                onChange={e => updateField('plannedDate', e.target.value)}
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mức ưu tiên</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.priority || 2}
                onChange={e => updateField('priority', Number(e.target.value))}
                disabled={isViewMode}
              >
                {Object.entries(transferPriorityLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do chuyển kho</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:bg-slate-100"
                value={formData.reason || ''}
                onChange={e => updateField('reason', e.target.value)}
                placeholder="Ví dụ: Bổ sung hàng cho kho chi nhánh..."
                disabled={isViewMode}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú thêm</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none h-24 disabled:bg-slate-100"
                value={formData.notes || ''}
                onChange={e => updateField('notes', e.target.value)}
                maxLength={2000}
                placeholder="Nhập ghi chú thêm..."
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferFormPage;
