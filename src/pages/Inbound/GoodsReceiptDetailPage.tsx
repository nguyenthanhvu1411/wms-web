import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { inboundApi, type ConfirmGoodsReceiptRequest } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { 
  ArrowLeft, CheckCircle, XCircle, Package, MapPin, Calendar,
  Save, Edit, Camera, Barcode, History, Paperclip, Truck, User, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { goodsReceiptStatusLabel, GoodsReceiptStatus } from '@/types/wms-enums';

const GoodsReceiptDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'attachments' | 'audit'>('lines');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '', vehiclePlate: '', driverName: '' });
  
  // Modals state (converted to expanded row for cards)
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { register, control, handleSubmit, reset, watch, setValue, formState: { isDirty } } = useForm<ConfirmGoodsReceiptRequest>({
    defaultValues: {
      receivedDate: new Date().toISOString().slice(0, 16),
      lines: []
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'lines'
  });

  const formValues = watch();

  const { data: gr, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.goodsReceipts, id],
    queryFn: () => inboundApi.getGoodsReceiptById(Number(id)),
    enabled: !!id,
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms'],
    queryFn: () => masterDataApi.getUoms({ pageIndex: 1, pageSize: 500 }),
  });

  const getUomName = (code: string) => {
    const uom = uomsData?.items?.find((u: any) => u.code === code);
    return uom ? uom.name : code;
  };

  useEffect(() => {
    if (gr && gr.lines && !isDirty) {
      reset({
        receivedDate: new Date().toISOString().slice(0, 16),
        lines: gr.lines.map(line => ({
          goodsReceiptLineId: line.id,
          qtyReceived: line.qtyExpected, 
          lotNumber: line.lotNumber || '',
          expiryDate: line.expiryDate ? line.expiryDate.split('T')[0] : '',
          manufactureDate: line.manufactureDate ? line.manufactureDate.split('T')[0] : '',
          serialNumbersStr: line.serialNumbers?.join('\n') || ''
        }))
      });
    }
  }, [gr, reset, isDirty]);

  const invalidateAndToast = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: [...inboundKeys.goodsReceipts, id] });
    queryClient.invalidateQueries({ queryKey: inboundKeys.goodsReceipts });
  };

  const confirmMutation = useMutation({
    mutationFn: (data: ConfirmGoodsReceiptRequest) => inboundApi.confirmGoodsReceipt(Number(id), data),
    onSuccess: () => invalidateAndToast('Đã xác nhận số lượng nhận hàng thành công'),
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = data?.message || data?.error || data?.title || error.message || 'Lỗi khi hoàn tất nhận hàng';
      if (data?.errors && Object.keys(data.errors).length > 0) msg = Object.values(data.errors).flat().join('\n');
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const startReceivingMutation = useMutation({
    mutationFn: () => inboundApi.startReceiving(Number(id)),
    onSuccess: () => invalidateAndToast('Đã bắt đầu nhận hàng'),
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = data?.message || data?.error || data?.title || error.message || 'Lỗi khi bắt đầu nhận hàng';
      if (data?.errors && Object.keys(data.errors).length > 0) msg = Object.values(data.errors).flat().join('\n');
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => inboundApi.updateGoodsReceipt(Number(id), data),
    onSuccess: () => {
      invalidateAndToast('Cập nhật phiếu nhận hàng thành công');
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = data?.message || data?.error || data?.title || error.message || 'Lỗi khi cập nhật phiếu';
      if (data?.errors && Object.keys(data.errors).length > 0) msg = Object.values(data.errors).flat().join('\n');
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => inboundApi.cancelGoodsReceipt(Number(id)),
    onSuccess: () => invalidateAndToast('Đã hủy phiếu nhận hàng'),
    onError: (error: any) => {
      const data = error.response?.data;
      let msg = data?.message || data?.error || data?.title || error.message || 'Lỗi khi hủy phiếu';
      if (data?.errors && Object.keys(data.errors).length > 0) msg = Object.values(data.errors).flat().join('\n');
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  });

  const handleOpenEdit = () => {
    if (gr) {
      setEditForm({
        notes: gr.notes || '',
        vehiclePlate: gr.vehiclePlate || '',
        driverName: gr.driverName || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const onSubmitConfirm = (data: ConfirmGoodsReceiptRequest) => {
    const payload = {
      ...data,
      receivedDate: data.receivedDate ? new Date(data.receivedDate).toISOString() : undefined,
      lines: data.lines.map(line => ({
        ...line,
        qtyReceived: isNaN(line.qtyReceived) || line.qtyReceived === null ? 0 : line.qtyReceived,
        expiryDate: line.expiryDate || undefined,
        manufactureDate: line.manufactureDate || undefined,
        lotNumber: line.lotNumber || undefined,
        serialNumbers: (line as any).serialNumbersStr 
          ? (line as any).serialNumbersStr.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean)
          : []
      }))
    };
    confirmMutation.mutate(payload);
  };

  const handleScanBarcode = (index: number) => {
    // Mock barcode scan filling
    toast.success('Đã quét barcode và tự động điền dữ liệu!');
    const line = gr?.lines?.[index];
    if (line) {
      setValue(`lines.${index}.qtyReceived`, line.qtyExpected);
      if (line.trackLot) {
        setValue(`lines.${index}.lotNumber`, `LOT-${new Date().getTime().toString().slice(-6)}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !gr) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">Không tìm thấy phiếu nhận hàng hoặc có lỗi xảy ra.</p>
        <button onClick={() => navigate('/inbound/goods-receipts')} className="text-primary hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const canEditGr = gr.status === GoodsReceiptStatus.Draft;
  const canStartReceiving = gr.status === GoodsReceiptStatus.Draft;
  const canConfirmReceiving = gr.status === GoodsReceiptStatus.InProgress;
  const canCancelGr = gr.status === GoodsReceiptStatus.Draft || gr.status === GoodsReceiptStatus.InProgress;
  const isDraftOrReceiving = canEditGr || canConfirmReceiving;

  // Calculate Summary metrics
  const totalOrdered = gr.lines?.reduce((sum, l) => sum + ((l as any).qtyOrdered || l.qtyExpected), 0) || 0;
  const totalReceiving = formValues.lines?.reduce((sum, l) => sum + (isNaN(l.qtyReceived) ? 0 : l.qtyReceived), 0) || 0;
  const totalAccepted = gr.lines?.reduce((sum, l) => sum + l.qtyAccepted, 0) || 0;
  const totalRejected = gr.lines?.reduce((sum, l) => sum + l.qtyRejected, 0) || 0;

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      {/* 1. Full Enterprise Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-border mb-6">
        <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inbound/goods-receipts')}
              className="p-2 bg-background hover:bg-background-hover rounded-lg transition-colors border border-border"
            >
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">
                  {gr.grNumber}
                </h1>
                <StatusBadge status={goodsReceiptStatusLabel[gr.status as GoodsReceiptStatus] || 'Unknown'} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canEditGr && (
              <button onClick={handleOpenEdit} className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors flex items-center gap-2 print:hidden">
                <Edit size={16} /> Chỉnh sửa
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors flex items-center gap-2 print:hidden">
              <Printer size={16} /> In Phiếu GR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 text-sm">
          <div>
            <span className="text-text-secondary block mb-1">Kho nhận</span>
            <span className="font-medium flex items-center gap-2"><MapPin size={14} className="text-primary"/> {gr.warehouseName}</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Nhà cung cấp</span>
            <span className="font-medium flex items-center gap-2"><Truck size={14} className="text-primary"/> {(gr as any).supplierName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Số PO</span>
            <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => gr.purchaseOrderId && navigate(`/inbound/purchase-orders/${gr.purchaseOrderId}`)}>{gr.poNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Số ASN</span>
            <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => gr.asnId && navigate(`/inbound/asns/${gr.asnId}`)}>{gr.asnNumber || 'N/A'}</span>
          </div>

          <div>
            <span className="text-text-secondary block mb-1">Cửa nhập/Dock</span>
            <span className="font-medium">REC-01 (Dock 1)</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Biển số xe</span>
            <span className="font-medium">{gr.vehiclePlate || 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Tài xế</span>
            <span className="font-medium">{gr.driverName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-text-secondary block mb-1">Người nhận</span>
            <span className="font-medium flex items-center gap-2"><User size={14} className="text-primary"/> {gr.receivedBy || 'Admin'}</span>
          </div>

          <div>
            <span className="text-text-secondary block mb-1">Bắt đầu lúc</span>
            <span className="font-medium flex items-center gap-2"><Calendar size={14} className="text-primary"/> {gr.receivedDate ? new Date(gr.receivedDate).toLocaleString('vi-VN') : '-'}</span>
          </div>
          <div className="lg:col-span-3">
            <span className="text-text-secondary block mb-1">Ghi chú</span>
            <span className="font-medium">{gr.notes || 'Không có'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 2. Main Content (Left - 75%) */}
        <div className="lg:w-3/4">
          {/* Tabs Navigation */}
          <div className="flex gap-6 border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 font-medium transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Tổng quan
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveTab('lines')}
              className={`pb-3 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'lines' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Chi tiết nhận hàng <span className="bg-bg-secondary text-text-primary px-2 py-0.5 rounded-full text-xs">{gr.lines?.length || 0}</span>
              {activeTab === 'lines' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`pb-3 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'attachments' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Paperclip size={16}/> Tài liệu đính kèm
              {activeTab === 'attachments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'audit' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <History size={16}/> Lịch sử
              {activeTab === 'audit' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
          </div>

          {/* Tab: Lines */}
          {activeTab === 'lines' && (
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto relative">
                <table className="w-full min-w-[1200px] text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-4 py-3 font-medium text-text-secondary w-12">#</th>
                      <th className="px-4 py-3 font-medium text-text-secondary min-w-[280px]">Mã & Tên sản phẩm</th>
                      <th className="px-4 py-3 font-medium text-text-secondary w-20">ĐVT</th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-right">SL Đặt</th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-right">Đã nhận trước đó</th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-right bg-primary/5">Nhận đợt này</th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-right">Còn lại</th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-center">Yêu cầu QC</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Vị trí</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Lô & Serial</th>
                      <th className="px-4 py-3 font-medium text-text-secondary">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {fields.map((field, index) => {
                      const line = gr.lines?.[index];
                      if (!line) return null;
                      
                      const qtyOrdered = (line as any).qtyOrdered || line.qtyExpected;
                      const qtyReceivedBefore = (line as any).qtyPreviouslyReceived || 0;
                      const currentReceiving = formValues.lines?.[index]?.qtyReceived || 0;
                      const qtyRemaining = qtyOrdered - qtyReceivedBefore - currentReceiving;

                      const trackLot = line.trackLot;
                      const trackSerial = line.trackSerialNumber;
                      
                      const serialsStr = (formValues.lines?.[index] as any)?.serialNumbersStr || '';
                      const serialCount = serialsStr.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean).length;

                      return (
                        <React.Fragment key={field.id}>
                          <tr className="hover:bg-background-hover transition-colors">
                            <td className="px-4 py-3 text-text-secondary">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-text-primary">{line.productSku}</div>
                            <div className="text-text-secondary line-clamp-1">{line.productName}</div>
                            <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                              <Barcode size={12}/> {line.productBarcode || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-primary">{getUomName(line.uomCode)}</td>
                          <td className="px-4 py-3 text-right text-text-secondary">{new Intl.NumberFormat('vi-VN').format(qtyOrdered)}</td>
                          <td className="px-4 py-3 text-right text-text-secondary">{new Intl.NumberFormat('vi-VN').format(qtyReceivedBefore)}</td>
                          <td className="px-4 py-3 bg-primary/5">
                            {isDraftOrReceiving ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`lines.${index}.qtyReceived`, { valueAsNumber: true })}
                                  className="w-20 text-right px-2 py-1 bg-white border border-border rounded text-sm focus:outline-none focus:border-primary"
                                />
                                <button type="button" onClick={() => handleScanBarcode(index)} className="p-1 text-text-secondary hover:text-primary transition-colors" title="Quét mã vạch">
                                  <Camera size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-right font-medium text-primary">{new Intl.NumberFormat('vi-VN').format(line.qtyReceived)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-text-primary">{new Intl.NumberFormat('vi-VN').format(qtyRemaining > 0 ? qtyRemaining : 0)}</td>
                          <td className="px-4 py-3 text-center">
                            {gr.requiresQc ? <span className="text-warning font-medium">Có</span> : <span className="text-text-secondary">Không</span>}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">
                            {line.suggestedLocation || 'N/A'} {line.suggestedLocation && <span className="text-xs bg-bg-secondary px-1 rounded ml-1">Đề xuất</span>}
                          </td>
                          <td className="px-4 py-3 space-y-2">
                            {trackLot || trackSerial ? (
                              <button
                                type="button"
                                onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                                className={`text-xs px-3 py-1.5 border rounded-lg flex items-center gap-1 transition-colors ${expandedRow === index ? 'bg-primary/10 border-primary text-primary' : 'bg-bg-secondary border-border hover:bg-bg-tertiary'}`}
                              >
                                {expandedRow === index ? 'Đóng chi tiết' : 'Nhập Lot/Serial'}
                              </button>
                            ) : (
                              <span className="text-text-secondary opacity-50">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs font-medium">
                              {gr.status === GoodsReceiptStatus.Draft && <><span className="w-2 h-2 rounded-full bg-warning"></span> Chờ xử lý</>}
                              {gr.status === GoodsReceiptStatus.InProgress && <><span className="w-2 h-2 rounded-full bg-info"></span> Đang nhận</>}
                              {gr.status === GoodsReceiptStatus.QCPending && <><span className="w-2 h-2 rounded-full bg-sky-500"></span> QC</>}
                              {gr.status >= GoodsReceiptStatus.PendingPutaway && <><span className="w-2 h-2 rounded-full bg-success"></span> Hoàn tất</>}
                            </span>
                          </td>
                        </tr>
                        {/* Expanded Row Content for Collapse/Card UI */}
                        {expandedRow === index && (trackLot || trackSerial) && (
                          <tr className="bg-background-hover/50 border-b border-border transition-all duration-300">
                            <td colSpan={11} className="p-0">
                              <div className="p-6 border-l-4 border-primary grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {trackLot && (
                                  <div className="bg-white rounded-xl shadow-sm border border-border p-5">
                                    <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2">
                                      <Package size={16} className="text-primary"/> Lot Information
                                    </h4>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Mã Lô (Lot Number)</label>
                                        <div className="flex gap-2">
                                          <input type="text" {...register(`lines.${index}.lotNumber`)} disabled={!isDraftOrReceiving} className="flex-1 px-3 py-2 border border-border rounded-lg outline-none focus:border-primary disabled:bg-bg-secondary text-sm" placeholder="Nhập số lô..." />
                                          {isDraftOrReceiving && (
                                            <button type="button" onClick={() => setValue(`lines.${index}.lotNumber`, `LOT-${new Date().getTime().toString().slice(-6)}`)} className="px-3 bg-bg-secondary border border-border rounded-lg text-sm hover:bg-bg-tertiary">Tự động</button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-text-secondary mb-1">NSX (MFG Date)</label>
                                          <input type="date" {...register(`lines.${index}.manufactureDate`)} disabled={!isDraftOrReceiving} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-primary disabled:bg-bg-secondary text-sm" />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-text-secondary mb-1">HSD (EXP Date)</label>
                                          <input type="date" {...register(`lines.${index}.expiryDate`)} disabled={!isDraftOrReceiving} className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-primary disabled:bg-bg-secondary text-sm" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {trackSerial && (
                                  <div className="bg-white rounded-xl shadow-sm border border-border p-5">
                                    <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2 border-b border-border pb-2 justify-between">
                                      <div className="flex items-center gap-2">
                                        <Barcode size={16} className="text-primary"/> Serial Information
                                      </div>
                                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                                        {serialCount} / {currentReceiving} Đã quét
                                      </span>
                                    </h4>
                                    <div className="space-y-4">
                                      {isDraftOrReceiving ? (
                                        <>
                                          <p className="text-xs text-text-secondary">Quét hoặc dán danh sách mã Serial (ngăn cách bằng dấu phẩy hoặc dòng mới):</p>
                                          <textarea
                                            {...register(`lines.${index}.serialNumbersStr` as any)}
                                            className="w-full h-32 px-4 py-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                                            placeholder="SN001&#10;SN002&#10;SN003"
                                          />
                                        </>
                                      ) : (
                                        <div className="text-sm text-text-secondary max-h-32 overflow-y-auto p-3 bg-bg-secondary rounded-lg border border-border">
                                          {(line as any).serialNumbers?.join(', ') || 'Không có dữ liệu serial'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Attachments */}
          {activeTab === 'attachments' && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4 text-text-secondary">
                <Paperclip size={32} />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Chưa có tài liệu đính kèm</h3>
              <p className="text-text-secondary text-sm mb-4">Tải lên phiếu giao hàng, hóa đơn hoặc danh sách đóng gói tại đây.</p>
              <button className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-bg-tertiary">
                Tải lên tệp
              </button>
            </div>
          )}

          {/* Tab: Audit Logs */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-medium text-text-primary mb-6">Dòng thời gian</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-success text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <CheckCircle size={18} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-bg-secondary p-4 rounded border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-text-primary">Đã tạo phiếu</div>
                      <time className="font-caveat font-medium text-text-secondary text-sm">{gr.receivedDate ? new Date(gr.receivedDate).toLocaleDateString('vi-VN') : 'N/A'}</time>
                    </div>
                    <div className="text-text-secondary text-sm">Bản nháp Goods Receipt được tạo từ ASN/PO.</div>
                  </div>
                </div>
                {gr.status >= GoodsReceiptStatus.InProgress && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Package size={18} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-bg-secondary p-4 rounded border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-text-primary">Bắt đầu nhận hàng</div>
                        <time className="font-caveat font-medium text-text-secondary text-sm">Vừa xong</time>
                      </div>
                      <div className="text-text-secondary text-sm">Nhân viên kho đã bắt đầu quá trình nhận.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Summary Panel (Right - 25%) */}
        <div className="lg:w-1/4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-5 sticky top-6">
            <h3 className="font-semibold text-text-primary mb-4 border-b border-border pb-3">Bảng tóm tắt</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary">Tổng số dòng</span>
                <span className="font-medium bg-bg-secondary px-2 py-0.5 rounded">{gr.lines?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary">Tổng SL Đặt</span>
                <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(totalOrdered)}</span>
              </div>
              <div className="flex justify-between items-center py-1 bg-primary/5 px-2 -mx-2 rounded">
                <span className="text-primary font-medium">Đang nhận</span>
                <span className="font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(totalReceiving)}</span>
              </div>
              <div className="border-t border-border my-2"></div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary">Đạt (QC)</span>
                <span className="font-medium text-success">{new Intl.NumberFormat('vi-VN').format(totalAccepted)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary">Lỗi (QC)</span>
                <span className="font-medium text-error">{new Intl.NumberFormat('vi-VN').format(totalRejected)}</span>
              </div>
              <div className="border-t border-border my-2"></div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Cần QC</span>
                <span className="font-medium">{gr.requiresQc ? new Intl.NumberFormat('vi-VN').format(totalReceiving) : 0}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-secondary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info"></span> Cần cất trữ</span>
                <span className="font-medium">{gr.requiresQc ? new Intl.NumberFormat('vi-VN').format(totalAccepted) : new Intl.NumberFormat('vi-VN').format(totalReceiving)}</span>
              </div>
            </div>

            {/* Action Footer integrated into Sidebar */}
            <div className="mt-6 pt-4 border-t border-border flex flex-col gap-3">
              {canStartReceiving && (
                <button onClick={() => startReceivingMutation.mutate()} disabled={startReceivingMutation.isPending} className="w-full py-2.5 bg-warning text-white rounded-lg font-medium hover:bg-warning/90 transition-colors flex justify-center items-center gap-2 shadow-sm">
                  <Package size={18} /> Bắt đầu nhận
                </button>
              )}
              {canConfirmReceiving && (
                <>
                  <button onClick={handleSubmit(onSubmitConfirm)} disabled={confirmMutation.isPending} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors flex justify-center items-center gap-2 shadow-sm">
                    <Save size={18} /> Hoàn tất nhận (Receive)
                  </button>
                  <button className="w-full py-2.5 bg-bg-secondary text-text-primary border border-border rounded-lg font-medium hover:bg-bg-tertiary transition-colors shadow-sm">
                    Lưu Nháp
                  </button>
                </>
              )}
              {gr.status === GoodsReceiptStatus.QCPending && gr.qualityCheckId && (
                <button onClick={() => navigate(`/inbound/quality-checks/${gr.qualityCheckId}`)} className="w-full py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors flex justify-center items-center gap-2 shadow-sm">
                  Thực hiện QC
                </button>
              )}
              {canCancelGr && (
                <button onClick={() => { if (window.confirm('Xác nhận hủy GR?')) cancelMutation.mutate(); }} className="w-full py-2.5 bg-error/10 text-error rounded-lg font-medium hover:bg-error/20 transition-colors">
                  Hủy GR
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Popups */}
      {/* Edit GR Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary">
              <h3 className="text-lg font-semibold text-text-primary">Chỉnh sửa thông tin</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-secondary hover:text-text-primary"><XCircle size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Ghi chú</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:border-primary resize-none" rows={3}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Biển số xe</label>
                <input type="text" value={editForm.vehiclePlate} onChange={(e) => setEditForm(prev => ({ ...prev, vehiclePlate: e.target.value }))} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Tên tài xế</label>
                <input type="text" value={editForm.driverName} onChange={(e) => setEditForm(prev => ({ ...prev, driverName: e.target.value }))} className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:border-primary"/>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-bg-secondary">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Hủy</button>
              <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoodsReceiptDetailPage;
