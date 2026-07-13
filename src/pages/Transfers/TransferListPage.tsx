import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransfers } from './hooks/useTransfers';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye, ArrowRight } from 'lucide-react';
import { TransferStatus, transferStatusLabel } from '@/types/wms-enums';
import type { TransferOrder } from '@/types/operations';
import { format } from 'date-fns';

const getStatusKey = (status: number): string => {
  const found = Object.entries(TransferStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const formatQty = (val: number | undefined) =>
  typeof val === 'number' ? new Intl.NumberFormat('vi-VN').format(val) : '-';

const TransferListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    keyword?: string;
    fromWarehouseId?: number;
    toWarehouseId?: number;
    status?: number;
    createdFrom?: string;
    createdTo?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useTransfers({
    page: pageIndex,
    pageSize: 20,
    keyword: filters.keyword,
    fromWarehouseId: filters.fromWarehouseId,
    toWarehouseId: filters.toWarehouseId,
    status: filters.status,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const transfers = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const handleCreate = () => navigate('/transfers/create');
  const handleView = (id: number) => navigate(`/transfers/${id}`);

  const columns: Column<TransferOrder>[] = [
    {
      header: 'CHỨNG TỪ',
      cell: (item) => (
        <div>
          <div className="text-sm font-bold text-slate-900 font-mono">{item.transferNumber}</div>
          <div className="text-xs text-slate-400 mt-0.5">{item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</div>
        </div>
      ),
    },
    {
      header: 'ĐIỀU CHUYỂN',
      className: 'min-w-[220px]',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 text-right">
            <div className="text-xs font-bold text-slate-700">{item.fromWarehouseCode}</div>
            <div className="text-[11px] text-slate-400 font-mono">{item.fromLocationCode}</div>
          </div>
          <ArrowRight size={14} className="text-slate-300 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-700">{item.toWarehouseCode}</div>
            <div className="text-[11px] text-slate-400 font-mono">{item.toLocationCode}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'HÀNG HÓA',
      cell: (item) => (
        <div>
          <div className="text-sm font-bold text-slate-900 font-mono">{item.productSku}</div>
          <div className="text-xs text-slate-500 max-w-[150px] truncate">{item.productName}</div>
          {item.lotNumber && <div className="text-[11px] text-slate-400 font-mono">Lô: {item.lotNumber}</div>}
        </div>
      ),
    },
    {
      header: 'SL YÊU CẦU',
      cell: (item) => (
        <div className="text-right">
          <div className="text-sm font-mono font-bold text-slate-900">
            {formatQty(item.qtyRequested)} <span className="text-xs font-normal text-slate-400">{item.uomCode}</span>
          </div>
          {item.status === TransferStatus.Completed && item.qtyTransferred !== item.qtyRequested && (
            <div className={`text-xs font-mono font-bold ${item.qtyTransferred < item.qtyRequested ? 'text-orange-600' : 'text-emerald-600'}`}>
              Thực tế: {formatQty(item.qtyTransferred)}
            </div>
          )}
        </div>
      ),
      className: 'text-right',
    },
    {
      header: 'NGƯỜI Y/C',
      cell: (item) => <span className="text-slate-600 text-sm">{item.requestedBy || '—'}</span>,
    },
    {
      header: 'NGÀY DỰ KIẾN',
      cell: (item) => item.plannedDate ? format(new Date(item.plannedDate), 'dd/MM/yyyy') : '—',
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <StatusBadge
          status={getStatusKey(item.status)}
          text={transferStatusLabel[item.status as TransferStatus] || 'Không rõ'}
        />
      ),
    },
    {
      header: '',
      className: 'text-right w-12',
      cell: (item) => (
        <button
          onClick={() => handleView(item.id)}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors border border-transparent hover:border-slate-300"
          title="Xem chi tiết"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Điều chuyển kho</h1>
          <p className="text-text-secondary mt-1">Quản lý lệnh điều chuyển hàng hóa nội bộ giữa các kho</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> TẠO PHIẾU CHUYỂN
        </button>
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({}); setPageIndex(1); }}
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Kho nguồn</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.fromWarehouseId ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, fromWarehouseId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả kho nguồn --</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Kho đích</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.toWarehouseId ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, toWarehouseId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả kho đích --</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.status ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.entries(transferStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Từ ngày tạo</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.createdFrom || ''}
            onChange={(e) => { setFilters(f => ({ ...f, createdFrom: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Đến ngày tạo</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.createdTo || ''}
            onChange={(e) => { setFilters(f => ({ ...f, createdTo: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
      </AdvancedFilter>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Lỗi tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      <DataTable
        columns={columns}
        data={transfers}
        pageIndex={pageIndex}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TransferListPage;
