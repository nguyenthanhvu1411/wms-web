import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { ArrowLeft, Save, Play, Check, Truck, Building2, MapPin, Calendar, FileText, ClipboardCheck, Tag, Hash, FileCheck, CircleDollarSign } from 'lucide-react';
import { message, Spin, Modal, Select, Upload, DatePicker, Input, InputNumber } from 'antd';
import { Upload as UploadIcon } from 'lucide-react';
const { Dragger } = Upload;
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ReturnToVendorStatus, returnToVendorStatusLabel, qualityCheckResultLabel } from '@/types/wms-enums';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/authStore';

const VendorReturnFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const isViewMode = !!id;
  const returnId = Number(id);

  const { data: returnData, isLoading } = useQuery({
    queryKey: ['vendorReturn', returnId],
    queryFn: () => inboundApi.getVendorReturnById(returnId),
    enabled: isViewMode
  });

  const { data: qcsData, isLoading: isLoadingQcs } = useQuery({
    queryKey: ['failedQcsForReturn'],
    queryFn: () => inboundApi.getQualityChecks({ pageSize: 50 }), // Fetch all, filter locally
    enabled: !isViewMode
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inboundApi.createVendorReturnFromQc(data),
    onSuccess: () => {
      message.success('Tạo phiếu trả hàng NCC thành công');
      queryClient.invalidateQueries({ queryKey: ['inbound', 'returns', 'vendor'] });
      navigate('/returns/vendor');
    },
    onError: (err: any) => message.error(err.message || 'Lỗi khi tạo')
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, data }: { action: 'approve' | 'ship' | 'complete' | 'cancel', data?: any }) => {
      switch (action) {
        case 'approve': return inboundApi.approveVendorReturn(returnId);
        case 'ship': return inboundApi.shipVendorReturn(returnId, data);
        case 'complete': return inboundApi.completeVendorReturn(returnId);
        case 'cancel': return inboundApi.cancelVendorReturn(returnId);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: (_, variables) => {
      message.success(`Đã thực hiện thao tác: ${variables.action}`);
      queryClient.invalidateQueries({ queryKey: ['inbound', 'returns', 'vendor'] });
      queryClient.invalidateQueries({ queryKey: ['vendorReturn', returnId] });
    },
    onError: (err: any) => message.error(err.message || 'Lỗi thao tác')
  });

  const [formData, setFormData] = useState<any>({
    lines: [],
    attachmentType: 'QC Report'
  });

  const { data: selectedQcDetails, isFetching: isFetchingQc } = useQuery({
    queryKey: ['qcDetailsForReturn', formData.qualityCheckId],
    queryFn: () => inboundApi.getQualityCheckById(formData.qualityCheckId!),
    enabled: !!formData.qualityCheckId && !isViewMode
  });

  const { data: grDetails } = useQuery({
    queryKey: ['goodsReceiptForReturn', selectedQcDetails?.goodsReceiptId],
    queryFn: () => inboundApi.getGoodsReceiptById(selectedQcDetails!.goodsReceiptId!),
    enabled: !!selectedQcDetails?.goodsReceiptId && !isViewMode
  });

  const { data: supplierDetails } = useQuery({
    queryKey: ['supplierForReturn', grDetails?.supplierId || returnData?.supplierId],
    queryFn: () => masterDataApi.getSupplierById(grDetails?.supplierId || returnData?.supplierId || 0),
    enabled: !!(grDetails?.supplierId || returnData?.supplierId)
  });

  const productIds = Array.from(new Set(formData.lines?.map((l: any) => l.productId) || [])) as number[];
  const productQueries = useQueries({
    queries: productIds.map(id => ({
      queryKey: ['productMasterData', id],
      queryFn: () => masterDataApi.getProductById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000
    }))
  });
  
  const productsMap = productQueries.reduce((acc, query) => {
    if (query.data) acc[query.data.id] = query.data;
    return acc;
  }, {} as Record<number, any>);

  useEffect(() => {
    if (selectedQcDetails && !isViewMode) {
      const lines = selectedQcDetails.lines
        ?.filter(item => item.lineResult === 3 || item.lineResult === 4) // Failed or Partial
        .map(item => ({
          qualityCheckItemId: item.id,
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          qtyToReturn: item.qtyFailed || item.qtyInspected, // Default to failed qty
          maxQty: item.qtyInspected,
          qtyInspected: item.qtyInspected,
          qtyPassed: item.qtyPassed,
          qtyFailed: item.qtyFailed,
          unitCost: 0,
          returnValue: 0,
          lotNumber: item.lotNumber,
          serialNumbers: item.serialNumbers?.join(', ') || '',
          sourceBucket: 'Damaged',
          notes: item.notes || '',
          defectCode: 'DEF-01',
          defectDesc: item.notes || 'Không đạt chuẩn',
          qcDecision: 'Reject'
        })) || [];
        
      setFormData((prev: any) => ({
        ...prev,
        lines,
        grNumber: grDetails?.grNumber,
        asnNumber: grDetails?.asnNumber,
        poNumber: grDetails?.poNumber
      }));
    }
  }, [selectedQcDetails, grDetails, isViewMode]);

  useEffect(() => {
    if (!isViewMode && formData.lines?.length > 0 && Object.keys(productsMap).length > 0) {
      let changed = false;
      const updatedLines = formData.lines.map((line: any) => {
        const prod = productsMap[line.productId];
        if (prod && !line.unitCost) {
          changed = true;
          return {
            ...line,
            unitCost: prod.costPrice || 0,
            returnValue: (line.qtyToReturn || 0) * (prod.costPrice || 0),
            brand: prod.brand || '—',
            manufacturer: prod.manufacturer || '—',
            country: prod.countryOfOrigin || '—'
          };
        }
        return line;
      });
      if (changed) {
        const initialTotal = updatedLines.reduce((sum: number, l: any) => sum + (l.returnValue || 0), 0);
        setFormData((prev: any) => ({ ...prev, lines: updatedLines, supplierRefund: prev.supplierRefund || initialTotal }));
      }
    }
  }, [productsMap, isViewMode]);

  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shipBucketSelections, setShipBucketSelections] = useState<Record<number, string>>({});

  const handleOpenShipModal = () => {
    const initialSelections: Record<number, string> = {};
    formData.lines?.forEach((_: any, index: number) => {
      initialSelections[index] = 'QtyQuarantined';
    });
    setShipBucketSelections(initialSelections);
    setIsShipModalOpen(true);
  };

  const handleConfirmShip = () => {
    actionMutation.mutate({ action: 'ship', data: { buckets: shipBucketSelections } });
    setIsShipModalOpen(false);
  };

  useEffect(() => {
    if (isViewMode && returnData) {
      setFormData({
        purchaseOrderId: returnData.purchaseOrderId,
        poNumber: returnData.poNumber,
        asnNumber: returnData.asnNumber,
        grNumber: returnData.grNumber,
        qcNumber: returnData.qcNumber,
        inspectionNumber: returnData.inspectionNumber,
        supplierId: returnData.supplierId,
        supplierName: returnData.supplierName,
        supplierCode: returnData.supplierCode,
        contactPerson: returnData.contactPerson,
        supplierPhone: returnData.supplierPhone,
        supplierEmail: returnData.supplierEmail,
        supplierAddress: returnData.supplierAddress,
        warehouseId: returnData.warehouseId,
        warehouseName: returnData.warehouseName,
        reason: returnData.reason,
        notes: returnData.notes,
        carrierName: returnData.carrierName,
        trackingNumber: returnData.trackingNumber,
        vehicleNumber: returnData.vehicleNumber,
        driverName: returnData.driverName,
        estimatedArrival: returnData.estimatedArrival,
        creditNote: returnData.creditNote,
        debitNote: returnData.debitNote,
        supplierRefund: returnData.supplierRefund,
        qcDecision: returnData.qcDecision,
        lines: returnData.lines?.map((line: any) => ({
           ...line,
           returnValue: (line.qtyReturned || 0) * (line.unitCost || 0)
        })) || []
      });
    }
  }, [isViewMode, returnData]);

  const handleUpdateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...(formData.lines || [])];
    const currentLine = updatedLines[index];
    
    currentLine[field] = value;
    
    if (field === 'qtyToReturn') {
       currentLine.returnValue = value * (currentLine.unitCost || 0);
    }
    if (field === 'unitCost') {
       currentLine.returnValue = (currentLine.qtyToReturn || 0) * value;
    }
    
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleSave = () => {
    if (!formData.qualityCheckId) {
      message.error('Vui lòng chọn Phiếu QC (Quality Check) Failed');
      return;
    }
    
    const activeLines = formData.lines?.filter((l: any) => l.qtyToReturn > 0);
    
    if (!activeLines || activeLines.length === 0) {
      message.error('Phải có ít nhất 1 sản phẩm cần trả (Số lượng > 0)');
      return;
    }
    
    const payload = {
      qualityCheckId: formData.qualityCheckId,
      reason: formData.reason,
      notes: formData.notes,
      carrierName: formData.carrierName,
      trackingNumber: formData.trackingNumber,
      vehicleNumber: formData.vehicleNumber,
      driverName: formData.driverName,
      estimatedArrival: formData.estimatedArrival,
      supplierRefund: formData.supplierRefund,
      creditNote: formData.creditNote,
      debitNote: formData.debitNote,
      items: activeLines.map((l: any) => ({
        qualityCheckItemId: l.qualityCheckItemId,
        qtyToReturn: l.qtyToReturn,
        sourceBucket: l.sourceBucket,
        notes: l.notes
      }))
    };
    createMutation.mutate(payload);
  };

  const handleAction = (action: 'approve' | 'ship' | 'complete' | 'cancel') => {
    actionMutation.mutate({ action });
  };

  if (isViewMode && isLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const status = (returnData?.status as ReturnToVendorStatus) || ReturnToVendorStatus.Draft;

  // Calculate footer totals
  const totalSKUs = formData.lines?.filter((l: any) => (l.qtyToReturn > 0 || l.qtyReturned > 0) || isViewMode).length || 0;
  const totalQty = formData.lines?.reduce((sum: number, l: any) => sum + (isViewMode ? (l.qtyReturned || 0) : (l.qtyToReturn || 0)), 0) || 0;
  const totalAmount = formData.lines?.reduce((sum: number, l: any) => sum + (l.returnValue || 0), 0) || 0;
  const totalLoss = totalAmount - (formData.supplierRefund || 0);

  return (
    <div className="max-w-[1600px] mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/returns/vendor')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {isViewMode ? `Trả NCC: ${returnData?.rtvNumber || returnData?.returnNumber}` : 'Tạo mới Phiếu trả NCC (RTV)'}
              </h1>
              {isViewMode && (
                <StatusBadge 
                  status={Object.keys(ReturnToVendorStatus).find(key => (ReturnToVendorStatus as any)[key] === status) || 'Draft'} 
                  text={returnToVendorStatusLabel[status] || 'Unknown'} 
                />
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Trả hàng lỗi không đạt QC cho nhà cung cấp</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isViewMode ? (
              <button
                onClick={handleSave}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
                disabled={createMutation.isPending}
              >
                <Save size={18} /> TẠO PHIẾU RTV
              </button>
          ) : (
            <>
              {status === ReturnToVendorStatus.Draft && (
                <PermissionGuard permissions="VendorReturn.Approve">
                  <button
                    onClick={() => handleAction('approve')}
                    className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                    disabled={actionMutation.isPending}
                  >
                    <Check size={18} /> DUYỆT PHIẾU
                  </button>
                </PermissionGuard>
              )}
              {status === ReturnToVendorStatus.Approved && (
                <PermissionGuard permissions="VendorReturn.Ship">
                  <button
                    onClick={handleOpenShipModal}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                    disabled={actionMutation.isPending}
                  >
                    <Truck size={18} /> XUẤT HÀNG
                  </button>
                </PermissionGuard>
              )}
              {status === ReturnToVendorStatus.Shipped && (
                <PermissionGuard permissions="VendorReturn.Complete">
                  <button
                    onClick={() => handleAction('complete')}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    disabled={actionMutation.isPending}
                  >
                    <Play size={18} /> HOÀN THÀNH
                  </button>
                </PermissionGuard>
              )}
              {(status === ReturnToVendorStatus.Draft || status === ReturnToVendorStatus.Approved) && (
                 <PermissionGuard permissions="VendorReturn.Cancel">
                  <button
                    onClick={() => handleAction('cancel')}
                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm"
                    disabled={actionMutation.isPending}
                  >
                    HỦY PHIẾU
                  </button>
                 </PermissionGuard>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Info Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="text-slate-500" size={18} />
            <h3 className="font-semibold text-slate-800">Thông tin Khởi tạo (Header)</h3>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phiếu QC Failed <span className="text-red-500">*</span>
            </label>
            {isViewMode ? (
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-700 font-medium h-[42px]"
                value={formData.qcNumber || '—'}
                disabled
              />
            ) : (
              <Select
                showSearch
                placeholder="Chọn QC lỗi..."
                className="w-full"
                style={{ height: '42px' }}
                loading={isLoadingQcs}
                value={formData.qualityCheckId}
                onChange={val => setFormData({ ...formData, qualityCheckId: val })}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={qcsData?.items
                  ?.filter(qc => qc.result === 3 || qc.result === 4)
                  .map(qc => ({
                  value: qc.id,
                  label: `${qc.qcNumber} - ${qc.grNumber || 'N/A'}`
                }))}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Lý do trả hàng <span className="text-red-500">*</span></label>
            <Select
              className="w-full"
              style={{ height: '42px' }}
              placeholder="Chọn lý do..."
              value={formData.reason || undefined}
              onChange={val => setFormData({ ...formData, reason: val })}
              disabled={isViewMode}
              options={[
                { value: 'Defective', label: 'Hàng lỗi' },
                { value: 'Damaged', label: 'Hàng hỏng hóc' },
                { value: 'Failed QC', label: 'Không đạt chuẩn' },
                { value: 'Other', label: 'Lý do khác' },
              ]}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">ĐV Vận chuyển</label>
            {isViewMode ? (
              <input 
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
                value={formData.carrierName || ''} 
                disabled
              />
            ) : (
              <Select
                className="w-full"
                style={{ height: '42px' }}
                placeholder="Chọn ĐV Vận chuyển..."
                value={formData.carrierName || undefined}
                onChange={val => {
                  const newTracking = formData.trackingNumber || `RTV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                  setFormData({ ...formData, carrierName: val, trackingNumber: newTracking })
                }}
                disabled={isViewMode}
                options={[
                  { value: 'Viettel Post', label: 'Viettel Post' },
                  { value: 'Giao Hàng Tiết Kiệm', label: 'Giao Hàng Tiết Kiệm' },
                  { value: 'Giao Hàng Nhanh', label: 'Giao Hàng Nhanh' },
                  { value: 'VNPost', label: 'VNPost' },
                  { value: 'Ahamove', label: 'Ahamove' },
                  { value: 'Shopee Express', label: 'Shopee Express' },
                  { value: 'J&T Express', label: 'J&T Express' },
                ]}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã vận đơn</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500 h-[42px]"
              placeholder="Hệ thống tự sinh..."
              value={formData.trackingNumber || ''}
              disabled
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài xế</label>
            <Input 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg h-[42px]"
              placeholder="Tên tài xế..." 
              value={formData.driverName || ''} 
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Biển số xe</label>
            <Input 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg h-[42px]"
              placeholder="VD: 51H-123.45" 
              value={formData.vehicleNumber || ''} 
              onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Notes)</label>
            <Input 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg h-[42px]"
              placeholder="Ghi chú nội bộ..." 
              value={formData.notes || ''} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Enhanced Details Header */}
        {((selectedQcDetails && !isViewMode) || isViewMode) && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Building2 size={12}/> Nhà cung cấp</p>
              <p className="font-medium text-slate-800">{supplierDetails?.name || formData.supplierName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mã NCC (Supplier Code)</p>
              <p className="font-medium text-slate-800">{supplierDetails?.code || formData.supplierCode || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">SĐT / Email NCC</p>
              <p className="font-medium text-slate-800 text-sm">
                {supplierDetails?.phone || formData.supplierPhone || formData.supplierEmail ? 
                  `${supplierDetails?.phone || formData.supplierPhone || ''} ${formData.supplierEmail ? `/ ${formData.supplierEmail}` : ''}` 
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Kho trả hàng</p>
              <p className="font-medium text-slate-800 text-sm truncate">{isViewMode ? formData.warehouseName : (grDetails?.warehouseName || formData.warehouseName || '—')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Tag size={12}/> Trạng thái</p>
              <div className="mt-1">
                <StatusBadge 
                  status={Object.keys(ReturnToVendorStatus).find(key => (ReturnToVendorStatus as any)[key] === status) || 'Draft'} 
                  text={returnToVendorStatusLabel[status] || 'Unknown'} 
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mã Nhập Kho (GR)</p>
              <p className="font-medium text-slate-800">{formData.grNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Đơn mua hàng (PO)</p>
              <p className="font-medium text-slate-800">{formData.poNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mã ASN</p>
              <p className="font-medium text-slate-800">{formData.asnNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Ngày trả (Dự kiến)</p>
              {isViewMode ? (
                 <p className="font-medium text-slate-800">{formData.estimatedArrival ? dayjs(formData.estimatedArrival).format('DD/MM/YYYY') : dayjs().add(3, 'day').format('DD/MM/YYYY')}</p>
              ) : (
                 <DatePicker 
                   className="w-full"
                   format="DD/MM/YYYY"
                   value={formData.estimatedArrival ? dayjs(formData.estimatedArrival) : undefined}
                   onChange={date => setFormData({ ...formData, estimatedArrival: date ? date.toISOString() : undefined })}
                 />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Người liên hệ</p>
              <p className="font-medium text-slate-800">{supplierDetails?.contactPerson || formData.contactPerson || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CircleDollarSign size={12}/> Tổng tiền (Return Value)</p>
              <p className="font-medium text-slate-800 text-blue-700">{totalAmount.toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Tiền hoàn lại (Dự kiến)</p>
              {isViewMode ? (
                <p className="font-medium text-slate-800 text-emerald-600">{(formData.supplierRefund || 0).toLocaleString('vi-VN')} đ</p>
              ) : (
                <InputNumber 
                  className="w-full max-w-[120px]"
                  placeholder="0" 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  value={formData.supplierRefund || 0}
                  onChange={val => setFormData({ ...formData, supplierRefund: val })}
                />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Thiệt hại ước tính</p>
              <p className="font-medium text-red-600">{totalLoss > 0 ? totalLoss.toLocaleString('vi-VN') + ' đ' : '0 đ'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><FileText size={12}/> Credit Note</p>
              {isViewMode ? (
                <p className="font-medium text-slate-800">{formData.creditNote || '—'}</p>
              ) : (
                <Input 
                  className="w-full max-w-[150px]"
                  placeholder="Nhập mã (nếu có)..." 
                  value={formData.creditNote || ''}
                  onChange={e => setFormData({ ...formData, creditNote: e.target.value })}
                />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><FileText size={12}/> Debit Note</p>
              {isViewMode ? (
                <p className="font-medium text-slate-800">{formData.debitNote || '—'}</p>
              ) : (
                <Input 
                  className="w-full max-w-[150px]"
                  placeholder="Nhập mã (nếu có)..." 
                  value={formData.debitNote || ''}
                  onChange={e => setFormData({ ...formData, debitNote: e.target.value })}
                />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Người tạo</p>
              <p className="font-medium text-slate-800">{isViewMode ? (returnData?.createdBy || '—') : (user?.fullName || user?.username || '—')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Danh sách sản phẩm lỗi (QC Failed Lines)</h3>
          {isFetchingQc && <Spin size="small" />}
        </div>
        <div className="p-0">
          {!formData.lines || formData.lines.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">
              {!formData.qualityCheckId 
                ? 'Vui lòng chọn Phiếu QC để xem sản phẩm.'
                : 'QC này không có sản phẩm nào lỗi (Failed).'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1500px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                    <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">SKU</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 text-center">ĐVT</th>
                 
                    <th className="px-4 py-3">Lot/Serial</th>
                    <th className="px-4 py-3">Hạn sử dụng</th>
                    <th className="px-4 py-3 text-right">SL Nhận</th>
                    <th className="px-4 py-3 text-right text-emerald-600">SL Đạt (Passed)</th>
                    <th className="px-4 py-3 text-right text-red-600">SL Lỗi (Failed)</th>
                    <th className="px-4 py-3 text-right bg-blue-50 border-l border-r border-slate-200">SL Trả Lại</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                    <th className="px-4 py-3 min-w-[150px]">Bucket Nguồn</th>
                    <th className="px-4 py-3">Mã lỗi (Defect)</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.lines.map((line: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 group-hover:bg-slate-50">
                        {line.productSku}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={line.productName}>
                        {line.productName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600">{productsMap[line.productId]?.uomCode || '—'}</td>
                      
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {line.lotNumber && <div>Lot: {line.lotNumber}</div>}
                        {line.serialNumbers && <div>SN: {line.serialNumbers}</div>}
                        {!line.lotNumber && !line.serialNumbers && '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">—</td>
                      <td className="px-4 py-3 text-right text-xs">{line.qtyInspected || 0}</td>
                      <td className="px-4 py-3 text-right text-xs text-emerald-600 font-medium">{line.qtyPassed || 0}</td>
                      <td className="px-4 py-3 text-right text-xs text-red-600 font-bold">{line.qtyFailed || 0}</td>
                      
                      <td className="px-4 py-2 bg-blue-50/30 border-l border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max={!isViewMode ? line.maxQty : undefined}
                          className="w-full min-w-[70px] px-2 py-1.5 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 text-right font-bold text-blue-700 disabled:bg-transparent disabled:border-transparent bg-white outline-none"
                          value={isViewMode ? (line.qtyReturned || 0) : (line.qtyToReturn || 0)}
                          onChange={e => handleUpdateLine(index, 'qtyToReturn', Number(e.target.value))}
                          disabled={isViewMode}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {isViewMode ? (line.unitCost ? line.unitCost.toLocaleString('vi-VN') : '—') : (
                          <input
                            type="number"
                            className="w-[80px] px-2 py-1 border border-slate-300 rounded text-right"
                            value={line.unitCost || 0}
                            onChange={e => handleUpdateLine(index, 'unitCost', Number(e.target.value))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                        {line.returnValue ? line.returnValue.toLocaleString('vi-VN') : '0'} đ
                      </td>
                      <td className="px-4 py-3">
                        {isViewMode ? (
                          <div className="text-slate-600 text-sm font-medium">{line.sourceBucket || 'Damaged'}</div>
                        ) : (
                          <Select
                            className="w-full text-xs"
                            value={line.sourceBucket || 'Damaged'}
                            onChange={val => handleUpdateLine(index, 'sourceBucket', val)}
                            options={[
                              { value: 'Quarantine', label: 'Quarantine' },
                              { value: 'Damaged', label: 'Damaged' },
                            ]}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{line.defectCode || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {isViewMode ? (line.notes || '—') : <input type="text" className="w-[120px] px-2 py-1 border border-slate-300 rounded text-xs" value={line.notes || ''} onChange={e => handleUpdateLine(index, 'notes', e.target.value)} placeholder="Ghi chú..." />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Attachments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="text-slate-500" size={18} />
              <h3 className="font-semibold text-slate-800">Tệp đính kèm & Chứng từ (Attachments)</h3>
            </div>
         </div>
         <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-r border-slate-100 pr-6">
               <label className="block text-sm font-medium text-slate-700 mb-2">Loại chứng từ</label>
               <Select 
                  className="w-full mb-4" 
                  value={formData.attachmentType}
                  onChange={val => setFormData({ ...formData, attachmentType: val })}
                  options={[
                    { value: 'QC Report', label: 'QC Report / Biên bản kiểm định' },
                    { value: 'Defect Image', label: 'Defect Image / Ảnh lỗi SP' },
                    { value: 'Video', label: 'Video bằng chứng' },
                    { value: 'Supplier Claim', label: 'Supplier Claim / Biên bản khiếu nại' },
                    { value: 'Invoice', label: 'Hóa đơn / Invoice' },
                    { value: 'Credit Note', label: 'Credit Note' },
                    { value: 'Delivery Proof', label: 'Delivery Proof / Biên bản giao hàng' }
                  ]}
               />
               <p className="text-xs text-slate-500 leading-relaxed">
                 Phân loại tệp đính kèm giúp việc đối soát với nhà cung cấp dễ dàng hơn. Hệ thống hỗ trợ PDF, JPG, PNG và MP4 (Max 25MB).
               </p>
            </div>
            <div className="md:col-span-2">
              <Dragger
                name="file"
                multiple={true}
                listType="picture"
                action="/api/upload" // Fake endpoint
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 1000)}
                onChange={(info) => {
                  const { status } = info.file;
                  if (status === 'done') {
                    message.success(`${info.file.name} tải lên thành công.`);
                  } else if (status === 'error') {
                    message.error(`${info.file.name} tải lên thất bại.`);
                  }
                }}
              >
                 <p className="ant-upload-drag-icon">
                   <UploadIcon className="mx-auto text-slate-400" size={40} />
                 </p>
                 <p className="ant-upload-text">Kéo thả file vào đây hoặc Click để tải lên</p>
                 <p className="ant-upload-hint text-xs text-slate-400 mt-2">
                   Hỗ trợ nhiều file cùng lúc.
                 </p>
              </Dragger>
            </div>
         </div>
      </div>

      {/* Footer Fixed Summary */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 px-6 z-50 flex justify-between items-center">
         <div className="flex gap-8">
            <div>
               <p className="text-xs text-slate-500">Tổng mã sản phẩm (SKU)</p>
               <p className="font-bold text-lg text-slate-800">{totalSKUs}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500">Tổng số lượng (Qty)</p>
               <p className="font-bold text-lg text-slate-800">{totalQty}</p>
            </div>
            <div>
               <p className="text-xs text-slate-500">Tổng tiền hoàn trả</p>
               <p className="font-bold text-lg text-blue-700">{totalAmount.toLocaleString('vi-VN')} đ</p>
            </div>
            {totalLoss > 0 && (
              <div>
                 <p className="text-xs text-slate-500">Thiệt hại ước tính</p>
                 <p className="font-bold text-lg text-red-600">{totalLoss.toLocaleString('vi-VN')} đ</p>
              </div>
            )}
         </div>
         <div className="flex items-center gap-4">
           {isViewMode && (
             <div className="text-right mr-4">
               <p className="text-xs text-slate-500">Tạo bởi: <span className="font-medium text-slate-700">{returnData?.createdBy || 'System'}</span></p>
               <p className="text-xs text-slate-400">{returnData?.createdAt ? dayjs(returnData.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</p>
             </div>
           )}
           <button
             onClick={() => navigate('/returns/vendor')}
             className="px-6 py-2.5 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
           >
             ĐÓNG
           </button>
           {!isViewMode && (
             <button
               onClick={handleSave}
               className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
               disabled={createMutation.isPending}
             >
               <Save size={18} /> TẠO PHIẾU
             </button>
           )}
         </div>
      </div>

      <Modal
        title="Chọn loại Tồn kho để xuất"
        open={isShipModalOpen}
        onOk={handleConfirmShip}
        onCancel={() => setIsShipModalOpen(false)}
        okText="Xác nhận Xuất"
        cancelText="Hủy"
        okButtonProps={{ disabled: actionMutation.isPending, className: 'bg-primary' }}
      >
        <p className="mb-4 text-slate-600">
          Vui lòng chọn trạng thái tồn kho (Bucket) thực tế đang giữ hàng để hệ thống trừ đúng số lượng.
        </p>
        <div className="flex flex-col gap-3">
          {formData.lines?.map((line: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div>
                <div className="font-medium text-sm">{line.productSku}</div>
                <div className="text-xs text-slate-500 truncate max-w-[200px]" title={line.productName}>{line.productName || 'N/A'}</div>
                <div className="text-xs text-slate-500 mt-1">Số lượng xuất: <span className="font-bold text-slate-700">{line.qtyToReturn || line.qtyReturned}</span></div>
              </div>
              <Select
                value={shipBucketSelections[idx]}
                onChange={(val) => setShipBucketSelections(prev => ({ ...prev, [idx]: val }))}
                className="w-48"
                options={[
                  { value: 'QtyQuarantined', label: 'Quarantined (Chờ XL)' },
                  { value: 'QtyDamaged', label: 'Damaged (Hư hỏng)' },
                ]}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default VendorReturnFormPage;
