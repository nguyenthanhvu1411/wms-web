import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Download } from 'lucide-react';
import type { ReportRowResponse } from '@/types/operations';

const formatQty = (val: string | undefined) => {
  const n = Number(val);
  return !isNaN(n) && val !== undefined ? new Intl.NumberFormat('vi-VN').format(n) : (val || '-');
};

const InboundOutboundReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [reportType, setReportType] = useState<'inbound' | 'outbound'>('inbound');
  const [filters, setFilters] = useState<{
    warehouseId?: number;
    productId?: number;
    supplierId?: number;
    customer?: string;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['reports_inbound_outbound', reportType, pageIndex, filters],
    queryFn: () => {
      const params = {
        page: pageIndex,
        pageSize: 20,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        supplierId: reportType === 'inbound' ? filters.supplierId : undefined,
        customer: reportType === 'outbound' ? filters.customer : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };
      return reportType === 'inbound'
        ? reportsApi.getInbound(params)
        : reportsApi.getOutbound(params);
    },
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

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 200 }),
  });
  const suppliers = suppliersData?.items || [];

  const reportData = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  // Keys khớp với backend OperationsService.cs
  // Inbound: GrNumber, Warehouse, ProductSku, QtyReceived, QtyAccepted, QtyRejected, ReceivedDate
  const inboundColumns: Column<ReportRowResponse>[] = [
    {
      header: 'KHO',
      cell: (item) => <span className="font-medium text-slate-800">{item.values?.['Warehouse'] || '-'}</span>,
    },
    {
      header: 'MÃ SP',
      cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.values?.['ProductSku'] || '-'}</span>,
    },
    {
      header: 'SỐ PHIẾU GR',
      cell: (item) => <span className="font-mono text-sm">{item.values?.['GrNumber'] || '-'}</span>,
    },
    {
      header: 'SỐ LƯỢNG NHẬN',
      cell: (item) => <span className="font-bold text-emerald-700 font-mono">{formatQty(item.values?.['QtyReceived'])}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐÃ CHẤP NHẬN',
      cell: (item) => <span className="font-mono text-slate-700">{formatQty(item.values?.['QtyAccepted'])}</span>,
      className: 'text-right',
    },
    {
      header: 'BỊ TỪ CHỐI',
      cell: (item) => {
        const qty = Number(item.values?.['QtyRejected'] || 0);
        return <span className={`font-mono ${qty > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{formatQty(item.values?.['QtyRejected'])}</span>;
      },
      className: 'text-right',
    },
    {
      header: 'NGÀY NHẬN',
      cell: (item) => {
        const d = item.values?.['ReceivedDate'];
        if (!d) return '-';
        try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
      },
    },
  ];

  // Outbound: OrderNumber, WarehouseId, Customer, ProductSku, QtyOrdered, QtyPicked, QtyShipped, Status
  const outboundColumns: Column<ReportRowResponse>[] = [
    {
      header: 'KHÁCH HÀNG',
      cell: (item) => <span className="font-medium text-slate-800">{item.values?.['Customer'] || '-'}</span>,
    },
    {
      header: 'MÃ SP',
      cell: (item) => <span className="font-mono text-primary font-medium text-sm">{item.values?.['ProductSku'] || '-'}</span>,
    },
    {
      header: 'SỐ ĐƠN',
      cell: (item) => <span className="font-mono text-sm">{item.values?.['OrderNumber'] || '-'}</span>,
    },
    {
      header: 'ĐÃ ĐẶT',
      cell: (item) => <span className="font-mono text-slate-700">{formatQty(item.values?.['QtyOrdered'])}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐÃ NHẶT',
      cell: (item) => <span className="font-mono text-blue-700">{formatQty(item.values?.['QtyPicked'])}</span>,
      className: 'text-right',
    },
    {
      header: 'ĐÃ GIAO',
      cell: (item) => <span className="font-bold font-mono text-emerald-700">{formatQty(item.values?.['QtyShipped'])}</span>,
      className: 'text-right',
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => {
        const status = item.values?.['Status'] || '';
        const colorMap: Record<string, string> = {
          Completed: 'bg-emerald-100 text-emerald-700',
          Closed: 'bg-slate-100 text-slate-600',
          Allocated: 'bg-blue-100 text-blue-700',
          Pending: 'bg-orange-100 text-orange-700',
          Cancelled: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
            {status || '—'}
          </span>
        );
      },
    },
  ];

  const columns = reportType === 'inbound' ? inboundColumns : outboundColumns;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Báo cáo nhập/xuất kho</h1>
          <p className="text-text-secondary mt-1">Lịch sử giao dịch hàng hóa vào ra theo phân hệ</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === 'inbound' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { setReportType('inbound'); setPageIndex(1); }}
            >
              Nhập kho
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${reportType === 'outbound' ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              onClick={() => { setReportType('outbound'); setPageIndex(1); }}
            >
              Xuất kho
            </button>
          </div>
          <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Download size={18} /> XUẤT CSV
          </button>
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
        {reportType === 'inbound' ? (
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
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Khách hàng</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Tên khách hàng..."
              value={filters.customer || ''}
              onChange={(e) => { setFilters(f => ({ ...f, customer: e.target.value || undefined })); setPageIndex(1); }}
            />
          </div>
        )}
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

export default InboundOutboundReportPage;
