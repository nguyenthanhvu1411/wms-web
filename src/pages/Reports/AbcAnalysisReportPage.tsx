import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { TrendingUp } from 'lucide-react';
import type { AbcAnalysisResponse } from '@/types/operations';

const formatVND = (val: number | undefined) => {
  return val !== undefined
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '-';
};

const AbcBadge = ({ grade }: { grade: string | undefined }) => {
  const colors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    B: 'bg-blue-100 text-blue-800 border border-blue-300',
    C: 'bg-slate-100 text-slate-600 border border-slate-300',
  };
  const g = (grade || '').toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${colors[g] || colors['C']}`}>
      {g || '?'}
    </span>
  );
};

const AbcAnalysisReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    fromDate?: string;
    toDate?: string;
    abcGrade?: string;
    keyword?: string;
  }>({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10),
    toDate: new Date().toISOString().substring(0, 10),
  });

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_abc', filters.warehouseId, filters.fromDate, filters.toDate],
    queryFn: () =>
      reportsApi.getAbcAnalysis({
        warehouseId: filters.warehouseId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const rawData = useMemo(() => queryData || [], [queryData]);

  const reportData = useMemo(() => {
    let items = rawData;
    if (filters.abcGrade) {
      items = items.filter((item: AbcAnalysisResponse) => (item.abcClass || '').toUpperCase() === filters.abcGrade);
    }
    // Filter keyword client-side since API doesn't take keyword parameter
    if (filters.keyword) {
      const lowerKeyword = filters.keyword.toLowerCase();
      items = items.filter((item: AbcAnalysisResponse) => 
        (item.productSku?.toLowerCase() || '').includes(lowerKeyword) ||
        (item.productName?.toLowerCase() || '').includes(lowerKeyword)
      );
    }
    return items;
  }, [rawData, filters.abcGrade, filters.keyword]);

  // Client-side pagination since backend returns full array
  const pageSize = 20;
  const totalCount = reportData.length;
  const pagedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return reportData.slice(start, start + pageSize);
  }, [reportData, pageIndex]);

  const abcSummary = useMemo(() => {
    const all = rawData;
    const aItems = all.filter((i: AbcAnalysisResponse) => (i.abcClass || '').toUpperCase() === 'A');
    const bItems = all.filter((i: AbcAnalysisResponse) => (i.abcClass || '').toUpperCase() === 'B');
    const cItems = all.filter((i: AbcAnalysisResponse) => (i.abcClass || '').toUpperCase() === 'C');
    return { a: aItems.length, b: bItems.length, c: cItems.length };
  }, [rawData]);

  const columns: Column<AbcAnalysisResponse>[] = [
    {
      header: 'PHÂN LOẠI',
      cell: (item) => <AbcBadge grade={item.abcClass} />,
      className: 'text-center w-24',
    },
    { header: 'XẾP HẠNG', cell: (item) => <span className="font-bold text-slate-500 text-sm">#{item.rank}</span>, className: 'text-center w-24' },
    { header: 'MÃ SP', cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.productSku || '-'}</span> },
    {
      header: 'TÊN SẢN PHẨM',
      cell: (item) => <div className="font-medium text-slate-800">{item.productName || '-'}</div>,
    },
    {
      header: 'DOANH THU',
      cell: (item) => <span className="font-bold font-mono text-sm">{formatVND(item.annualRevenue)}</span>,
      className: 'text-right',
    },
    {
      header: '% DT LŨY KẾ',
      cell: (item) => {
        const pct = item.cumulativePct;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 min-w-[60px]">
              <div className={`h-1.5 rounded-full ${pct <= 80 ? 'bg-emerald-500' : pct <= 95 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">{pct.toFixed(1)}%</span>
          </div>
        );
      },
      className: 'min-w-[140px]',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp size={22} className="text-emerald-500" />
            Phân tích ABC Hàng hóa
          </h1>
          <p className="text-text-secondary mt-1">
            Phân loại sản phẩm theo giá trị doanh thu – tập trung kiểm soát nhóm A
          </p>
        </div>
      </div>

      {/* ABC Legend */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { grade: 'A', label: 'Hàng chiến lược', desc: '~20% SKU tạo 80% doanh thu', color: 'border-emerald-200 bg-emerald-50', textColor: 'text-emerald-700', count: abcSummary.a },
          { grade: 'B', label: 'Hàng quan trọng', desc: '~30% SKU tạo 15% doanh thu', color: 'border-blue-200 bg-blue-50', textColor: 'text-blue-700', count: abcSummary.b },
          { grade: 'C', label: 'Hàng thông thường', desc: '~50% SKU tạo 5% doanh thu', color: 'border-slate-200 bg-slate-50', textColor: 'text-slate-600', count: abcSummary.c },
        ].map(({ grade, label, desc, color, textColor, count }) => (
          <div
            key={grade}
            className={`border ${color} rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${filters.abcGrade === grade ? 'ring-2 ring-primary' : ''}`}
            onClick={() => { setFilters(f => ({ ...f, abcGrade: f.abcGrade === grade ? undefined : grade })); setPageIndex(1); }}
          >
            <div className="flex items-center gap-3">
              <AbcBadge grade={grade} />
              <div>
                <div className={`font-bold text-sm ${textColor}`}>{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
              </div>
              {count > 0 && (
                <span className={`ml-auto text-lg font-black ${textColor}`}>{count}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => {
          setFilters({
            fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10),
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

      <DataTable
        columns={columns}
        data={pagedData}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AbcAnalysisReportPage;
