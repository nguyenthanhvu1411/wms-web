import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { qualityCheckResultLabel, QualityCheckResult } from '@/types/wms-enums';
import type { QualityCheck } from '@/types/inbound';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

const QualityCheckListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.qualityChecks, pageIndex, pageSize, searchTerm, resultFilter, warehouseFilter, fromDate, toDate],
    queryFn: () => inboundApi.getQualityChecks({ 
      page: pageIndex, 
      pageSize, 
      search: searchTerm,
      result: resultFilter ? Number(resultFilter) : undefined,
      warehouseId: warehouseFilter ? Number(warehouseFilter) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
  });

  const columns = [
    {
      header: 'Mã QC',
      accessorKey: 'qcNumber' as keyof QualityCheck,
      className: 'font-mono text-primary font-medium',
      cell: (item: QualityCheck) => item.qcNumber || <span className="text-text-secondary italic">Hệ thống tạo</span>
    },
    {
      header: 'Mã Phiếu Nhận (GR)',
      accessorKey: 'grNumber' as keyof QualityCheck,
    },
    {
      header: 'Người kiểm tra',
      accessorKey: 'inspectorId' as keyof QualityCheck,
      cell: (item: QualityCheck) => item.inspectorName ? `${item.inspectorName} (${item.inspectorId})` : (item.inspectorId || '-'),
    },
    {
      header: 'Ngày kiểm tra',
      cell: (item: QualityCheck) => item.inspectedAt ? format(new Date(item.inspectedAt), 'dd/MM/yyyy HH:mm') : '-',
    },
    {
      header: 'Kết quả',
      cell: (item: QualityCheck) => {
        const label = qualityCheckResultLabel[item.result as QualityCheckResult];
        return <StatusBadge status={item.result} text={label} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: QualityCheck) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/inbound/quality-checks/${item.id}`); }}
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors inline-flex"
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
          <h1 className="text-2xl font-bold text-text-primary">Quản lý Kiểm tra chất lượng (QC)</h1>
          <p className="text-text-secondary mt-1">Danh sách các phiếu kiểm tra chất lượng</p>
        </div>
      </div>

      <AdvancedFilter 
        onSearch={setSearchTerm} 
        onClear={() => {
          setSearchTerm('');
          setResultFilter('');
          setWarehouseFilter('');
          setFromDate('');
          setToDate('');
        }}
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Kết quả</label>
          <select 
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {Object.entries(qualityCheckResultLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Kho Hàng</label>
          <select 
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {warehousesData?.items?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Từ ngày</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Đến ngày</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </AdvancedFilter>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        isError={isError}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={data?.totalItems || 0}
        onPageChange={setPageIndex}
      />
    </div>
  );
};

export default QualityCheckListPage;
