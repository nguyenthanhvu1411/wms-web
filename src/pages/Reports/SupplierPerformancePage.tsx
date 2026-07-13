import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import type { ReportRowResponse } from '@/types/operations';

// Backend keys: Supplier, PoNumber, Status, ExpectedDeliveryDate, ActualDeliveryDate, OnTime
const SupplierPerformancePage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    supplierId?: number;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
  }>({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10),
    toDate: new Date().toISOString().substring(0, 10),
  });

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_supplier', pageIndex, filters],
    queryFn: () =>
      reportsApi.getSupplierPerformance({
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        supplierId: filters.supplierId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 200 }),
  });
  const suppliers = suppliersData?.items || [];

  const reportData = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  // Tính tổng theo nhà cung cấp từ raw data (grouping)
  const groupedData = useMemo(() => {
    const map = new Map<string, { supplier: string; total: number; onTime: number; late: number; statuses: string[] }>();
    for (const item of reportData) {
      const supplier = item.values?.['Supplier'] || '—';
      if (!map.has(supplier)) map.set(supplier, { supplier, total: 0, onTime: 0, late: 0, statuses: [] });
      const entry = map.get(supplier)!;
      entry.total++;
      const onTime = item.values?.['OnTime'];
      if (onTime === 'True') entry.onTime++;
      else entry.late++;
      const status = item.values?.['Status'];
      if (status && !entry.statuses.includes(status)) entry.statuses.push(status);
    }
    return Array.from(map.values());
  }, [reportData]);

  const columns: Column<ReportRowResponse>[] = [
    {
      header: 'NHÀ CUNG CẤP',
      cell: (item) => (
        <div className="font-bold text-slate-800">{item.values?.['Supplier'] || '-'}</div>
      ),
    },
    {
      header: 'SỐ PO',
      cell: (item) => <span className="font-mono text-sm">{item.values?.['PoNumber'] || '-'}</span>,
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => {
        const status = item.values?.['Status'] || '';
        const colorMap: Record<string, string> = {
          Completed: 'bg-emerald-100 text-emerald-700',
          Received: 'bg-emerald-100 text-emerald-700',
          Approved: 'bg-blue-100 text-blue-700',
          Pending: 'bg-orange-100 text-orange-700',
          Cancelled: 'bg-red-100 text-red-700',
          Closed: 'bg-slate-100 text-slate-600',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
            {status || '—'}
          </span>
        );
      },
    },
    {
      header: 'NGÀY DỰ KIẾN',
      cell: (item) => {
        const d = item.values?.['ExpectedDeliveryDate'];
        if (!d) return <span className="text-slate-400">—</span>;
        try { return <span className="font-mono text-sm">{new Date(d).toLocaleDateString('vi-VN')}</span>; } catch { return d; }
      },
    },
    {
      header: 'NGÀY THỰC TẾ',
      cell: (item) => {
        const d = item.values?.['ActualDeliveryDate'];
        if (!d) return <span className="text-slate-400">—</span>;
        try { return <span className="font-mono text-sm">{new Date(d).toLocaleDateString('vi-VN')}</span>; } catch { return d; }
      },
    },
    {
      header: 'ĐÚNG HẠN',
      cell: (item) => {
        const onTime = item.values?.['OnTime'];
        if (!item.values?.['ActualDeliveryDate']) return <span className="text-slate-400 text-sm">Chưa giao</span>;
        return onTime === 'True'
          ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm"><CheckCircle size={14} /> Đúng hạn</span>
          : <span className="flex items-center gap-1 text-red-600 font-semibold text-sm"><XCircle size={14} /> Trễ hạn</span>;
      },
    },
  ];

  // On-time rate tổng quát
  const totalOrders = reportData.length;
  const onTimeOrders = reportData.filter(i => i.values?.['OnTime'] === 'True').length;
  const onTimeRate = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShoppingCart size={22} className="text-blue-500" />
            Báo cáo Hiệu suất Nhà cung cấp
          </h1>
          <p className="text-text-secondary mt-1">
            Đánh giá chất lượng, đúng hạn và hiệu quả hợp tác với từng nhà cung cấp
          </p>
        </div>
        {totalOrders > 0 && (
          <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${onTimeRate >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
            Đúng hạn: {onTimeRate}% ({onTimeOrders}/{totalOrders} đơn)
          </div>
        )}
      </div>

      {/* Summary by supplier */}
      {groupedData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {groupedData.slice(0, 4).map(g => {
            const rate = g.total > 0 ? Math.round((g.onTime / g.total) * 100) : 0;
            return (
              <div key={g.supplier} className="bg-white border border-border rounded-xl p-4">
                <div className="text-xs font-medium text-slate-500 mb-1 truncate">{g.supplier}</div>
                <div className="text-lg font-black text-slate-900">{rate}%</div>
                <div className="text-xs text-slate-400">{g.onTime}/{g.total} đúng hạn</div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          <label className="block text-xs font-medium text-slate-600 mb-1">Nhà cung cấp</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.supplierId ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, supplierId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả NCC --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
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
        data={reportData}
        pageIndex={pageIndex}
        pageSize={20}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SupplierPerformancePage;
