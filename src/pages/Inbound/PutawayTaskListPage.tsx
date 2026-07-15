import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { putawayStatusLabel, PutawayStatus } from '@/types/wms-enums';
import type { PutawayTask } from '@/types/inbound';
import { Eye, Navigation } from 'lucide-react';

const PutawayTaskListPage = () => {
  const navigate = useNavigate();

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [searchParams] = window.location.search ? [new URLSearchParams(window.location.search)] : [new URLSearchParams()];
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.putawayTasks, pageIndex, pageSize, searchTerm, statusFilter, warehouseFilter],
    queryFn: () => inboundApi.getPutawayTasks({ 
      page: pageIndex, 
      pageSize, 
      search: searchTerm,
      status: statusFilter ? Number(statusFilter) : undefined,
      warehouseId: warehouseFilter ? Number(warehouseFilter) : undefined,
    }),
  });

  const columns = [
    {
      header: 'Mã Task',
      accessorKey: 'taskNumber' as keyof PutawayTask,
      className: 'font-mono text-primary font-medium',
      cell: (item: PutawayTask) => (
        <div>
          <span className="font-medium text-text-primary">{item.taskNumber}</span>
          <div className="text-xs text-text-secondary mt-1">Từ GR: {item.grNumber}</div>
        </div>
      )
    },
    {
      header: 'Sản phẩm',
      cell: (item: PutawayTask) => (
        <div>
          <div className="font-medium text-text-primary">{item.productName}</div>
          <div className="text-sm text-text-secondary">{item.productSku}</div>
        </div>
      ),
    },
    {
      header: 'Số lượng cất',
      cell: (item: PutawayTask) => (
        <span className="font-medium text-primary">
          {new Intl.NumberFormat('vi-VN').format(item.qtyToPutaway)}
        </span>
      ),
    },
    {
      header: 'Vị trí đích',
      cell: (item: PutawayTask) => (
        <div>
          <div className="flex items-center gap-1.5 text-text-primary font-medium">
            <Navigation size={16} className="text-success" />
            {item.destinationLocationCode}
          </div>
          <div className="text-xs text-text-secondary mt-1">Từ: {item.sourceLocationCode}</div>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (item: PutawayTask) => {
        const label = putawayStatusLabel[item.status as PutawayStatus];
        return <StatusBadge status={item.status} text={label} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: PutawayTask) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/inbound/putaway-tasks/${item.id}`); }}
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
          <h1 className="text-2xl font-bold text-text-primary">Công việc Cất hàng (Putaway)</h1>
          <p className="text-text-secondary mt-1">Danh sách các công việc cất hàng vào vị trí lưu trữ</p>
        </div>
      </div>

      <AdvancedFilter 
        onSearch={setSearchTerm} 
        onClear={() => {
          setSearchTerm('');
          setStatusFilter('');
          setWarehouseFilter('');
        }}
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Trạng thái</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {Object.entries(putawayStatusLabel).map(([key, label]) => (
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

export default PutawayTaskListPage;
