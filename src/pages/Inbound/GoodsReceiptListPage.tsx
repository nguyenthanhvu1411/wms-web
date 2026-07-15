import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Eye, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GoodsReceipt } from '@/types/inbound';
import { goodsReceiptStatusLabel } from '@/types/wms-enums';

const GoodsReceiptListPage = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.goodsReceipts, pageIndex, pageSize, searchTerm, statusFilter, warehouseFilter],
    queryFn: () => inboundApi.getGoodsReceipts({ 
      page: pageIndex, 
      pageSize, 
      search: searchTerm,
      status: statusFilter ? Number(statusFilter) : undefined,
      warehouseId: warehouseFilter ? Number(warehouseFilter) : undefined,
    }),
  });

  const columns = [
    {
      header: 'Số GR',
      accessorKey: 'grNumber' as keyof GoodsReceipt,
      className: 'font-mono text-primary font-medium',
    },
    {
      header: 'Liên Kết',
      cell: (item: GoodsReceipt) => (
        <div className="flex flex-col">
          {item.poNumber && <span className="font-mono text-xs text-text-secondary">PO: {item.poNumber}</span>}
          {item.asnNumber && <span className="font-mono text-xs text-text-secondary">ASN: {item.asnNumber}</span>}
          {!item.poNumber && !item.asnNumber && <span className="text-text-secondary">-</span>}
        </div>
      )
    },
    {
      header: 'Kho Nhận',
      accessorKey: 'warehouseName' as keyof GoodsReceipt,
    },
    {
      header: 'Ngày Nhận',
      cell: (item: GoodsReceipt) => (
        <span>{item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('vi-VN') : '-'}</span>
      ),
    },
    {
      header: 'Người Nhận',
      cell: (item: GoodsReceipt) => item.receivedBy || '-',
    },
    {
      header: 'Y/c QC',
      cell: (item: GoodsReceipt) => (
        item.requiresQc ? <span className="text-warning text-sm font-medium">Có</span> : <span className="text-text-secondary text-sm">Không</span>
      ),
    },
    {
      header: 'Trạng Thái',
      cell: (item: GoodsReceipt) => {
        const label = goodsReceiptStatusLabel[item.status as keyof typeof goodsReceiptStatusLabel];
        return <StatusBadge status={item.status} text={label} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: GoodsReceipt) => (
        <div className="flex justify-end gap-2">
          {item.status === 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/inbound/goods-receipts/${item.id}`); }}
              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
              title="Bắt đầu nhận hàng"
            >
              <PackageCheck size={18} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/inbound/goods-receipts/${item.id}`); }}
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
          <h1 className="text-2xl font-bold text-text-primary">Phiếu Nhận Hàng (Goods Receipt)</h1>
          <p className="text-text-secondary mt-1">Quản lý danh sách các phiếu nhận hàng tại kho</p>
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
            {Object.entries(goodsReceiptStatusLabel).map(([key, label]) => (
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

export default GoodsReceiptListPage;
