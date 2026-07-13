import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useSalesOrders, 
  useSubmitSalesOrder, 
  useApproveSalesOrder, 
  useRejectSalesOrder, 
  useReleaseSalesOrder,
  useUnHoldSalesOrder 
} from './hooks/useSalesOrders';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye, CheckCircle, Package, Send, XCircle, Play, Box, Check } from 'lucide-react';
import { SalesOrderStatus, salesOrderStatusLabel } from '@/types/wms-enums';
import type { SalesOrder } from '@/types/outbound';
import { format } from 'date-fns';

const SalesOrderListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useSalesOrders({ page, pageSize: 10, search: searchTerm });
  const submitMutation = useSubmitSalesOrder();
  const approveMutation = useApproveSalesOrder();
  const rejectMutation = useRejectSalesOrder();
  const releaseMutation = useReleaseSalesOrder();
  const unholdMutation = useUnHoldSalesOrder();

  const salesOrders = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const handleCreate = () => navigate('/outbound/sales-orders/create');
  const handleView = (id: number) => navigate(`/outbound/sales-orders/${id}`);

  const getStatusString = (status: number) => {
    switch(status) {
      case SalesOrderStatus.Draft: return 'Draft';
      case SalesOrderStatus.Submitted: return 'Pending';
      case SalesOrderStatus.Approved: return 'Approved';
      case SalesOrderStatus.Released: return 'Active';
      case SalesOrderStatus.Allocated:
      case SalesOrderStatus.Picking:
      case SalesOrderStatus.Picked:
      case SalesOrderStatus.Packing: return 'InProgress';
      case SalesOrderStatus.Shipped:
      case SalesOrderStatus.Delivered:
      case SalesOrderStatus.Closed: return 'Completed';
      case SalesOrderStatus.Cancelled: return 'Cancelled';
      case SalesOrderStatus.OnHold: return 'Warning';
      default: return 'Draft';
    }
  };

  const columns = [
    { header: 'Mã đơn bán', accessorKey: 'orderNumber' as keyof SalesOrder, className: 'font-mono text-primary font-medium' },
    { header: 'Khách hàng', accessorKey: 'customerName' as keyof SalesOrder, className: 'font-medium text-text-primary' },
    { header: 'Kho xuất', accessorKey: 'warehouseCode' as keyof SalesOrder },
    { 
      header: 'Ngày đặt', 
      cell: (item: SalesOrder) => item.orderDate ? format(new Date(item.orderDate), 'dd/MM/yyyy') : '-'
    },
    { 
      header: 'Tổng tiền', 
      cell: (item: SalesOrder) => item.grandTotal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
      className: 'text-right'
    },
    { 
      header: 'Độ ưu tiên', 
      cell: (item: SalesOrder) => {
        if (!item.priority) return '-';
        const priorities: Record<string, string> = { 'High': 'Cao', 'Normal': 'Bình thường', 'Low': 'Thấp', 'Urgent': 'Khẩn cấp' };
        const label = priorities[item.priority] || item.priority;
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${item.priority === 'High' || item.priority === 'Urgent' ? 'bg-red-100 text-red-700' : item.priority === 'Low' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
            {label}
          </span>
        );
      }
    },
    { 
      header: 'Trạng thái', 
      cell: (item: SalesOrder) => (
        <StatusBadge 
          status={getStatusString(item.status)} 
          text={salesOrderStatusLabel[item.status as unknown as SalesOrderStatus]} 
        />
      )
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: SalesOrder) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleView(item.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          
          {item.status === SalesOrderStatus.Draft && (
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn Submit đơn bán hàng này?')) {
                  submitMutation.mutate(item.id);
                }
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Submit"
            >
              <Send size={18} />
            </button>
          )}

          {item.status === SalesOrderStatus.Submitted && (
            <>
              <button 
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn Approve đơn hàng này?')) {
                    approveMutation.mutate(item.id);
                  }
                }}
                className="p-1.5 text-success hover:bg-success/10 rounded transition-colors" title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button 
                onClick={() => {
                  const reason = window.prompt('Nhập lý do từ chối:');
                  if (reason) rejectMutation.mutate({ id: item.id, reason });
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          )}

          {item.status === SalesOrderStatus.Approved && (
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn Release đơn hàng này để chuẩn bị kho?')) {
                  releaseMutation.mutate(item.id);
                }
              }}
              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded transition-colors" title="Release"
            >
              <Play size={18} />
            </button>
          )}

          {item.status === SalesOrderStatus.Released && (
            <button 
              onClick={() => navigate(`/outbound/allocation?salesOrderId=${item.id}`)}
              className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors" title="Allocate (Cấp Phát Kho)"
            >
              <Package size={18} />
            </button>
          )}

          {(item.status === SalesOrderStatus.Allocated || item.status === SalesOrderStatus.Picking) && (
            <button 
              onClick={() => navigate(`/outbound/picking?salesOrderNumber=${item.orderNumber}`)}
              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Xem Picking"
            >
              <Box size={18} />
            </button>
          )}

          {item.status === SalesOrderStatus.Picked && (
            <button 
              onClick={() => navigate(`/outbound/shipping/pack?salesOrderNumber=${item.orderNumber}`)}
              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Pack (Đóng gói)"
            >
              <Package size={18} />
            </button>
          )}

          {item.status === SalesOrderStatus.Packing && (
            <button 
              onClick={() => navigate(`/outbound/shipping`)}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Dispatch (Xuất kho)"
            >
              <Send size={18} />
            </button>
          )}
          
          {item.status === SalesOrderStatus.Shipped && (
            <button 
              onClick={() => {
                if (window.confirm('Xác nhận đã giao hàng (Delivered)?')) {
                  // TODO: Delivered Mutation (Out of scope for this change, maybe just placeholder)
                }
              }}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark Delivered"
            >
              <Check size={18} />
            </button>
          )}

          {item.status === SalesOrderStatus.OnHold && (
            <button 
              onClick={() => unholdMutation.mutate(item.id)}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Unhold"
            >
              <Play size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Đơn Bán Hàng</h1>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Tạo Đơn Bán Hàng
        </button>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={salesOrders}
        pageIndex={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SalesOrderListPage;



