import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useCustomerReturn, 
  useSubmitCustomerReturn,
  useApproveCustomerReturn,
  useRejectCustomerReturn,
  useCancelCustomerReturn,
  useReceiveCustomerReturn, 
  useInspectCustomerReturn, 
  useCompleteCustomerReturn,
  useCloseCustomerReturn 
} from './hooks/useCustomerReturns';
import { useQueries } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { ArrowLeft, CheckCircle, Package, ShieldCheck, ClipboardCheck, History, TrendingDown, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { TimelineStepper, type TimelineStep } from '@/components/Shared/TimelineStepper';
import { ReturnStatus, returnStatusLabel } from '@/types/wms-enums';
import { message, Modal, Tabs, InputNumber } from 'antd';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';

const CustomerReturnDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const returnId = Number(id);

  const { data: returnOrder, isLoading } = useCustomerReturn(returnId);
  const receiveMutation = useReceiveCustomerReturn();
  const inspectMutation = useInspectCustomerReturn();
  const completeMutation = useCompleteCustomerReturn();
  const submitMutation = useSubmitCustomerReturn();
  const approveMutation = useApproveCustomerReturn();
  const rejectMutation = useRejectCustomerReturn();
  const cancelMutation = useCancelCustomerReturn();
  const closeMutation = useCloseCustomerReturn();

  // Fetch product masterdata
  const productIds = Array.from(new Set(returnOrder?.lines?.map((l: any) => l.productId) || []));
  const productQueries = useQueries({
    queries: productIds.map(id => ({
      queryKey: ['productMasterData', id],
      queryFn: () => masterDataApi.getProductById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000 // 5 mins
    }))
  });
  
  const productsMap = productQueries.reduce((acc, query) => {
    if (query.data) acc[query.data.id] = query.data;
    return acc;
  }, {} as Record<number, any>);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [receiveData, setReceiveData] = useState<Record<number, number>>({});

  if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;
  if (!returnOrder) return <div className="p-8 text-center text-slate-500">Không tìm thấy phiếu hoàn trả.</div>;

  const status = returnOrder.status;
  const steps: TimelineStep[] = [
    { status: 1, label: 'Lập phiếu', isCompleted: status !== ReturnStatus.Draft, timestamp: returnOrder.createdAt || null, actor: 'System', duration: null, isCurrent: status === ReturnStatus.Draft, isFailed: false },
    { status: 2, label: 'Chờ duyệt', isCompleted: status !== ReturnStatus.Draft && status !== ReturnStatus.Submitted, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnStatus.Submitted, isFailed: false },
    { status: 3, label: 'Đã duyệt', isCompleted: status !== ReturnStatus.Draft && status !== ReturnStatus.Submitted && status !== ReturnStatus.Approved, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnStatus.Approved, isFailed: false },
    { status: 4, label: 'Chờ nhận', isCompleted: status === ReturnStatus.Completed || status === ReturnStatus.Closed, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnStatus.Receiving, isFailed: false },
    { status: 5, label: 'Hoàn thành', isCompleted: status === ReturnStatus.Completed || status === ReturnStatus.Closed, timestamp: null, actor: null, duration: null, isCurrent: status === ReturnStatus.Completed, isFailed: false },
  ];

  const handleOpenReceiveModal = () => {
    const initialData: Record<number, number> = {};
    returnOrder.lines?.forEach(line => {
      initialData[line.id] = line.qtyExpected;
    });
    setReceiveData(initialData);
    setIsReceiveModalOpen(true);
  };

  const handleSubmitReceive = () => {
    const lines = Object.entries(receiveData).map(([lineId, qtyReceived]) => ({
      returnOrderLineId: Number(lineId),
      qtyReceived
    }));
    receiveMutation.mutate({ id: returnId, data: { lines } }, {
      onSuccess: () => setIsReceiveModalOpen(false)
    });
  };

  const handleComplete = () => {
    Modal.confirm({
      title: 'Hoàn thành phiếu hoàn trả?',
      content: 'Thao tác này sẽ đóng phiếu và cập nhật tồn kho cuối cùng.',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        completeMutation.mutate(returnId);
      }
    });
  };

  const handleClose = () => {
    Modal.confirm({
      title: 'Đóng phiếu hoàn trả?',
      content: 'Phiếu đã hoàn thành sẽ được đóng lại và không thể thay đổi nữa.',
      okText: 'Xác nhận đóng',
      cancelText: 'Hủy',
      onOk: () => {
        closeMutation.mutate(returnId);
      }
    });
  };

  const handleSubmitReturn = () => {
    Modal.confirm({
      title: 'Gửi duyệt phiếu hoàn trả?',
      content: 'Bạn có chắc chắn muốn gửi duyệt phiếu này không?',
      okText: 'Gửi duyệt',
      cancelText: 'Hủy',
      onOk: () => {
        submitMutation.mutate(returnId);
      }
    });
  };

  const handleApproveReturn = () => {
    Modal.confirm({
      title: 'Phê duyệt phiếu hoàn trả?',
      content: 'Bạn có chắc chắn muốn phê duyệt phiếu này không?',
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: () => {
        approveMutation.mutate(returnId);
      }
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }
    rejectMutation.mutate({ id: returnId, reason: rejectReason }, {
      onSuccess: () => {
        setIsRejectModalOpen(false);
        setRejectReason('');
      }
    });
  };

  const handleCancelReturn = () => {
    Modal.confirm({
      title: 'Hủy phiếu hoàn trả?',
      content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy phiếu này không?',
      okText: 'Hủy phiếu',
      okButtonProps: { danger: true },
      cancelText: 'Không',
      onOk: () => {
        cancelMutation.mutate(returnId);
      }
    });
  };

  const renderGeneralInfo = () => (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div>
        <p className="text-sm text-slate-500 mb-1">Mã Kho nhận</p>
        <p className="font-medium text-slate-800">{returnOrder.warehouseCode}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Khách hàng</p>
        <p className="font-medium text-slate-800">{returnOrder.customerName || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Customer Code</p>
        <p className="font-medium text-slate-800">{returnOrder.customerCode || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Customer Type</p>
        <p className="font-medium text-slate-800">{returnOrder.customerType || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Ngày tạo</p>
        <p className="font-medium text-slate-800">{returnOrder.createdAt ? format(new Date(returnOrder.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Người tạo (Created By)</p>
        <p className="font-medium text-slate-800">{returnOrder.createdBy || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Lý do trả</p>
        <p className="font-medium text-slate-800">{returnOrder.reason || '-'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Carrier</p>
        <p className="font-medium text-slate-800">{returnOrder.carrierName || '—'}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">Tracking Number</p>
        <p className="font-medium text-slate-800">{returnOrder.trackingNumber || '—'}</p>
      </div>
      <div className="md:col-span-4">
        <p className="text-sm text-slate-500 mb-1">Ghi chú</p>
        <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded">{returnOrder.notes || '-'}</p>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-medium">
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Sản phẩm</th>
              <th className="px-6 py-3">Barcode</th>
              <th className="px-6 py-3 text-center">UOM</th>
              <th className="px-6 py-3 text-right">Dự kiến trả</th>
              <th className="px-6 py-3 text-right">Thực nhận</th>
              <th className="px-6 py-3 text-right">Đơn giá</th>
              <th className="px-6 py-3 text-right">Thành tiền</th>
              <th className="px-6 py-3">Lot/EXP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returnOrder.lines?.map((line: any) => (
              <tr key={line.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3 font-medium text-slate-800">{line.productSku}</td>
                <td className="px-6 py-3 text-sm text-slate-600">
                  {line.productName || '—'}
                  {line.serialNumber && <div className="text-xs text-slate-400 mt-0.5">SN: {line.serialNumber}</div>}
                </td>
                <td className="px-6 py-3 text-sm text-slate-600">{productsMap[line.productId]?.defaultBarcode || '—'}</td>
                <td className="px-6 py-3 text-center text-sm text-slate-600">{line.uomCode}</td>
                <td className="px-6 py-3 text-right font-medium">{line.qtyExpected}</td>
                <td className="px-6 py-3 text-right font-bold text-blue-600">{line.qtyReceived || 0}</td>
                <td className="px-6 py-3 text-right text-sm text-slate-600">
                  {line.unitPrice ? line.unitPrice.toLocaleString() + ' đ' : '—'}
                </td>
                <td className="px-6 py-3 text-right font-medium text-emerald-600">
                  {line.amount ? line.amount.toLocaleString() + ' đ' : '—'}
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">{line.lotNumber || '—'}</td>
              </tr>
            ))}
            {!returnOrder.lines?.length && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Không có dữ liệu sản phẩm</td>
              </tr>
            )}
          </tbody>
        </table>
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
         <p className="text-sm text-slate-500 italic mb-2">Bảng này hiển thị biến động tồn kho dự kiến sau khi phiếu được hoàn tất.</p>
         {returnOrder.lines?.map(line => (
             <div key={line.id} className="grid grid-cols-5 gap-4 py-3 border-b border-slate-200 last:border-0">
               <div className="col-span-2">
                  <div className="font-medium text-slate-800">{line.productSku}</div>
                  <div className="text-xs text-slate-500">{line.productName}</div>
               </div>
               <div className="col-span-3 flex gap-4">
                  {line.qtySellable ? <div className="px-3 py-1 bg-green-100 text-green-700 rounded-md font-bold text-sm">Sellable +{line.qtySellable}</div> : null}
                  {line.qtyQuarantined ? <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md font-bold text-sm">Quarantine +{line.qtyQuarantined}</div> : null}
                  {line.qtyDamaged ? <div className="px-3 py-1 bg-red-100 text-red-700 rounded-md font-bold text-sm">Damaged +{line.qtyDamaged}</div> : null}
                  {!line.qtySellable && !line.qtyQuarantined && !line.qtyDamaged && <div className="text-slate-400 text-sm flex items-center">Chưa có thay đổi do chưa QC</div>}
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
               <td className="px-6 py-4 text-sm text-slate-600">{returnOrder.createdAt ? format(new Date(returnOrder.createdAt), 'dd/MM/yyyy HH:mm:ss') : '—'}</td>
               <td className="px-6 py-4 text-sm font-medium text-slate-800">System</td>
               <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">CREATE</span></td>
               <td className="px-6 py-4 text-sm text-slate-600">Tạo mới phiếu Hoàn trả</td>
            </tr>
            {returnOrder.inspectedAt && (
               <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">{format(new Date(returnOrder.inspectedAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">QC Admin</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold">QC_INSPECT</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">Cập nhật phân loại chất lượng hàng</td>
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
         <button className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded shadow-sm text-xs font-medium hover:bg-slate-50">Upload File</button>
      </div>
      <div className="p-8 text-center">
         <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <ImageIcon className="text-slate-400" size={32} />
         </div>
         <p className="text-slate-500 font-medium">Chưa có tệp đính kèm nào</p>
         <p className="text-sm text-slate-400 mt-1">Hỗ trợ các file hình ảnh, video, PDF hóa đơn, và biên bản QC.</p>
      </div>
    </div>
  );

  const tabItems = [
    { key: 'general', label: 'Thông tin chung', children: renderGeneralInfo() },
    { key: 'products', label: 'Sản phẩm trả', children: renderProducts() },
    { key: 'stock_impact', label: 'Stock Impact', children: renderStockImpact() },
    { key: 'attachments', label: 'Attachments', children: renderAttachments() },
    { key: 'audit_log', label: 'Audit Log', children: renderAuditLog() },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/returns/customer')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              Phiếu Hoàn Trả #{returnOrder.returnNumber}
              <StatusBadge status={Object.keys(ReturnStatus).find(key => (ReturnStatus as any)[key] === returnOrder.status) || 'Draft'} text={returnStatusLabel[returnOrder.status as unknown as ReturnStatus] || 'Unknown'} />
            </h1>
            <p className="text-slate-500 text-sm mt-1">Từ đơn hàng: {returnOrder.salesOrderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {returnOrder.status === ReturnStatus.Draft && (
            <>
              <button 
                onClick={handleSubmitReturn}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                Gửi duyệt
              </button>
              <button 
                onClick={handleCancelReturn}
                className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
              >
                Hủy phiếu
              </button>
            </>
          )}
          {returnOrder.status === ReturnStatus.Submitted && (
            <>
              <button 
                onClick={handleApproveReturn}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <CheckCircle size={18} /> Phê duyệt
              </button>
              <button 
                onClick={() => setIsRejectModalOpen(true)}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                Từ chối
              </button>
            </>
          )}
          {returnOrder.status === ReturnStatus.Approved && (
            <button 
              onClick={handleOpenReceiveModal}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package size={18} /> Bắt đầu nhận hàng
            </button>
          )}
          {(returnOrder.status === ReturnStatus.QC || returnOrder.status === ReturnStatus.Disposition || returnOrder.status === ReturnStatus.Putaway) && returnOrder.inspectedAt && (
            <button 
              onClick={handleComplete}
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <CheckCircle size={18} /> Hoàn thành
            </button>
          )}
          {returnOrder.status === ReturnStatus.Completed && (
            <button 
              onClick={handleClose}
              className="bg-slate-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <CheckCircle size={18} /> Đóng phiếu
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-2">
            <Tabs items={tabItems} className="w-full font-medium" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-primary" />
              Tiến độ hoàn trả
            </h3>
            <TimelineStepper steps={steps} />
          </div>
        </div>
      </div>

      {/* Receive Modal */}
      <Modal
        title="Ghi nhận nhận hàng hoàn trả"
        open={isReceiveModalOpen}
        onOk={handleSubmitReceive}
        onCancel={() => setIsReceiveModalOpen(false)}
        width={700}
        okText="Lưu xác nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: receiveMutation.isPending, className: 'bg-primary' }}
      >
        <div className="py-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
            Vui lòng nhập số lượng thực tế nhận được cho từng sản phẩm.
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-medium">
                <th className="px-4 py-2">Sản phẩm</th>
                <th className="px-4 py-2 text-right">Dự kiến</th>
                <th className="px-4 py-2 text-right">Thực nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnOrder.lines?.map(line => (
                <tr key={line.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{line.productSku}</div>
                    <div className="text-xs text-slate-500">{line.productName || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-600">{line.qtyExpected}</td>
                  <td className="px-4 py-3 text-right">
                    <InputNumber
                      min={0}
                      max={line.qtyExpected} 
                      value={receiveData[line.id] || 0}
                      onChange={val => setReceiveData({ ...receiveData, [line.id]: val || 0 })}
                      className="w-24"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối phiếu hoàn trả"
        open={isRejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        okText="Từ chối phiếu"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
      >
        <div className="py-4">
          <p className="mb-2 text-slate-700">Vui lòng nhập lý do từ chối phiếu hoàn trả này:</p>
          <textarea
            className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do chi tiết..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default CustomerReturnDetailPage;
