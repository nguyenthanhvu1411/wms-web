import { useParams, useNavigate } from 'react-router-dom';
import { 
  useSalesOrder, 
  useSubmitSalesOrder,
  useApproveSalesOrder,
  useRejectSalesOrder,
  useReleaseSalesOrder,
  useHoldSalesOrder,
  useUnHoldSalesOrder,
  useCancelSalesOrder
} from './hooks/useSalesOrders';
import { usePickingOrders } from '../Picking/hooks/usePickingOrders';
import { message } from 'antd';
import { ArrowLeft, CheckCircle, Package, Edit, FileText, XCircle, Ban, Play, Pause } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { SalesOrderStatus, salesOrderStatusLabel } from '@/types/wms-enums';
import { format } from 'date-fns';

const SalesOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: order, isLoading } = useSalesOrder(Number(id));
  const { data: pickingData } = usePickingOrders({ salesOrderId: Number(id) });
  const pickingOrder = pickingData?.items?.[0];
  
  const submitMutation = useSubmitSalesOrder();
  const approveMutation = useApproveSalesOrder();
  const rejectMutation = useRejectSalesOrder();
  const releaseMutation = useReleaseSalesOrder();
  const holdMutation = useHoldSalesOrder();
  const unHoldMutation = useUnHoldSalesOrder();
  const cancelMutation = useCancelSalesOrder();

  if (isLoading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!order) return <div className="p-10 text-center text-danger">Không tìm thấy đơn bán hàng</div>;

  const getStatusString = (status: number) => {
    switch(status) {
      case SalesOrderStatus.Draft: return 'Draft';
      case SalesOrderStatus.Submitted: return 'Pending';
      case SalesOrderStatus.Approved: return 'Approved';
      case SalesOrderStatus.Released: return 'Active';
      case SalesOrderStatus.Allocated: return 'Active';
      case SalesOrderStatus.Picking:
      case SalesOrderStatus.Picked:
      case SalesOrderStatus.Packing: return 'InProgress';
      case SalesOrderStatus.Shipped:
      case SalesOrderStatus.Delivered:
      case SalesOrderStatus.Closed: return 'Completed';
      case SalesOrderStatus.Cancelled: return 'Cancelled';
      case SalesOrderStatus.OnHold: return 'Cancelled';
      default: return 'Draft';
    }
  };

  const timelineSteps = ['Draft', 'Submitted', 'Approved', 'Released', 'Allocated', 'Picking', 'Packing', 'Shipped', 'Delivered', 'Closed'];
  const getTimelineIndex = (status: number) => {
    switch (status) {
      case SalesOrderStatus.Draft: return 0;
      case SalesOrderStatus.Submitted: return 1;
      case SalesOrderStatus.Approved: return 2;
      case SalesOrderStatus.Released: return 3;
      case SalesOrderStatus.Allocated: return 4;
      case SalesOrderStatus.Picking: return 5;
      case SalesOrderStatus.Picked: return 5;
      case SalesOrderStatus.Packing: return 6;
      case SalesOrderStatus.PartiallyShipped: return 7;
      case SalesOrderStatus.Shipped: return 7;
      case SalesOrderStatus.Delivered: return 8;
      case SalesOrderStatus.Closed: return 9;
      default: return -1;
    }
  };
  const currentStepIndex = getTimelineIndex(order.status);

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/outbound/sales-orders')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              Đơn bán hàng: {order.orderNumber}
              <StatusBadge 
                status={getStatusString(order.status)} 
                text={salesOrderStatusLabel[order.status as unknown as SalesOrderStatus]} 
              />
            </h1>
            <p className="text-slate-500 text-sm mt-1">Khách hàng: {order.customerName}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {order.status === SalesOrderStatus.Draft && (
            <>
              <button 
                onClick={() => navigate(`/outbound/sales-orders/${id}/edit`)}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Edit size={18} /> Chỉnh sửa
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Submit đơn hàng để xin duyệt?')) submitMutation.mutate(order.id);
                }}
                disabled={submitMutation.isPending}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                Submit
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Hủy đơn hàng này?')) cancelMutation.mutate(order.id);
                }}
                disabled={cancelMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-medium hover:bg-danger-hover transition-colors flex items-center gap-2"
              >
                <XCircle size={18} /> Hủy
              </button>
            </>
          )}

          {order.status === SalesOrderStatus.Submitted && (
            <>
              <button 
                onClick={() => {
                  if (window.confirm('Duyệt đơn hàng này?')) approveMutation.mutate(order.id);
                }}
                disabled={approveMutation.isPending}
                className="bg-success text-white px-4 py-2 rounded-lg font-medium hover:bg-success-hover transition-colors flex items-center gap-2"
              >
                <CheckCircle size={18} /> Duyệt
              </button>
              <button 
                onClick={() => {
                  const reason = window.prompt('Lý do từ chối?');
                  if (reason) rejectMutation.mutate({ id: order.id, reason });
                }}
                disabled={rejectMutation.isPending}
                className="bg-white border border-danger text-danger px-4 py-2 rounded-lg font-medium hover:bg-danger/5 transition-colors flex items-center gap-2"
              >
                <Ban size={18} /> Từ chối
              </button>
            </>
          )}

          {order.status === SalesOrderStatus.Approved && (
             <button 
               onClick={() => {
                 if (window.confirm('Release đơn hàng để bắt đầu xử lý kho?')) releaseMutation.mutate(order.id);
               }}
               disabled={releaseMutation.isPending}
               className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
             >
               <Play size={18} /> Release to Warehouse
             </button>
          )}

          {order.status === SalesOrderStatus.Released && (
            <>
              <button 
                onClick={() => {
                   // Open Allocation Modal, or navigate to an allocation page.
                   // Since Allocation is done via API, we can trigger Auto Allocate or open the modal.
                   navigate(`/outbound/allocation?salesOrderId=${order.id}`);
                }}
                className="bg-info text-white px-4 py-2 rounded-lg font-medium hover:bg-info/90 transition-colors flex items-center gap-2"
              >
                Allocate Inventory
              </button>
              <button 
                onClick={() => {
                  const reason = window.prompt('Lý do tạm giữ?');
                  if (reason) holdMutation.mutate({ id: order.id, reason });
                }}
                disabled={holdMutation.isPending}
                className="bg-warning text-white px-4 py-2 rounded-lg font-medium hover:bg-warning/90 transition-colors flex items-center gap-2"
              >
                <Pause size={18} /> Tạm giữ
              </button>
            </>
          )}

          {order.status === SalesOrderStatus.OnHold && (
             <button 
               onClick={() => {
                 if (window.confirm('Gỡ tạm giữ đơn hàng này?')) unHoldMutation.mutate(order.id);
               }}
               disabled={unHoldMutation.isPending}
               className="bg-success text-white px-4 py-2 rounded-lg font-medium hover:bg-success-hover transition-colors flex items-center gap-2"
             >
               <Play size={18} /> Tiếp tục (UnHold)
             </button>
          )}

          {order.status === SalesOrderStatus.Allocated && (
            <button 
              onClick={() => {
                if (pickingOrder) {
                  navigate(`/outbound/picking/${pickingOrder.id}`);
                } else {
                  message.error('Không tìm thấy lệnh nhặt hàng liên kết với đơn này.');
                }
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Package size={18} /> Xem lệnh nhặt hàng (Picking)
            </button>
          )}
        </div>
      </div>

      {/* Enterprise Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-6">Order Timeline</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0"></div>
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${idx <= currentStepIndex ? 'bg-primary border-primary text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                {idx + 1}
              </div>
              <span className={`text-xs font-medium ${idx <= currentStepIndex ? 'text-slate-800' : 'text-slate-400'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Lines */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText size={18} /> Danh sách sản phẩm
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Sản phẩm</th>
                    <th className="px-6 py-3 font-medium">ĐVT</th>
                    <th className="px-6 py-3 font-medium text-right">SL Đặt</th>
                    <th className="px-6 py-3 font-medium text-right">Đã nhặt</th>
                    <th className="px-6 py-3 font-medium text-right">Đã giao</th>
                    <th className="px-6 py-3 font-medium text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines?.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{line.productSku}</div>
                        <div className="text-xs text-slate-500">{line.productName}</div>
                      </td>
                      <td className="px-6 py-4">{line.uomCode}</td>
                      <td className="px-6 py-4 text-right font-medium">{line.qtyOrdered}</td>
                      <td className="px-6 py-4 text-right text-warning">{line.qtyPicked}</td>
                      <td className="px-6 py-4 text-right text-success">{line.qtyShipped}</td>
                      <td className="px-6 py-4 text-right">{line.lineTotal.toLocaleString('vi-VN')} ₫</td>
                    </tr>
                  ))}
                  {!order.lines?.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        Chưa có sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Thông tin thanh toán</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tạm tính:</span>
                <span className="font-medium">{order.subTotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thuế:</span>
                <span className="font-medium">{order.taxAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phí vận chuyển:</span>
                <span className="font-medium">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <span className="font-semibold text-slate-700">Tổng cộng:</span>
                <span className="font-bold text-primary text-lg">{order.grandTotal.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Thông tin khác</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Ngày đặt hàng</p>
                <p className="font-medium">{order.orderDate ? format(new Date(order.orderDate), 'dd/MM/yyyy HH:mm') : '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Kho xuất</p>
                <p className="font-medium">{order.warehouseCode}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Tham chiếu ngoài (Ref)</p>
                <p className="font-medium">{order.externalReference || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailPage;



