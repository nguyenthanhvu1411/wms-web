import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select } from 'antd';
import { useVendorReturns } from './hooks/useVendorReturns';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import { ReturnToVendorStatus, returnToVendorStatusLabel } from '@/types/wms-enums';
import { format } from 'date-fns';
import type { ReturnToVendorOrder } from '@/types/inbound';

const VendorReturnListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);


  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useVendorReturns({ 
    page: pageIndex, 
    pageSize: 10, 
    // search: searchTerm 
  });

  const returns = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const handleCreate = () => navigate('/returns/vendor/create');
  const handleView = (id: number) => navigate(`/returns/vendor/${id}`);

  const getStatusString = (status: number) => {
    switch(status) {
      case ReturnToVendorStatus.Draft: return 'draft';
      case ReturnToVendorStatus.Submitted: return 'submitted';
      case ReturnToVendorStatus.Approved: return 'approved';
      case ReturnToVendorStatus.Shipped: return 'shipped';
      case ReturnToVendorStatus.Completed: return 'completed';
      case ReturnToVendorStatus.Cancelled: return 'cancelled';
      default: return 'draft';
    }
  };

  const getStatusLabel = (status: number) => {
    return returnToVendorStatusLabel[status as ReturnToVendorStatus] || 'Nháp';
  };

  const columns: Column<ReturnToVendorOrder>[] = [
    { 
      header: 'Mã RTV', 
      accessorKey: 'returnNumber', 
      className: 'font-mono text-primary font-medium min-w-[120px]' 
    },
    { 
      header: 'Nhà cung cấp', 
      cell: (item) => (
        <div>
          <div className="font-medium text-text-primary">{item.supplierName || '-'}</div>
          <div className="text-xs text-slate-500">{item.supplierCode || '-'}</div>
        </div>
      ),
      className: 'min-w-[150px]'
    },
    { 
      header: 'Chứng từ', 
      cell: (item) => (
        <div className="flex flex-col gap-0.5 text-xs font-mono text-slate-600">
          {item.poNumber && <div>PO: {item.poNumber}</div>}
          {item.asnNumber && <div>ASN: {item.asnNumber}</div>}
          {item.grNumber && <div>GR: {item.grNumber}</div>}
          {item.qcNumber && <div>QC: {item.qcNumber}</div>}
          {!item.poNumber && !item.asnNumber && !item.grNumber && !item.qcNumber && '-'}
        </div>
      ),
      className: 'min-w-[120px]'
    },
    { 
      header: 'Kho trả', 
      accessorKey: 'warehouseName',
      className: 'font-medium min-w-[100px]',
      cell: (item) => item.warehouseName || '-'
    },
    { 
      header: 'Lý do', 
      accessorKey: 'reason', 
      className: 'text-slate-500 max-w-[150px] truncate',
      cell: (item) => item.reason || '-'
    },
    { 
      header: 'Tổng SKU', 
      cell: (item) => item.lines?.length || 0, 
      className: 'text-right min-w-[80px]' 
    },
    { 
      header: 'Tổng SL', 
      cell: (item) => item.totalQty || 0, 
      className: 'text-right min-w-[100px]' 
    },
    { 
      header: 'Tổng giá trị', 
      cell: (item) => item.grandTotal ? item.grandTotal.toLocaleString() + ' đ' : (item.totalCost ? item.totalCost.toLocaleString() + ' đ' : '-'), 
      className: 'text-right text-success font-medium min-w-[100px]' 
    },
    {
      header: 'Hoàn tiền / Credit',
      cell: (item) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {(item.supplierRefund ?? 0) > 0 && <div className="text-emerald-600 font-medium">Refund: {item.supplierRefund!.toLocaleString()} đ</div>}
          {item.creditNote && <div className="text-amber-600 font-mono">Credit: {item.creditNote}</div>}
          {!item.supplierRefund && !item.creditNote && <span className="text-slate-400">-</span>}
        </div>
      ),
      className: 'min-w-[130px]'
    },
    { 
      header: 'Vận chuyển', 
      cell: (item) => (
        <div>
          <div>{item.carrierName || '-'}</div>
          <div className="text-xs text-slate-500 font-mono">{item.trackingNumber || ''}</div>
        </div>
      ),
      className: 'min-w-[120px]' 
    },
    {
      header: 'Ngày dự kiến',
      cell: (item) => item.estimatedArrival ? format(new Date(item.estimatedArrival), 'dd/MM/yyyy HH:mm') : '-',
      className: 'min-w-[120px]'
    },
    { 
      header: 'Ngày tạo', 
      cell: (item) => (
        <div>
          <div>{item.returnDate ? format(new Date(item.returnDate), 'dd/MM/yyyy HH:mm') : '-'}</div>
          <div className="text-xs text-slate-500">{item.submittedBy || '-'}</div>
        </div>
      ),
      className: 'min-w-[120px]'
    },
    {
      header: 'Người tạo',
      cell: (item) => item.createdBy || '-',
      className: 'min-w-[100px]'
    },
    { 
      header: 'Phê duyệt', 
      cell: (item) => (
        <div>
          <div>{item.approvedAt ? format(new Date(item.approvedAt), 'dd/MM/yyyy HH:mm') : '-'}</div>
          <div className="text-xs text-slate-500">{item.approvedBy || '-'}</div>
        </div>
      ),
      className: 'min-w-[120px]' 
    },
    { 
      header: 'Trạng thái', 
      cell: (item) => (
        <StatusBadge 
          status={getStatusString(item.status)} 
          text={getStatusLabel(item.status)} 
        />
      ),
      className: 'min-w-[120px]'
    },
    {
      header: 'Thao tác',
      className: 'text-right w-24',
      cell: (item) => (
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
          <h1 className="text-2xl font-bold text-text-primary">Trả hàng Nhà cung cấp (RTV)</h1>
          <p className="text-text-secondary mt-1">Quản lý các phiếu trả hàng lỗi, quá hạn cho nhà cung cấp</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Tạo phiếu RTV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Tổng phiếu</p>
          <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-amber-600">{returns.filter(r => r.status === ReturnToVendorStatus.Submitted).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Đã duyệt</p>
          <p className="text-2xl font-bold text-blue-600">{returns.filter(r => r.status === ReturnToVendorStatus.Approved).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Đã vận chuyển</p>
          <p className="text-2xl font-bold text-indigo-600">{returns.filter(r => r.status === ReturnToVendorStatus.Shipped).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Hoàn thành</p>
          <p className="text-2xl font-bold text-emerald-600">{returns.filter(r => r.status === ReturnToVendorStatus.Completed).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Hủy</p>
          <p className="text-2xl font-bold text-red-600">{returns.filter(r => r.status === ReturnToVendorStatus.Cancelled).length}</p>
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
          <label className="block text-xs text-slate-500 mb-1">Nhà cung cấp</label>
          <Select className="w-full" placeholder="Chọn nhà cung cấp..." options={[{ value: 1, label: 'NCC A' }]} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Kho hàng</label>
          <Select className="w-full" placeholder="Chọn kho..." options={[{ value: 1, label: 'Kho Trung Tâm' }]} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Trạng thái</label>
          <Select className="w-full" placeholder="Tất cả trạng thái..." options={Object.entries(returnToVendorStatusLabel).map(([v, l]) => ({ value: Number(v), label: l as string }))} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Lý do</label>
          <Select className="w-full" placeholder="Tất cả lý do..." options={[{ value: 'Lỗi', label: 'Hàng lỗi' }, { value: 'Khác', label: 'Khác' }]} />
        </div>
        <div className="md:col-span-2">
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

export default VendorReturnListPage;
