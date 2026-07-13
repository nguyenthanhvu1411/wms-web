import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import { useCustomerReturns } from './hooks/useCustomerReturns';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import { ReturnStatus, returnStatusLabel } from '@/types/wms-enums';
import type { ReturnOrder } from '@/types/operations';
import { format } from 'date-fns';

const CustomerReturnListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: queryData, isLoading } = useCustomerReturns({ 
    page: pageIndex, 
    pageSize: 10, 
    // search: searchTerm // TODO: backend doesn't support keyword search yet for ReturnOrderQueryRequest, we just pass page/pageSize
  });

  const returns = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const handleCreate = () => navigate('/returns/customer/create');
  const handleView = (id: number) => navigate(`/returns/customer/${id}`);

  const getStatusString = (status: number) => {
    switch(status) {
      case ReturnStatus.Draft: return 'Draft';
      case ReturnStatus.Submitted: return 'Submitted';
      case ReturnStatus.Approved: return 'Approved';
      case ReturnStatus.Receiving: return 'Receiving';
      case ReturnStatus.QC: return 'QC';
      case ReturnStatus.Disposition: return 'Disposition';
      case ReturnStatus.Putaway: return 'Putaway';
      case ReturnStatus.Completed: return 'Completed';
      case ReturnStatus.Closed: return 'Closed';
      case ReturnStatus.Rejected: return 'Rejected';
      case ReturnStatus.WaitingRefund: return 'WaitingRefund';
      case ReturnStatus.Refunded: return 'Refunded';
      case ReturnStatus.Cancelled: return 'Cancelled';
      default: return 'Draft';
    }
  };

  const columns: Column<ReturnOrder>[] = [
    { 
      header: 'Mã phiếu', 
      accessorKey: 'returnNumber' as keyof ReturnOrder, 
      className: 'font-mono text-primary font-medium min-w-[120px]' 
    },
    { 
      header: 'Mã SO', 
      accessorKey: 'salesOrderNumber' as keyof ReturnOrder, 
      className: 'font-mono text-slate-500 min-w-[120px]' 
    },
    { 
      header: 'Khách hàng', 
      cell: (item: ReturnOrder) => (
        <div>
          <div className="font-medium text-text-primary">{item.customerName || '-'}</div>
          <div className="text-xs text-slate-500">{item.customerCode || '-'} {item.customerType ? `(${item.customerType})` : ''}</div>
        </div>
      ),
      className: 'min-w-[150px]' 
    },
    { 
      header: 'SĐT', 
      accessorKey: 'customerPhone',
      className: 'min-w-[100px]' 
    },
    { 
      header: 'Kho nhận', 
      cell: (item: ReturnOrder) => (
        <div>
          <div className="font-medium">{item.warehouseName || '-'}</div>
          <div className="text-xs text-slate-500 font-mono">{item.warehouseCode || '-'}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'Vận chuyển', 
      cell: (item: ReturnOrder) => (
        <div>
          <div>{item.carrierName || '-'}</div>
          <div className="text-xs text-slate-500 font-mono">{item.trackingNumber || ''}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'Tài chính', 
      cell: (item: ReturnOrder) => (
        <div className="text-right">
          <div>{item.totalAmount ? item.totalAmount.toLocaleString() + ' đ' : '-'}</div>
          <div className="text-xs text-orange-500" title="Hoàn tiền">Refund: {item.refundAmount ? item.refundAmount.toLocaleString() + ' đ' : '0 đ'}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'SL / SKU', 
      cell: (item: ReturnOrder) => (
        <div className="text-right">
          <div>{item.totalQty || 0}</div>
          <div className="text-xs text-slate-500">{item.totalSku || 0} SKU</div>
        </div>
      ),
      className: 'min-w-[80px]'
    },
    { header: 'Lý do', accessorKey: 'reason', className: 'text-slate-500 max-w-[150px] truncate' },
    { 
      header: 'Ngày tạo', 
      cell: (item: ReturnOrder) => (
        <div>
          <div>{item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</div>
          <div className="text-xs text-slate-500">{item.createdBy || '-'}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'Hoàn thành', 
      cell: (item: ReturnOrder) => (
        <div>
          <div>{item.completedAt ? format(new Date(item.completedAt), 'dd/MM/yyyy HH:mm') : '-'}</div>
          <div className="text-xs text-slate-500">{item.completedBy || '-'}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'Trạng thái', 
      cell: (item: ReturnOrder) => (
        <StatusBadge 
          status={getStatusString(item.status)} 
          text={returnStatusLabel[item.status as unknown as ReturnStatus] || 'Draft'} 
        />
      ),
      className: 'min-w-[120px]'
    },
    {
      header: 'Thao tác',
      className: 'text-right w-24',
      cell: (item: ReturnOrder) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleView(item.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hoàn trả khách hàng</h1>
          <p className="text-text-secondary mt-1">Quản lý các yêu cầu trả hàng từ khách hàng, tiếp nhận và kiểm tra QC</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Tạo phiếu trả hàng
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Tổng phiếu</p>
          <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Chờ nhận</p>
          <p className="text-2xl font-bold text-blue-600">{returns.filter(r => r.status === ReturnStatus.Submitted || r.status === ReturnStatus.Approved).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Đang xử lý (QC/Putaway)</p>
          <p className="text-2xl font-bold text-amber-600">{returns.filter(r => r.status === ReturnStatus.Receiving || r.status === ReturnStatus.QC || r.status === ReturnStatus.Disposition || r.status === ReturnStatus.Putaway).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Đã hoàn thành</p>
          <p className="text-2xl font-bold text-emerald-600">{returns.filter(r => r.status === ReturnStatus.Completed).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Hủy</p>
          <p className="text-2xl font-bold text-red-600">{returns.filter(r => r.status === ReturnStatus.Cancelled).length}</p>
        </div>
      </div>

      <AdvancedFilter 
        onSearch={(val) => {
          setSearchTerm(val);
          setPageIndex(1);
        }} 
        onClear={() => {
          setSearchTerm('');
          setPageIndex(1);
        }}
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">Kho hàng</label>
          <Select className="w-full" placeholder="Chọn kho..." options={[{ value: 1, label: 'Kho Trung Tâm' }]} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Trạng thái</label>
          <Select className="w-full" placeholder="Tất cả trạng thái..." options={Object.entries(returnStatusLabel).map(([v, l]) => ({ value: Number(v), label: l as string }))} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Lý do trả</label>
          <Select className="w-full" placeholder="Tất cả lý do..." options={[{ value: 'Lỗi', label: 'Hàng lỗi' }, { value: 'Khác', label: 'Khác' }]} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Từ ngày - Đến ngày</label>
          <div className="flex gap-2">
            <input type="date" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary" />
            <input type="date" className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      </AdvancedFilter>

      <div className="overflow-x-auto pb-4">
        <DataTable
          columns={columns}
          data={returns}
          pageIndex={pageIndex}
          pageSize={10}
          totalCount={totalCount}
          onPageChange={setPageIndex}
          isLoading={isLoading}
        />
      </div>

    </div>
  );
};

export default CustomerReturnListPage;
