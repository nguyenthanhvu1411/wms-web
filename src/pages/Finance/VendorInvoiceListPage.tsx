import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import type { VendorInvoice } from '@/types/operations';
import { VendorInvoiceStatus, vendorInvoiceStatusLabel } from '@/types/wms-enums';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const formatVND = (val: number | undefined) =>
  typeof val === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '-';

const getStatusKey = (status: number): string => {
  const found = Object.entries(VendorInvoiceStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const VendorInvoiceListPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    keyword?: string;
    status?: number;
    supplierId?: number;
    fromDate?: string;
    toDate?: string;
  }>({});
  const navigate = useNavigate();

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['vendorInvoices', pageIndex, filters],
    queryFn: () =>
      inboundApi.getVendorInvoices({
        page: pageIndex,
        pageSize: 15,
        search: filters.keyword,
        status: filters.status,
        supplierId: filters.supplierId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 200 }),
  });
  const suppliers = suppliersData?.items || [];

  const vendorInvoices = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const handleCreate = () => navigate('/finance/invoices/create');
  const handleView = (id: number) => navigate(`/finance/invoices/${id}`);

  const columns: Column<VendorInvoice>[] = [
    {
      header: 'SỐ HÓA ĐƠN',
      cell: (item) => (
        <div>
          <div className="font-mono font-semibold text-primary text-sm">{item.invoiceNumber}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">{item.poNumber ? `PO: ${item.poNumber}` : ''}</div>
        </div>
      ),
    },
    {
      header: 'NHÀ CUNG CẤP',
      cell: (item) => <span className="font-medium text-slate-800">{item.supplierName || '-'}</span>,
    },
    {
      header: 'NGÀY HÓA ĐƠN',
      cell: (item) =>
        item.invoiceDate ? format(new Date(item.invoiceDate), 'dd/MM/yyyy') : '-',
    },
    {
      header: 'NGÀY ĐẾN HẠN',
      cell: (item) =>
        item.dueDate ? format(new Date(item.dueDate), 'dd/MM/yyyy') : '—',
    },
    {
      header: 'TỔNG TIỀN',
      cell: (item) => <span className="font-bold font-mono text-slate-900">{formatVND(item.totalAmount)}</span>,
      className: 'text-right',
    },
    {
      header: 'THUẾ',
      cell: (item) => <span className="font-mono text-slate-600">{formatVND(item.taxAmount)}</span>,
      className: 'text-right',
    },
    {
      header: 'TIỀN TỆ',
      cell: (item) => <span className="text-slate-600 text-sm">{(item as any).currency || 'VND'}</span>,
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <StatusBadge
          status={getStatusKey(item.status)}
          text={vendorInvoiceStatusLabel[item.status] || 'Không rõ'}
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
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors"
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
          <h1 className="text-2xl font-bold text-text-primary">Hóa đơn nhà cung cấp</h1>
          <p className="text-text-secondary mt-1">Quản lý hóa đơn nhập hàng từ nhà cung cấp</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> TẠO HÓA ĐƠN
        </button>
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({}); setPageIndex(1); }}
      >
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
          <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.status ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.entries(vendorInvoiceStatusLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.fromDate || ''}
            onChange={(e) => { setFilters(f => ({ ...f, fromDate: e.target.value || undefined })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        data={vendorInvoices}
        pageIndex={pageIndex}
        pageSize={15}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default VendorInvoiceListPage;
