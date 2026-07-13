import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { ClipboardCheck } from 'lucide-react';
import type { ReportRowResponse } from '@/types/operations';
import { format } from 'date-fns';

const formatQty = (val: string | undefined) => {
  const n = Number(val);
  return !isNaN(n) && val !== undefined ? new Intl.NumberFormat('vi-VN').format(n) : (val || '-');
};

const CycleCountVarianceReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    productId?: number;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_cc_variance', pageIndex, filters],
    queryFn: () =>
      reportsApi.getCycleCountVariance({
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const { data: productsData } = useQuery({
    queryKey: ['products', 'select'],
    queryFn: () => masterDataApi.getProducts({ pageSize: 200 }),
  });
  const products = productsData?.items || [];

  const reportData = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const columns: Column<ReportRowResponse>[] = [
    {
      header: 'SỐ PHIẾU KIỂM KÊ',
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900 text-sm">
          {item.values?.['CountNumber'] || '-'}
        </span>
      ),
    },
    {
      header: 'VỊ TRÍ',
      cell: (item) => <span className="font-mono text-sm text-slate-500">{item.values?.['Location'] || '-'}</span>,
    },
    {
      header: 'MÃ SP',
      cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.values?.['ProductSku'] || '-'}</span>,
    },
    {
      header: 'TỒN HỆ THỐNG',
      cell: (item) => <span className="font-mono text-slate-700">{formatQty(item.values?.['QtySystem'])}</span>,
      className: 'text-right',
    },
    {
      header: 'THỰC ĐẾM',
      cell: (item) => <span className="font-mono font-bold text-slate-900">{formatQty(item.values?.['QtyCounted'])}</span>,
      className: 'text-right',
    },
    {
      header: 'CHÊNH LỆCH',
      cell: (item) => {
        const variance = Number(item.values?.['Variance'] || 0);
        return (
          <span className={`font-bold font-mono ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {variance > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(variance)}
          </span>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardCheck size={22} className="text-primary" />
            Báo cáo Chênh lệch Kiểm kê
          </h1>
          <p className="text-text-secondary mt-1">
            So sánh tồn kho hệ thống và thực đếm – xác định và điều chỉnh sai lệch
          </p>
        </div>
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Sản phẩm</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.productId ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, productId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả sản phẩm --</option>
            {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
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

export default CycleCountVarianceReportPage;
