import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AdvanceShippingNotice } from '@/types/inbound';
import { asnStatusLabel } from '@/types/wms-enums';

const AdvanceShippingNoticeListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => masterDataApi.getSuppliers({ pageIndex: 1, pageSize: 100 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.asns, pageIndex, pageSize, searchTerm, statusFilter, supplierFilter, warehouseFilter],
    queryFn: () => inboundApi.getAsns({ 
      page: pageIndex, 
      pageSize, 
      search: searchTerm,
      status: statusFilter ? Number(statusFilter) : undefined,
      supplierId: supplierFilter ? Number(supplierFilter) : undefined,
      warehouseId: warehouseFilter ? Number(warehouseFilter) : undefined,
    }),
  });

  const columns = [
    {
      header: 'Số ASN',
      accessorKey: 'asnNumber' as keyof AdvanceShippingNotice,
      className: 'font-mono text-primary font-medium',
    },
    {
      header: 'Số PO',
      accessorKey: 'poNumber' as keyof AdvanceShippingNotice,
      className: 'font-mono text-text-secondary',
      cell: (item: AdvanceShippingNotice) => item.poNumber || '-',
    },
    {
      header: 'Nhà Cung Cấp',
      accessorKey: 'supplierName' as keyof AdvanceShippingNotice,
    },
    {
      header: 'Kho Nhập',
      accessorKey: 'warehouseName' as keyof AdvanceShippingNotice,
    },
    {
      header: 'Dự Kiến Đến',
      cell: (item: AdvanceShippingNotice) => (
        <span>{item.expectedArrivalDate ? new Date(item.expectedArrivalDate).toLocaleDateString('vi-VN') : '-'}</span>
      ),
    },
    {
      header: 'Trạng Thái',
      cell: (item: AdvanceShippingNotice) => {
        const label = asnStatusLabel[item.status as keyof typeof asnStatusLabel];
        return <StatusBadge status={item.status} text={label} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: AdvanceShippingNotice) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/inbound/asns/${item.id}`); }}
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
          <h1 className="text-2xl font-bold text-text-primary">Thông Báo Giao Hàng (ASN)</h1>
          <p className="text-text-secondary mt-1">Quản lý danh sách các thông báo giao hàng từ nhà cung cấp</p>
        </div>
        <button 
          onClick={() => navigate('/inbound/asns/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Tạo ASN Mới
        </button>
      </div>

      <AdvancedFilter 
        onSearch={setSearchTerm} 
        onClear={() => {
          setSearchTerm('');
          setStatusFilter('');
          setSupplierFilter('');
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
            {Object.entries(asnStatusLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Nhà Cung Cấp</label>
          <select 
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {suppliersData?.items?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
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

export default AdvanceShippingNoticeListPage;
