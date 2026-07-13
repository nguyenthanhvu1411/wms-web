import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Clock, AlertOctagon } from 'lucide-react';
import type { ReportRowResponse } from '@/types/operations';
import { format, differenceInDays } from 'date-fns';

const ExpiryReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    productId?: number;
    expiringBefore?: string;
    keyword?: string;
  }>({
    expiringBefore: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // next 90 days
  });

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_expiry', pageIndex, filters],
    queryFn: () =>
      reportsApi.getExpiry({
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        ...({ expiringBefore: filters.expiringBefore } as any),
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

  const getDaysColor = (daysStr: string | undefined): string => {
    const days = Number(daysStr);
    if (isNaN(days)) return '';
    if (days <= 0) return 'text-red-700 font-bold';
    if (days <= 30) return 'text-red-600 font-bold';
    if (days <= 60) return 'text-orange-600 font-semibold';
    return 'text-amber-600';
  };

  const getDaysBadge = (daysStr: string | undefined) => {
    const days = Number(daysStr);
    if (isNaN(days)) return null;
    if (days <= 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Đã hết hạn</span>;
    if (days <= 7) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">≤ 7 ngày</span>;
    if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">≤ 30 ngày</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">≤ 90 ngày</span>;
  };

  const columns: Column<ReportRowResponse>[] = [
    {
      header: 'KHO / VỊ TRÍ',
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.values?.['Warehouse'] || '-'}</div>
          <div className="text-xs text-slate-400 font-mono">{item.values?.['Location'] || ''}</div>
        </div>
      ),
    },
    { header: 'MÃ SP', cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.values?.['ProductSku'] || '-'}</span> },
    { header: 'SỐ LÔ', cell: (item) => <span className="font-mono text-sm text-slate-500">{item.values?.['LotNumber'] || '-'}</span> },
    {
      header: 'NGÀY HẾT HẠN',
      cell: (item) => {
        const dateStr = item.values?.['ExpiryDate'];
        if (!dateStr) return '-';
        try {
          return <span className="font-mono text-sm">{format(new Date(dateStr), 'dd/MM/yyyy')}</span>;
        } catch { return dateStr; }
      },
    },
    {
      header: 'CÒN LẠI',
      cell: (item) => {
        const dateStr = item.values?.['ExpiryDate'];
        let days: number | undefined;
        if (dateStr) {
          try { days = differenceInDays(new Date(dateStr), new Date()); } catch { /**/ }
        }
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${getDaysColor(days?.toString())}`}>
              {days !== undefined ? (days <= 0 ? 'Hết hạn' : `${days} ngày`) : '-'}
            </span>
            {getDaysBadge(days?.toString())}
          </div>
        );
      },
    },
    {
      header: 'TỒN KHẢ DỤNG',
      cell: (item) => (
        <span className="font-bold font-mono text-slate-800">
          {new Intl.NumberFormat('vi-VN').format(Number(item.values?.['QtyAvailable'] || 0))}
        </span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock size={22} className="text-red-500" />
            Báo cáo Hàng sắp hết hạn
          </h1>
          <p className="text-text-secondary mt-1">
            Hàng hóa sắp đến ngày hết hạn sử dụng cần được xử lý ưu tiên
          </p>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold border border-red-200">
            <AlertOctagon size={16} />
            {totalCount} mặt hàng cần chú ý
          </div>
        )}
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({ expiringBefore: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) }); setPageIndex(1); }}
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Hết hạn trước ngày</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.expiringBefore || ''}
            onChange={(e) => { setFilters(f => ({ ...f, expiringBefore: e.target.value || undefined })); setPageIndex(1); }}
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
          <Clock size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-emerald-600">Không có hàng nào sắp hết hạn</p>
          <p className="text-sm mt-1">Thử thay đổi ngày lọc hoặc kho hàng</p>
        </div>
      )}

      {(isLoading || reportData.length > 0) && (
        <DataTable
          columns={columns}
          data={reportData}
          pageIndex={pageIndex}
          pageSize={20}
          totalCount={totalCount}
          onPageChange={setPageIndex}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ExpiryReportPage;
