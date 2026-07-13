import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/financeApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CreditCard, Eye } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';
import type { PaymentRequest } from '@/types/operations';
import { PaymentRequestStatus, paymentRequestStatusLabel } from '@/types/wms-enums';
import { format } from 'date-fns';

const formatVND = (val: number | undefined) =>
  typeof val === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '-';

const getStatusKey = (status: number): string => {
  const found = Object.entries(PaymentRequestStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const PaymentRequestListPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    keyword?: string;
    status?: number;
    fromDate?: string;
    toDate?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['paymentRequests', pageIndex, filters],
    queryFn: () =>
      financeApi.getPaymentRequests({
        page: pageIndex,
        pageSize: 15,
        ...filters,
      }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 200 }),
  });
  const suppliers = suppliersData?.items || [];

  const paymentRequests = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const columns: Column<PaymentRequest>[] = [
    {
      header: 'MÃ LỆNH CHI',
      cell: (item) => (
        <div>
          <div className="font-mono font-semibold text-primary text-sm">{item.requestNumber || '-'}</div>
          <div className="text-xs text-slate-500 mt-0.5">{item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : ''}</div>
        </div>
      ),
    },
    {
      header: 'HÓA ĐƠN',
      cell: (item) => (
        <span className="font-mono text-slate-700 text-sm">#{item.vendorInvoiceId || '-'}</span>
      ),
    },
    {
      header: 'SỐ TIỀN',
      cell: (item) => (
        <span className="font-bold text-emerald-700 font-mono">{formatVND(item.amountToPay)}</span>
      ),
      className: 'text-right',
    },
    {
      header: 'PHƯƠNG THỨC',
      cell: (item) => <span className="text-slate-700 text-sm">{item.paymentMethod || '—'}</span>,
    },
    {
      header: 'NGÀY ĐẾN HẠN',
      cell: (item) =>
        item.dueDate ? format(new Date(item.dueDate), 'dd/MM/yyyy') : '—',
    },
    {
      header: 'NGƯỜI DUYỆT',
      cell: (item) => <span className="text-slate-600 text-sm">{item.approvedBy || '—'}</span>,
    },
    {
      header: 'NGÀY THANH TOÁN',
      cell: (item) =>
        item.paidAt ? format(new Date(item.paidAt), 'dd/MM/yyyy HH:mm') : '—',
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <StatusBadge
          status={getStatusKey(item.status)}
          text={paymentRequestStatusLabel[item.status] || 'Không rõ'}
        />
      ),
    },
    {
      header: 'THAO TÁC',
      className: 'text-right',
      cell: () => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Xem chi tiết">
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
          <h1 className="text-2xl font-bold text-text-primary">Lệnh chi thanh toán</h1>
          <p className="text-text-secondary mt-1">Quản lý các yêu cầu thanh toán cho nhà cung cấp</p>
        </div>
        <PermissionGuard permissions="Finance.CreatePaymentRequest">
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2">
            <CreditCard size={18} /> TẠO LỆNH CHI
          </button>
        </PermissionGuard>
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({}); setPageIndex(1); }}
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.status ?? ''}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.entries(paymentRequestStatusLabel).map(([k, v]) => (
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
        data={paymentRequests}
        pageIndex={pageIndex}
        pageSize={15}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PaymentRequestListPage;
