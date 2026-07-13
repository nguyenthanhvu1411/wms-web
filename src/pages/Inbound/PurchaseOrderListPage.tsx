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
import type { PurchaseOrder } from '@/types/inbound';
import { purchaseOrderStatusLabel } from '@/types/wms-enums';

const PurchaseOrderListPage = () => {
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
    queryKey: [...inboundKeys.purchaseOrders, pageIndex, pageSize, searchTerm, statusFilter, supplierFilter, warehouseFilter],
    queryFn: () => inboundApi.getPurchaseOrders({ 
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
      header: 'Số PO',
      accessorKey: 'poNumber' as keyof PurchaseOrder,
      className: 'font-mono text-primary font-medium',
    },
    {
      header: 'Nhà Cung Cấp',
      accessorKey: 'supplierName' as keyof PurchaseOrder,
    },
    {
      header: 'Kho Nhập',
      accessorKey: 'warehouseName' as keyof PurchaseOrder,
    },
    {
      header: 'Ngày Đặt Hàng',
      cell: (item: PurchaseOrder) => (
        <span>{new Date(item.orderDate).toLocaleDateString('vi-VN')}</span>
      ),
    },
    {
      header: 'Tổng Tiền',
      cell: (item: PurchaseOrder) => (
        <span className="font-medium text-text-primary">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      cell: (item: PurchaseOrder) => {
        const label = purchaseOrderStatusLabel[item.status as keyof typeof purchaseOrderStatusLabel] || 'Unknown';

        return <StatusBadge status={label} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: PurchaseOrder) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/inbound/purchase-orders/${item.id}`); }}
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
          <h1 className="text-2xl font-bold text-text-primary">Đơn Mua Hàng (PO)</h1>
          <p className="text-text-secondary mt-1">Quản lý danh sách các đơn mua hàng chờ nhập kho</p>
        </div>
        <button 
          onClick={() => navigate('/inbound/purchase-orders/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Tạo Đơn Mua Hàng
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
            {Object.entries(purchaseOrderStatusLabel).map(([key, label]) => (
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
        totalCount={data?.totalItems || 0} // Using totalItems instead of totalCount per PagedResponse
        onPageChange={setPageIndex}
      />
    </div>
  );
};

export default PurchaseOrderListPage;
