import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';
import type { ThreeWayMatchResponse } from '@/types/inbound';

const matchStatusLabel: Record<number, string> = {
  1: 'Chờ xử lý',
  2: 'Đã khớp',
  3: 'Lệch',
  4: 'Đã duyệt',
};

const matchStatusKey: Record<number, string> = {
  1: 'Pending',
  2: 'Completed',
  3: 'Warning',
  4: 'Approved',
};

const MatchListPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    keyword?: string;
    status?: number;
    fromDate?: string;
    toDate?: string;
  }>({});

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['threeWayMatches', pageIndex, filters],
    queryFn: () =>
      inboundApi.getThreeWayMatches({
        pageIndex,
        pageSize: 15,
        search: filters.keyword,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
  });

  const matches = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const columns: Column<ThreeWayMatchResponse>[] = [
    {
      header: 'MÃ ĐỐI CHIẾU',
      cell: (item) => <span className="font-mono font-semibold text-primary text-sm">{item.matchNumber || '-'}</span>,
    },
    {
      header: 'MÃ PHIẾU MUA',
      cell: (item) => <span className="font-mono text-slate-700 text-sm">#{item.purchaseOrderId}</span>,
    },
    {
      header: 'MÃ PHIẾU NHẬN',
      cell: (item) => <span className="font-mono text-slate-700 text-sm">#{item.goodsReceiptId}</span>,
    },
    {
      header: 'MÃ HÓA ĐƠN',
      cell: (item) => <span className="font-mono text-slate-700 text-sm">#{item.vendorInvoiceId}</span>,
    },
    {
      header: 'NGÀY ĐỐI CHIẾU',
      cell: (item) =>
        item.matchedAt ? format(new Date(item.matchedAt), 'dd/MM/yyyy HH:mm') : '—',
    },
    {
      header: 'NGƯỜI THỰC HIỆN',
      cell: (item) => <span className="text-slate-600 text-sm">{item.matchedBy || '—'}</span>,
    },
    {
      header: 'LÝ DO LỆCH',
      cell: (item) => (
        <span className="text-slate-500 text-xs">{item.discrepancyReason || '—'}</span>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      cell: (item) => (
        <StatusBadge
          status={matchStatusKey[item.status] || 'Pending'}
          text={matchStatusLabel[item.status] || 'Không rõ'}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Đối chiếu 3 bước (3-Way Match)</h1>
          <p className="text-text-secondary mt-1">Đối chiếu Phiếu mua – Phiếu nhận hàng – Hóa đơn nhà cung cấp</p>
        </div>
        <PermissionGuard permissions="Finance.RunMatch">
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2">
            <ShieldCheck size={18} /> CHẠY ĐỐI CHIẾU
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
            <option value="">-- Tất cả --</option>
            {Object.entries(matchStatusLabel).map(([k, v]) => (
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
        data={matches}
        pageIndex={pageIndex}
        pageSize={15}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MatchListPage;
