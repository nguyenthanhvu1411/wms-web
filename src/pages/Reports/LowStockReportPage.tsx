import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { AlertTriangle } from 'lucide-react';
import type { ReportRowResponse } from '@/types/operations';

const formatQty = (val: string | undefined) => {
  const n = Number(val);
  return !isNaN(n) && val !== undefined ? new Intl.NumberFormat('vi-VN').format(n) : (val || '-');
};

const LowStockReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    productId?: number;
    keyword?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_low_stock', pageIndex, filters],
    queryFn: () =>
      reportsApi.getLowStock({
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
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
      header: 'KHO',
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.values?.['Warehouse'] || '-'}</div>
          <div className="text-xs text-slate-400">{item.values?.['Location'] || ''}</div>
        </div>
      ),
    },
    { header: 'MÃ SP', cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.values?.['ProductSku'] || '-'}</span> },
    {
      header: 'TỒN KHO HIỆN TẠI',
      cell: (item) => (
        <span className="font-bold text-red-600 font-mono">
          {formatQty(item.values?.['QtyOnHand'])}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'TỒN KHẢ DỤNG',
      cell: (item) => (
        <span className="font-mono text-slate-700">
          {formatQty(item.values?.['QtyAvailable'])}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'MỨC TỐI THIỂU',
      cell: (item) => (
        <span className="font-mono text-slate-600">
          {formatQty(item.values?.['MinStockLevel'])}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'TRẠNG THÁI',
      cell: () => {
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
            Cần bổ sung
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AlertTriangle size={22} className="text-orange-500" />
            Cảnh báo Low Stock
          </h1>
          <p className="text-text-secondary mt-1">
            Danh sách hàng hóa dưới mức tồn kho tối thiểu – cần bổ sung ngay
          </p>
        </div>
        {totalCount > 0 && (
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold border border-orange-200">
            {totalCount} mặt hàng cần bổ sung
          </div>
        )}
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
      </AdvancedFilter>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Lỗi tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && reportData.length === 0 && !isError && (
        <div className="text-center py-16 text-slate-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-emerald-600">Không có hàng nào dưới mức tối thiểu</p>
          <p className="text-sm mt-1">Tồn kho đang được kiểm soát tốt</p>
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

export default LowStockReportPage;
