import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/financeApi';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable, type Column } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Clock } from 'lucide-react';
import type { ApAgingReportRowResponse } from '@/types/operations';
import { format } from 'date-fns';

const formatVND = (val: number | undefined) =>
  typeof val === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '-';

const ApAgingReportPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<{
    asOfDate: string;
    supplierId?: number;
    keyword?: string;
  }>({ asOfDate: new Date().toISOString().substring(0, 10) });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['finance', 'ap-aging', pageIndex, filters],
    queryFn: () =>
      financeApi.getApAgingReport({
        asOfDate: filters.asOfDate,
        supplierId: filters.supplierId,
        page: pageIndex,
        pageSize: 20,
      }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 200 }),
  });
  const suppliers = suppliersData?.items || [];

  const items = data?.items || [];
  const totalItems = data?.totalItems || 0;

  const columns: Column<ApAgingReportRowResponse>[] = [
    {
      header: 'NHÀ CUNG CẤP',
      cell: (row) => (
        <div>
          <div className="font-bold text-slate-800">{row.supplierName || '-'}</div>
          <div className="text-xs text-slate-500 font-mono">{row.supplierCode || ''}</div>
        </div>
      ),
    },
    {
      header: 'SỐ HÓA ĐƠN',
      cell: (row) => <span className="font-mono text-primary text-sm">{row.invoiceNumber || '-'}</span>,
    },
    {
      header: 'NGÀY ĐẾN HẠN',
      cell: (row) =>
        row.dueDate ? format(new Date(row.dueDate), 'dd/MM/yyyy') : '-',
    },
    {
      header: 'QUÁ HẠN (NGÀY)',
      cell: (row) => (
        <span className={`font-bold font-mono ${row.daysOverdue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {row.daysOverdue > 0 ? `+${row.daysOverdue}` : row.daysOverdue}
        </span>
      ),
      className: 'text-center',
    },
    {
      header: 'CHƯA TỚI HẠN',
      cell: (row) => <span className="font-mono text-slate-700">{formatVND(row.amountCurrent)}</span>,
      className: 'text-right',
    },
    {
      header: '1–30 NGÀY',
      cell: (row) => (
        <span className="font-mono text-orange-600">{formatVND(row.amount1To30)}</span>
      ),
      className: 'text-right',
    },
    {
      header: '31–60 NGÀY',
      cell: (row) => (
        <span className="font-mono text-orange-700">{formatVND(row.amount31To60)}</span>
      ),
      className: 'text-right',
    },
    {
      header: '61–90 NGÀY',
      cell: (row) => (
        <span className="font-mono text-red-600 font-bold">{formatVND(row.amount61To90)}</span>
      ),
      className: 'text-right',
    },
    {
      header: 'TRÊN 90 NGÀY',
      cell: (row) => (
        <span className="font-mono text-red-700 font-black">{formatVND(row.amountOver90)}</span>
      ),
      className: 'text-right',
    },
    {
      header: 'TỔNG CỘNG',
      cell: (row) => (
        <span className="font-mono font-black text-slate-900">{formatVND(row.totalAmount)}</span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock size={24} /> Báo cáo công nợ theo tuổi (AP Aging)
          </h1>
          <p className="text-text-secondary mt-1">Phân tích công nợ phải trả theo kỳ hạn thanh toán</p>
        </div>
      </div>

      <AdvancedFilter
        onSearch={(keyword) => { setFilters(f => ({ ...f, keyword })); setPageIndex(1); }}
        onClear={() => { setFilters({ asOfDate: new Date().toISOString().substring(0, 10) }); setPageIndex(1); }}
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tính đến ngày</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.asOfDate}
            onChange={(e) => { setFilters(f => ({ ...f, asOfDate: e.target.value })); setPageIndex(1); }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nhà cung cấp</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.supplierId || ''}
            onChange={(e) => { setFilters(f => ({ ...f, supplierId: e.target.value ? Number(e.target.value) : undefined })); setPageIndex(1); }}
          >
            <option value="">-- Tất cả nhà cung cấp --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
          </select>
        </div>
      </AdvancedFilter>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Lỗi tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        pageIndex={pageIndex}
        pageSize={20}
        totalCount={totalItems}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ApAgingReportPage;
