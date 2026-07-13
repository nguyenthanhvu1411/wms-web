import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCycleCounts } from './hooks/useCycleCounts';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import { CycleCountStatus, cycleCountStatusLabel } from '@/types/wms-enums';
import type { CycleCount } from '@/types/operations';
import { format } from 'date-fns';

const getStatusKey = (status: number): string => {
  const found = Object.entries(CycleCountStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const formatQty = (val: number | undefined) =>
  typeof val === 'number' ? new Intl.NumberFormat('vi-VN').format(val) : '-';

const CycleCountListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    keyword?: string;
    warehouseId?: number;
    status?: number;
    assignedTo?: string;
    scheduledFrom?: string;
    scheduledTo?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useCycleCounts({
    page: pageIndex,
    pageSize: 15,
    keyword: filters.keyword,
    warehouseId: filters.warehouseId,
    status: filters.status,
    assignedTo: filters.assignedTo,
    scheduledFrom: filters.scheduledFrom,
    scheduledTo: filters.scheduledTo,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const cycleCounts = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const handleCreate = () => navigate('/cycle-counts/create');
  const handleView = (id: number) => navigate(`/cycle-counts/${id}`);

  const columns: Column<CycleCount>[] = [
    {
      header: 'MÃ KIỂM KÊ',
      cell: (item) => (
        <div>
          <div className="font-mono font-semibold text-slate-900 text-sm">{item.countNumber}</div>
          <div className="text-xs text-slate-400 mt-0.5">{format(new Date(item.createdAt), 'dd/MM/yyyy')}</div>
        </div>
      ),
    },
    {
      header: 'KHO',
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.warehouseName || '-'}</div>
          <div className="text-xs text-slate-400 font-mono">{item.warehouseCode}</div>
        </div>
      ),
    },
    {
      header: 'NGƯỜI PHỤ TRÁCH',
      cell: (item) => <span className="text-slate-700">{item.assignedToFullName || item.assignedTo || '—'}</span>,
    },
    {
      header: 'NGÀY LÊN LỊCH',
      cell: (item) => item.scheduledDate ? format(new Date(item.scheduledDate), 'dd/MM/yyyy') : '—',
    },
    {
      header: 'TIẾN ĐỘ',
      cell: (item) => {
        const pct = item.totalLines > 0 ? Math.round((item.countedLines / item.totalLines) * 100) : 0;
        return (
          <div>
            <div className="text-sm font-bold text-slate-900 font-mono">{item.countedLines}/{item.totalLines}</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{pct}%</div>
          </div>
        );
      },
      className: 'min-w-[120px]',
    },
    {
      header: 'CHÊNH LỆCH',
      cell: (item) => (
        <span className={`font-bold font-mono ${item.totalVarianceQty !== 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
          {item.totalVarianceQty > 0 ? `+${formatQty(item.totalVarianceQty)}` : formatQty(item.totalVarianceQty)}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <StatusBadge
          status={getStatusKey(item.status)}
          text={cycleCountStatusLabel[item.status as CycleCountStatus] || 'Không rõ'}
        />
      ),
    },
    {
      header: 'THAO TÁC',
      className: 'text-right',
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleView(item.id)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors border border-transparent hover:border-slate-300"
            title="Xem chi tiết"
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
          <h1 className="text-2xl font-bold text-text-primary">Kiểm kê kho</h1>
          <p className="text-text-secondary mt-1">Quản lý và thực hiện kiểm đếm đối chiếu tồn kho thực tế</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> LÊN LỊCH KIỂM KÊ
        </button>
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({}); setPageIndex(1); }}
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Kho hàng</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.warehouseId ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, warehouseId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả kho --</option>
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
            {Object.entries(cycleCountStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Người phụ trách</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Tên hoặc mã nhân viên..."
            value={filters.assignedTo || ''}
            onChange={(e) => { setFilters(f => ({ ...f, assignedTo: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ngày lên lịch từ</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.scheduledFrom || ''}
            onChange={(e) => { setFilters(f => ({ ...f, scheduledFrom: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Ngày lên lịch đến</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.scheduledTo || ''}
            onChange={(e) => { setFilters(f => ({ ...f, scheduledTo: e.target.value || undefined })); setPageIndex(1); }}
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
        data={cycleCounts}
        pageIndex={pageIndex}
        pageSize={15}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CycleCountListPage;
