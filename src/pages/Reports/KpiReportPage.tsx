import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { BarChart2, Zap, TrendingDown, Skull } from 'lucide-react';
import type { InventoryKpiResponse } from '@/types/operations';

// Backend returns InventoryKpiResponse (typed), not ReportRowResponse
const KpiReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    fromDate?: string;
    toDate?: string;
  }>({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
    toDate: new Date().toISOString().substring(0, 10),
  });

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports', 'kpi', pageIndex, filters],
    queryFn: () =>
      reportsApi.getKpi({
        warehouseId: filters.warehouseId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: pageIndex,
        pageSize: 50,
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const reportData = useMemo(() => (queryData?.items || []) as InventoryKpiResponse[], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  // Summary stats
  const stats = useMemo(() => ({
    fastMoving: reportData.filter(i => i.isFastMoving).length,
    slowMoving: reportData.filter(i => i.isSlowMoving).length,
    deadStock: reportData.filter(i => i.isDeadStock).length,
    totalValue: reportData.reduce((s, i) => s + (i.totalValue || 0), 0),
  }), [reportData]);

  const formatVND = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

  const formatQty = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  const abcColor: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border border-blue-300',
    C: 'bg-slate-100 text-slate-600 border border-slate-200',
  };

  const columns: Column<InventoryKpiResponse>[] = [
    {
      header: 'KHO',
      cell: (item) => <span className="font-medium text-slate-700 text-sm">{item.warehouseCode || '-'}</span>,
    },
    {
      header: 'MÃ SP',
      cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.productSku || '-'}</span>,
    },
    {
      header: 'TÊN SẢN PHẨM',
      cell: (item) => <span className="text-sm text-slate-800">{item.productName || '-'}</span>,
    },
    {
      header: 'TỒN KHO',
      cell: (item) => <span className="font-bold font-mono">{formatQty(item.qtyOnHand)}</span>,
      className: 'text-right',
    },
    {
      header: 'GIÁ TRỊ TỒN',
      cell: (item) => <span className="font-bold font-mono text-sm">{formatVND(item.totalValue)}</span>,
      className: 'text-right',
    },
    {
      header: 'VÒNG QUAY',
      cell: (item) => (
        <span className={`font-mono font-bold ${item.turnoverRatio > 2 ? 'text-emerald-600' : item.turnoverRatio > 0.5 ? 'text-slate-700' : 'text-red-500'}`}>
          {item.turnoverRatio.toFixed(1)}x
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'NGÀY KHÔNG ĐỘNG',
      cell: (item) => {
        const d = item.daysSinceLastMovement;
        return (
          <span className={`font-mono font-bold ${d >= 180 ? 'text-red-600' : d >= 90 ? 'text-orange-500' : 'text-slate-600'}`}>
            {d >= 999 ? '∞' : `${d}d`}
          </span>
        );
      },
      className: 'text-right',
    },
    {
      header: 'PHÂN LOẠI ABC',
      cell: (item) => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-black ${abcColor[item.abcClass] || abcColor['C']}`}>
          {item.abcClass}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'TÌNH TRẠNG',
      cell: (item) => {
        if (item.isDeadStock) return <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><Skull size={12} /> Hàng chết</span>;
        if (item.isSlowMoving) return <span className="flex items-center gap-1 text-orange-500 text-xs font-semibold"><TrendingDown size={12} /> Chậm</span>;
        if (item.isFastMoving) return <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><Zap size={12} /> Nhanh</span>;
        return <span className="text-slate-400 text-xs">Bình thường</span>;
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 size={24} /> Báo cáo KPI kho hàng
          </h1>
          <p className="text-text-secondary mt-1">Phân tích tồn kho theo vòng quay, tình trạng và phân loại ABC</p>
        </div>
      </div>

      {/* Summary strip */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Hàng nhanh', val: stats.fastMoving, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: Zap },
            { label: 'Hàng chậm', val: stats.slowMoving, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', icon: TrendingDown },
            { label: 'Hàng chết (≥180 ngày)', val: stats.deadStock, color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Skull },
            { label: 'Tổng giá trị tồn', val: formatVND(stats.totalValue), color: 'text-slate-900', bg: 'bg-white border-border', icon: BarChart2 },
          ].map(({ label, val, color, bg, icon: Icon }) => (
            <div key={label} className={`border rounded-xl p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={color} />
                <span className="text-xs font-medium text-slate-500">{label}</span>
              </div>
              <div className={`text-xl font-black ${color} font-mono`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <AdvancedFilter
        onSearch={() => {}}
        onClear={() => {
          setFilters({
            fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
            toDate: new Date().toISOString().substring(0, 10),
          });
          setPageIndex(1);
        }}
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
          <input type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.fromDate || ''}
            onChange={(e) => { setFilters(f => ({ ...f, fromDate: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
          <input type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.toDate || ''}
            onChange={(e) => { setFilters(f => ({ ...f, toDate: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
      </AdvancedFilter>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Lỗi tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && reportData.length === 0 && !isError && (
        <div className="text-center py-16 text-slate-400">
          <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chưa có dữ liệu KPI</p>
          <p className="text-sm mt-1">Thử thay đổi bộ lọc thời gian hoặc kho hàng</p>
        </div>
      )}

      {(isLoading || reportData.length > 0) && (
        <DataTable
          columns={columns}
          data={reportData}
          pageIndex={pageIndex}
          pageSize={50}
          totalCount={totalCount}
          onPageChange={setPageIndex}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default KpiReportPage;
