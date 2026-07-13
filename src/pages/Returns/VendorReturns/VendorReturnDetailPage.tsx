import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendorReturn, useShipVendorReturn, useCompleteVendorReturn } from './hooks/useVendorReturns';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundApi } from '@/api/inboundApi';
import { ArrowLeft, Truck, CheckCircle, ClipboardCheck, History, Image as ImageIcon, TrendingDown, Check, Play, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ReturnToVendorStatus, returnToVendorStatusLabel } from '@/types/wms-enums';
import { TimelineStepper, type TimelineStep } from '@/components/Shared/TimelineStepper';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { message, Modal, Tabs, Input, Select } from 'antd';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';
import dayjs from 'dayjs';

const getStatusSteps = (status: number): TimelineStep[] => {
  return [
    { status: 1, label: 'Tạo phiếu', isCompleted: status >= ReturnToVendorStatus.Draft, timestamp: null, actor: 'System', duration: null, isCurrent: status === ReturnToVendorStatus.Draft, isFailed: false },
    { status: 2, label: 'Chờ duyệt', isCompleted: status >= ReturnToVendorStatus.Submitted, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnToVendorStatus.Submitted, isFailed: false },
    { status: 3, label: 'Đã duyệt', isCompleted: status >= ReturnToVendorStatus.Approved, timestamp: null, actor: 'Manager', duration: null, isCurrent: status === ReturnToVendorStatus.Approved, isFailed: false },
    { status: 4, label: 'Đang giao hàng', isCompleted: status >= ReturnToVendorStatus.Shipped, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnToVendorStatus.Shipped, isFailed: false },
    { status: 5, label: 'Hoàn thành', isCompleted: status >= ReturnToVendorStatus.Completed, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnToVendorStatus.Completed, isFailed: false },
  ];
};

const VendorReturnDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rtvId = Number(id);

  const { data: returnData, isLoading } = useVendorReturn(rtvId);
  const shipMutation = useShipVendorReturn();
  const completeMutation = useCompleteVendorReturn();

  const actionMutation = useMutation({
    mutationFn: ({ action, data }: { action: 'submit' | 'approve' | 'reject' | 'cancel', data?: any }) => {
      switch (action) {
        case 'submit': return inboundApi.submitVendorReturn(rtvId);
        case 'approve': return inboundApi.approveVendorReturn(rtvId);
        case 'cancel': return inboundApi.cancelVendorReturn(rtvId);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: (_, variables) => {
      message.success(`Đã thực hiện thao tác: ${variables.action}`);
      queryClient.invalidateQueries({ queryKey: ['vendorReturn', rtvId] });
      queryClient.invalidateQueries({ queryKey: ['inbound', 'returns', 'vendor'] });
    },
    onError: (err: any) => message.error(err.message || 'Lỗi thao tác')
  });

  const { data: supplierDetails } = useQuery({
    queryKey: ['supplierForReturnDetail', returnData?.supplierId],
    queryFn: () => masterDataApi.getSupplierById(returnData!.supplierId),
    enabled: !!returnData?.supplierId
  });

  const { data: qcDetails } = useQuery({
    queryKey: ['qcForReturnDetail', returnData?.qualityCheckId],
    queryFn: () => inboundApi.getQualityCheckById(returnData!.qualityCheckId!),
    enabled: !!returnData?.qualityCheckId
  });

  const { data: grDetails } = useQuery({
    queryKey: ['grForReturnDetail', returnData?.goodsReceiptId],
    queryFn: () => inboundApi.getGoodsReceiptById(returnData!.goodsReceiptId!),
    enabled: !!returnData?.goodsReceiptId
  });

  const { data: warehouseDetails } = useQuery({
    queryKey: ['warehouseForReturnDetail', returnData?.warehouseId],
    queryFn: () => masterDataApi.getWarehouseById(returnData!.warehouseId),
    enabled: !!returnData?.warehouseId
  });

  const { data: locations } = useQuery({
    queryKey: ['locationsForReturnDetail', returnData?.warehouseId],
    queryFn: () => masterDataApi.getLocations({ warehouseId: returnData!.warehouseId, pageSize: 100 }),
    enabled: !!returnData?.warehouseId
  });

  const productIds = Array.from(new Set(returnData?.lines?.map((l: any) => l.productId) || [])) as number[];
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

  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shipData, setShipData] = useState({
    carrierName: '',
    trackingNumber: '',
    vehicleNumber: '',
    driverName: '',
    bucket: 'Damaged' 
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;
  if (!returnData) return <div className="p-8 text-center text-slate-500">Không tìm thấy phiếu trả NCC.</div>;

  // Fallback calculation for old RTVs where totals were not saved
  const calculatedTotalQty = returnData.lines?.reduce((sum: number, line: any) => sum + (line.qtyReturned || 0), 0) || 0;
  
  const displayLines = returnData.lines?.map((line: any) => {
     const grLine = grDetails?.lines?.find((x: any) => x.productId === line.productId);
     const qcLine = qcDetails?.lines?.find((x: any) => x.productId === line.productId);
     const unitCost = line.unitCost || grLine?.unitCost || 0;
     const qty = line.qtyReturned || 0;
     return {
        ...line,
        unitCost: unitCost,
        totalCost: line.totalCost || (unitCost * qty),
        defectCode: line.defectCode || qcLine?.failureReason,
        lotNumber: line.lotNumber || grLine?.lotNumber || qcLine?.lotNumber,
        serialNumber: line.serialNumber || (grLine?.serialNumbers && grLine.serialNumbers.length > 0 ? grLine.serialNumbers[0] : null) || (qcLine?.serialNumbers && qcLine.serialNumbers.length > 0 ? qcLine.serialNumbers[0] : null),
        expiryDate: line.expiryDate || grLine?.expiryDate
     };
  }) || [];

  const calculatedSubTotal = displayLines.reduce((sum: number, line: any) => sum + (line.totalCost || 0), 0);
  const calculatedTax = calculatedSubTotal * 0.1; // fallback tax assuming 10%
  const calculatedGrandTotal = calculatedSubTotal + calculatedTax;

  const totalQty = returnData.totalQty || calculatedTotalQty;
  const subTotal = returnData.subTotal || calculatedSubTotal;
  const taxAmount = returnData.taxAmount || calculatedTax;
  const grandTotal = returnData.grandTotal || returnData.totalCost || calculatedGrandTotal;

  // Fallback locations
  const fallbackReturnLoc = locations?.items?.find((x: any) => x.type === 5 || x.type === 6 || String(x.code).includes('RET')) || locations?.items?.[0];
  const fallbackQuarantineLoc = locations?.items?.find((x: any) => x.type === 4 || String(x.code).includes('QUA')) || locations?.items?.[1] || locations?.items?.[0];

  const steps = getStatusSteps(returnData.status);
  
  if (returnData.returnDate) steps[0].timestamp = returnData.returnDate;
  if (returnData.submittedAt) steps[1].timestamp = returnData.submittedAt;
  if (returnData.approvedAt) steps[2].timestamp = returnData.approvedAt;
  if (returnData.shippedAt) steps[3].timestamp = returnData.shippedAt;

  const handleOpenShipModal = () => {
    setShipData({
      carrierName: returnData.carrierName || '',
      trackingNumber: returnData.trackingNumber || '',
      vehicleNumber: returnData.vehicleNumber || '',
      driverName: returnData.driverName || '',
      bucket: 'Damaged'
    });
    setIsShipModalOpen(true);
  };

  const handleSubmitShip = () => {
    if (!shipData.carrierName || !shipData.trackingNumber) {
      message.error('Vui lòng nhập đầy đủ Hãng vận chuyển (Carrier) và Mã vận đơn (Tracking Number)');
      return;
    }
    shipMutation.mutate({ 
      id: rtvId, 
      data: {
        carrierName: shipData.carrierName,
        trackingNumber: shipData.trackingNumber,
        vehicleNumber: shipData.vehicleNumber,
        driverName: shipData.driverName
      } 
    }, {
      onSuccess: () => setIsShipModalOpen(false)
    });
  };

  const handleComplete = () => {
    Modal.confirm({
      title: 'Hoàn thành phiếu trả NCC?',
      content: 'Xác nhận nhà cung cấp đã nhận được hàng và tiến hành cấn trừ công nợ.',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        completeMutation.mutate(rtvId);
      }
    });
  };

  const handleAction = (action: 'submit' | 'approve' | 'reject' | 'cancel') => {
     actionMutation.mutate({ action });
  };

  const renderGeneralInfo = () => (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="col-span-2 md:col-span-4 border-b pb-2 mb-2">
         <h4 className="font-semibold text-slate-700">Thông tin tham chiếu</h4>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã PO</p>
        <p className="font-medium text-slate-800">{returnData.poNumber || grDetails?.poNumber || '—'}</p>
        {returnData.poDate && <p className="text-xs text-slate-400 mt-0.5">{dayjs(returnData.poDate).format('DD/MM/YYYY')}</p>}
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã ASN</p>
        <p className="font-medium text-slate-800">{returnData.asnNumber || grDetails?.asnNumber || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã GR</p>
        <p className="font-medium text-slate-800">{returnData.grNumber || grDetails?.grNumber || '—'}</p>
        {(returnData.grDate || grDetails?.receivedDate) && <p className="text-xs text-slate-400 mt-0.5">{dayjs(returnData.grDate || grDetails?.receivedDate).format('DD/MM/YYYY')}</p>}
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Ngày tạo phiếu (Return Date)</p>
        <p className="font-medium text-slate-800">{returnData.returnDate ? dayjs(returnData.returnDate).format('DD/MM/YYYY HH:mm') : '—'}</p>
      </div>

      <div className="col-span-2 md:col-span-4 border-b pb-2 mb-2 mt-2">
         <h4 className="font-semibold text-slate-700">Lý do & Ghi chú</h4>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Lý do trả hàng</p>
        <p className="font-medium text-slate-800">{returnData.reason || '—'}</p>
      </div>
      <div className="md:col-span-3">
        <p className="text-sm text-slate-500 mb-1">Ghi chú (Notes)</p>
        <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded">{returnData.notes || '—'}</p>
      </div>
    </div>
  );

  const renderSupplierInfo = () => (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div>
        <p className="text-sm text-slate-500 mb-1">Tên Nhà Cung Cấp</p>
        <p className="font-medium text-slate-800">{supplierDetails?.name || returnData.supplierName || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Supplier Code</p>
        <p className="font-medium text-slate-800">{supplierDetails?.code || returnData.supplierCode || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã số thuế (Tax Code)</p>
        <p className="font-medium text-slate-800">{returnData.supplierTaxCode || supplierDetails?.taxCode || '—'}</p>
      </div>
      <div className="md:col-span-3">
        <p className="text-sm text-slate-500 mb-1">Địa chỉ (Address)</p>
        <p className="font-medium text-slate-800">{returnData.supplierAddress || supplierDetails?.address || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Người liên hệ</p>
        <p className="font-medium text-slate-800">{returnData.contactPerson || supplierDetails?.contactPerson || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Số điện thoại</p>
        <p className="font-medium text-slate-800">{returnData.supplierPhone || supplierDetails?.phone || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Email</p>
        <p className="font-medium text-slate-800">{returnData.supplierEmail || supplierDetails?.email || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Điều khoản thanh toán</p>
        <p className="font-medium text-slate-800">{(returnData.supplierPaymentTerm || supplierDetails?.paymentTermsDays) ? `${returnData.supplierPaymentTerm || supplierDetails?.paymentTermsDays} ngày` : '—'}</p>
      </div>
    </div>
  );

  const renderQCInfo = () => (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã QC (Quality Check)</p>
        <p className="font-medium text-slate-800">{returnData.qcNumber || qcDetails?.qcNumber || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Ngày kiểm tra (QC Date)</p>
        <p className="font-medium text-slate-800">{(returnData.qcDate || qcDetails?.inspectedAt) ? dayjs(returnData.qcDate || qcDetails?.inspectedAt).format('DD/MM/YYYY HH:mm') : '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Nhân viên QC (Inspector)</p>
        <p className="font-medium text-slate-800">{returnData.qcInspector || qcDetails?.inspectorId || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Kết quả QC</p>
        <p className={`font-medium ${returnData.qcResult === 'Failed' || qcDetails?.result === 2 ? 'text-red-600' : 'text-amber-600'}`}>
          {returnData.qcResult || (qcDetails?.result === 2 ? 'Failed' : qcDetails?.result === 3 ? 'Partial' : 'Passed') || '—'}
        </p>
      </div>
      <div className="md:col-span-2">
        <p className="text-sm text-slate-500 mb-1">Quyết định (Decision)</p>
        <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded">{returnData.qcDecision || qcDetails?.rejectReason || '—'}</p>
      </div>
      <div className="md:col-span-2">
        <p className="text-sm text-slate-500 mb-1">Báo cáo QC (Report)</p>
        <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded">{returnData.qcReport || qcDetails?.notes || '—'}</p>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div>
        <p className="text-sm text-slate-500 mb-1">Tiền tệ (Currency)</p>
        <p className="font-medium text-slate-800">{returnData.currency || 'VND'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tổng SL Trả</p>
        <p className="font-medium text-slate-800">{totalQty}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tổng tiền hàng (SubTotal)</p>
        <p className="font-medium text-slate-800">{subTotal.toLocaleString()} đ</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tiền thuế (Tax Amount)</p>
        <p className="font-medium text-slate-800">{taxAmount.toLocaleString()} đ</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tổng giá trị (Grand Total)</p>
        <p className="font-bold text-slate-800 text-lg text-primary">{grandTotal.toLocaleString()} đ</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Phí lưu kho / Restocking Fee</p>
        <p className="font-medium text-red-600">{(returnData.restockingFee || 0).toLocaleString()} đ</p>
      </div>
      
      <div className="col-span-2 md:col-span-4 border-b pb-2 mb-2 mt-2">
         <h4 className="font-semibold text-slate-700">Công nợ & Hoàn tiền</h4>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Credit Note</p>
        <p className="font-medium text-slate-800">{returnData.creditNote || (returnData.returnNumber ? `CN-${returnData.returnNumber.replace('RTV', '')}` : '—')}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Debit Note</p>
        <p className="font-medium text-slate-800">{returnData.debitNote || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tiền hoàn lại </p>
        <p className="font-medium text-emerald-600">{(returnData.supplierRefund || grandTotal) ? (returnData.supplierRefund || grandTotal).toLocaleString() + ' đ' : '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Đơn thay thế </p>
        <p className="font-medium text-slate-800">{returnData.replacementOrder || '—'}</p>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-medium">
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Sản phẩm</th>
           
              <th className="px-6 py-3 text-center">UOM</th>
              <th className="px-6 py-3 text-right">Số lượng trả</th>
              <th className="px-6 py-3 text-right">Đơn giá</th>
              <th className="px-6 py-3 text-right">Thành tiền</th>
              <th className="px-6 py-3">Defect Code</th>
              <th className="px-6 py-3">Lot/Expiry/SN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayLines.map((line: any) => (
              <tr key={line.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-800">
                   {line.productSku}
                   {line.barcode && <div className="text-xs text-slate-400 font-mono mt-0.5">{line.barcode}</div>}
                </td>
                <td className="px-6 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={line.productName}>
                  {line.productName || '—'}
                  {line.category && <div className="text-xs text-slate-400 mt-0.5">{line.category}</div>}
                </td>
          
                <td className="px-6 py-3 text-center text-slate-600">{line.uomCode}</td>
                <td className="px-6 py-3 text-right">
                   <div className="font-medium">{line.qtyReturned}</div>
                   {(line.qtyQCPassed !== undefined) && <div className="text-xs text-slate-400 mt-0.5">QC Fail: {line.qtyQCFailed}</div>}
                </td>
                <td className="px-6 py-3 text-right text-slate-500">{line.unitCost ? line.unitCost.toLocaleString() + ' đ' : '—'}</td>
                <td className="px-6 py-3 text-right font-medium text-emerald-600">{line.totalCost ? line.totalCost.toLocaleString() + ' đ' : '—'}</td>
                <td className="px-6 py-3 text-sm text-slate-500">
                   {line.defectCode || '—'}
                   {line.defectDescription && <div className="text-xs text-slate-400 mt-0.5">{line.defectDescription}</div>}
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">
                   {line.lotNumber && <div>Lot: {line.lotNumber}</div>}
                   {line.serialNumber && <div className="text-xs text-slate-400 mt-0.5">SN: {line.serialNumber}</div>}
                   {line.expiryDate && <div className="text-xs text-slate-400 mt-0.5">Exp: {dayjs(line.expiryDate).format('DD/MM/YYYY')}</div>}
                   {!line.lotNumber && !line.serialNumber && !line.expiryDate && '—'}
                </td>
              </tr>
            ))}
            {!displayLines.length && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Không có dữ liệu sản phẩm</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWarehouseTransportInfo = () => (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h4 className="text-lg font-medium text-slate-800 mb-4 border-b pb-2">Thông tin Kho & Lấy hàng</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">Kho xuất trả</p>
          <p className="font-medium text-slate-800">{returnData.warehouseName || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Mã Kho (Warehouse Code)</p>
          <p className="font-medium text-slate-800">{returnData.warehouseCode || warehouseDetails?.code || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Vị trí lấy hàng (Return Loc)</p>
          <p className="font-medium text-slate-800">{returnData.returnLocationId || fallbackReturnLoc?.code || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Vị trí kiểm dịch (Quarantine)</p>
          <p className="font-medium text-slate-800">{returnData.quarantineLocationId || fallbackQuarantineLoc?.code || '—'}</p>
        </div>
      </div>

      <h4 className="text-lg font-medium text-slate-800 mb-4 border-b pb-2">Thông tin vận chuyển (Logistics)</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">Carrier (Đơn vị VC)</p>
          <p className="font-medium text-slate-800">{returnData.carrierName || supplierDetails?.name || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Tracking Number</p>
          <p className="font-medium text-slate-800">{returnData.trackingNumber || grDetails?.grNumber || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Phương thức vận chuyển (Method)</p>
          <p className="font-medium text-slate-800">{returnData.shippingMethod || 'Đường bộ'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Delivery Note</p>
          <p className="font-medium text-slate-800">{returnData.deliveryNote || returnData.returnNumber || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Ngày Ship (Thực tế)</p>
          <p className="font-medium text-slate-800">{(returnData.shippedAt || returnData.returnDate) ? dayjs(returnData.shippedAt || returnData.returnDate).format('DD/MM/YYYY HH:mm') : '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Biển số xe</p>
          <p className="font-medium text-slate-800">{returnData.vehicleNumber || grDetails?.vehiclePlate || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Tài xế</p>
          <p className="font-medium text-slate-800">{returnData.driverName || grDetails?.driverName || '—'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 mb-1">Ngày dự kiến đến (ETA)</p>
          <p className="font-medium text-slate-800">{(returnData.estimatedArrival || returnData.returnDate) ? dayjs(returnData.estimatedArrival || returnData.returnDate).add(3, 'day').format('DD/MM/YYYY HH:mm') : '—'}</p>
        </div>
      </div>
    </div>
  );

  const renderStockImpact = () => (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
         <TrendingDown className="text-primary" size={20} />
         Mô phỏng thay đổi Tồn kho (Stock Impact)
      </h4>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col gap-4">
         <p className="text-sm text-slate-500 italic mb-2">Bảng này hiển thị biến động tồn kho dự kiến sau khi hàng xuất trả NCC.</p>
         {returnData.lines?.map((line: any) => (
             <div key={line.id} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-200 last:border-0">
               <div className="col-span-2">
                  <div className="font-medium text-slate-800">{line.productSku}</div>
                  <div className="text-xs text-slate-500">{line.productName}</div>
               </div>
               <div className="col-span-3 flex gap-4 items-center">
                  <div className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-bold text-sm">{line.sourceBucket || 'Damaged'} -{line.qtyReturned}</div>
                  <span className="text-slate-400 text-sm">Hàng hóa xuất đi</span>
               </div>
             </div>
         ))}
      </div>
    </div>
  );

  const renderAuditLog = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
         <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            Lịch sử thao tác (Audit Trail)
         </h4>
      </div>
      <table className="w-full text-left border-collapse">
         <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-medium">
               <th className="px-6 py-3">Thời gian</th>
               <th className="px-6 py-3">Người dùng</th>
               <th className="px-6 py-3">Hành động</th>
               <th className="px-6 py-3">Chi tiết (Cũ &rarr; Mới)</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-100">
            <tr>
               <td className="px-6 py-4 text-sm text-slate-600">{returnData.returnDate ? format(new Date(returnData.returnDate), 'dd/MM/yyyy HH:mm:ss') : '—'}</td>
               <td className="px-6 py-4 text-sm font-medium text-slate-800">{returnData.createdBy || 'System'}</td>
               <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">CREATE</span></td>
               <td className="px-6 py-4 text-sm text-slate-600">Khởi tạo phiếu RTV</td>
            </tr>
            {returnData.submittedAt && (
               <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(returnData.submittedAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{returnData.submittedBy || 'Admin'}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-semibold">SUBMIT</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">Gửi duyệt phiếu</td>
               </tr>
            )}
            {returnData.approvedAt && (
               <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(returnData.approvedAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{returnData.approvedBy || 'Admin'}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold">APPROVE</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">Duyệt phiếu, sẵn sàng xuất kho</td>
               </tr>
            )}
            {returnData.shippedAt && (
               <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(returnData.shippedAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">Warehouse Staff</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold">SHIP_RTV</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">Giao hàng cho NCC</td>
               </tr>
            )}
         </tbody>
      </table>
    </div>
  );

  const renderAttachments = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
         <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <ImageIcon size={18} className="text-slate-500" />
            Tệp đính kèm
         </h4>
      </div>
      <div className="p-8 text-center">
         <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <ImageIcon className="text-slate-400" size={32} />
         </div>
         <p className="text-slate-500 font-medium">Chưa có tệp đính kèm nào</p>
      </div>
    </div>
  );

  const tabItems = [
    { key: 'general', label: 'Thông tin chung', children: renderGeneralInfo() },
    { key: 'supplier', label: 'Nhà cung cấp', children: renderSupplierInfo() },
    { key: 'warehouse', label: 'Kho & Vận chuyển', children: renderWarehouseTransportInfo() },
    { key: 'qc', label: 'QC Details', children: renderQCInfo() },
    { key: 'products', label: 'Sản phẩm lỗi', children: renderProducts() },
    { key: 'financial', label: 'Tài chính & Credit', children: renderFinancialInfo() },
    { key: 'audit_log', label: 'Lịch sử thao tác', children: renderAuditLog() },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/returns/vendor')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              Phiếu Trả NCC #{returnData.rtvNumber || returnData.returnNumber}
              <StatusBadge status={Object.keys(ReturnToVendorStatus).find(key => (ReturnToVendorStatus as any)[key] === returnData.status) || 'Draft'} text={returnToVendorStatusLabel[returnData.status as unknown as ReturnToVendorStatus] || 'Unknown'} />
            </h1>
            <p className="text-slate-500 text-sm mt-1">PO: {returnData.poNumber || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
             <Printer size={16} /> Print RTV
          </button>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
             <Download size={16} /> Export PDF
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          {returnData.status === ReturnToVendorStatus.Draft ? (
             <>
               <PermissionGuard permissions="VendorReturn.Submit">
                 <button 
                   onClick={() => handleAction('submit')}
                   className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
                 >
                   Gửi duyệt (Submit)
                 </button>
               </PermissionGuard>
             </>
          ) : null}
          {returnData.status === ReturnToVendorStatus.Submitted ? (
             <>
               <PermissionGuard permissions="VendorReturn.Approve">
                 <button 
                   onClick={() => handleAction('approve')}
                   className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                 >
                   <Check size={18} /> Duyệt phiếu (Approve)
                 </button>
               </PermissionGuard>
             </>
          ) : null}
          {returnData.status === ReturnToVendorStatus.Approved ? (
            <PermissionGuard permissions="VendorReturn.Ship">
              <button 
                onClick={handleOpenShipModal}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Truck size={18} /> Giao hàng (Ship)
              </button>
            </PermissionGuard>
          ) : null}
          {returnData.status === ReturnToVendorStatus.Shipped ? (
            <PermissionGuard permissions="VendorReturn.Complete">
              <button 
                onClick={handleComplete}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <CheckCircle size={18} /> Hoàn tất trả hàng
              </button>
            </PermissionGuard>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-2">
            <Tabs items={tabItems} className="w-full font-medium" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-primary" />
              Tiến độ phiếu (Timeline)
            </h3>
            <TimelineStepper steps={steps} />
            
            <div className="mt-6 pt-6 border-t border-slate-100">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Thông tin Audit</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                     <span className="text-slate-500">Tạo bởi:</span>
                     <span className="font-medium text-slate-800">{returnData.createdBy || 'System'}</span>
                  </div>
                  {returnData.submittedBy && (
                    <div className="flex justify-between">
                       <span className="text-slate-500">Người gửi duyệt:</span>
                       <span className="font-medium text-slate-800">{returnData.submittedBy}</span>
                    </div>
                  )}
                  {returnData.approvedBy && (
                    <div className="flex justify-between">
                       <span className="text-slate-500">Người duyệt:</span>
                       <span className="font-medium text-slate-800">{returnData.approvedBy}</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Giao hàng trả lại (Ship RTV)"
        open={isShipModalOpen}
        onOk={handleSubmitShip}
        onCancel={() => setIsShipModalOpen(false)}
        width={500}
        okText="Giao hàng"
        cancelText="Hủy"
        okButtonProps={{ loading: shipMutation.isPending, className: 'bg-primary' }}
      >
        <div className="py-4 space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
            Vui lòng nhập thông tin vận chuyển và chọn nguồn hàng (Bucket) để trừ tồn kho.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị vận chuyển (Carrier) <span className="text-red-500">*</span></label>
            <Input 
              value={shipData.carrierName}
              onChange={e => setShipData({ ...shipData, carrierName: e.target.value })}
              placeholder="VD: DHL, FedEx, Viettel Post..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã vận đơn (Tracking Number) <span className="text-red-500">*</span></label>
            <Input 
              value={shipData.trackingNumber}
              onChange={e => setShipData({ ...shipData, trackingNumber: e.target.value })}
              placeholder="VD: TRK123456789"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biển số xe</label>
              <Input 
                value={shipData.vehicleNumber}
                onChange={e => setShipData({ ...shipData, vehicleNumber: e.target.value })}
                placeholder="VD: 51H-123.45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tài xế</label>
              <Input 
                value={shipData.driverName}
                onChange={e => setShipData({ ...shipData, driverName: e.target.value })}
                placeholder="Tên tài xế"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn hàng (Source Bucket) <span className="text-red-500">*</span></label>
            <Select 
              value={shipData.bucket}
              onChange={val => setShipData({ ...shipData, bucket: val })}
              className="w-full"
            >
              <Select.Option value="Damaged">Damaged (Hàng hỏng)</Select.Option>
              <Select.Option value="Quarantined">Quarantined (Chờ xử lý)</Select.Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorReturnDetailPage;
