import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import type { InventoryReportRowResponse } from '@/types/operations';

const formatVND = (val: number | undefined) =>
  typeof val === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '-';

const formatQty = (val: number | undefined) =>
  typeof val === 'number' ? new Intl.NumberFormat('vi-VN').format(val) : '-';

const InventoryReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    productId?: number;
    lotNumber?: string;
    keyword?: string;
    expiryFrom?: string;
    expiringBefore?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_inventory', pageIndex, filters],
    queryFn: () =>
      reportsApi.getInventory({
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        lotNumber: filters.lotNumber,
        expiryFrom: filters.expiryFrom,
        expiringBefore: filters.expiringBefore,
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

  const handleExport = async () => {
    try {
      const result = await reportsApi.exportInventoryCsv({
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        lotNumber: filters.lotNumber,
      });
      if (result?.base64Content) {
        const link = document.createElement('a');
        link.href = `data:${result.contentType};base64,${result.base64Content}`;
        link.download = result.fileName || 'inventory-report.csv';
        link.click();
      }
    } catch (e) {
      console.error('Export lỗi:', e);
    }
  };

  const columns: Column<InventoryReportRowResponse>[] = [
    {
      header: 'KHO',
      cell: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.warehouseCode}</div>
        </div>
      ),
    },
    { header: 'VỊ TRÍ', accessorKey: 'locationCode', className: 'text-slate-500 font-mono text-sm' },
    { header: 'MÃ SP', accessorKey: 'productSku', className: 'font-mono text-primary font-medium text-sm' },
    { header: 'TÊN SẢN PHẨM', accessorKey: 'productName' },
    { header: 'LÔ HÀNG', accessorKey: 'lotNumber', className: 'font-mono text-slate-500 text-sm' },
    {
      header: 'HẠN SD',
      cell: (item) => item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy') : '—',
    },
    {
      header: 'TỒN KHO',
      cell: (item) => <span className="font-bold text-slate-900">{formatQty(item.qtyOnHand)}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐÃ ĐẶT',
      cell: (item) => <span className="text-slate-600">{formatQty(item.qtyReserved)}</span>,
      className: 'text-right',
    },
    {
      header: 'CÓ SẴN',
      cell: (item) => <span className="font-bold text-emerald-600">{formatQty(item.qtyAvailable)}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐANG GIỮ',
      cell: (item) => <span className="text-orange-600">{formatQty(item.qtyOnHold)}</span>,
      className: 'text-right',
    },
    {
      header: 'KIỂM DỊCH',
      cell: (item) => <span className="text-orange-500">{formatQty(item.qtyQuarantined)}</span>,
      className: 'text-right',
    },
    {
      header: 'HÀNG LỖI',
      cell: (item) => <span className="text-red-600">{formatQty(item.qtyDamaged)}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐANG CHUYỂN',
      cell: (item) => <span className="text-blue-600">{formatQty(item.qtyInTransit)}</span>,
      className: 'text-right',
    },
    {
      header: 'GIÁ TB',
      cell: (item) => <span className="font-mono text-slate-700 text-xs">{formatVND(item.averageCost)}</span>,
      className: 'text-right',
    },
    {
      header: 'GIÁ TRỊ TỒN',
      cell: (item) => <span className="font-mono font-bold text-slate-900 text-xs">{formatVND(item.totalValue)}</span>,
      className: 'text-right',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Báo cáo tồn kho</h1>
          <p className="text-text-secondary mt-1">Chi tiết tồn kho theo kho, vị trí, sản phẩm và lô hàng</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <Download size={18} /> XUẤT CSV
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Số lô hàng</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Nhập số lô..."
            value={filters.lotNumber || ''}
            onChange={(e) => { setFilters(f => ({ ...f, lotNumber: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">HSD trước ngày</label>
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

export default InventoryReportPage;
