import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Eye } from 'lucide-react';
import type { StockBalance } from '@/types/stock';

const StockBalancePage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['stockBalances', pageIndex, searchTerm],
    queryFn: () => stockApi.getOnHand({ page: pageIndex, pageSize: 10, search: searchTerm }),
  });

  const stockBalances = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const columns = [
    { header: 'SKU', accessorKey: 'productSku' as keyof StockBalance, className: 'font-mono text-primary font-medium' },
    { header: 'Sản phẩm', accessorKey: 'productName' as keyof StockBalance, className: 'font-medium text-text-primary' },
    { header: 'Kho', accessorKey: 'warehouseCode' as keyof StockBalance },
    { header: 'Vị trí', accessorKey: 'locationCode' as keyof StockBalance },
    { header: 'Lot/Serial', accessorKey: 'lotNumber' as keyof StockBalance },
    { header: 'ĐVT', accessorKey: 'uomCode' as keyof StockBalance },
    { header: 'Tồn thực tế', accessorKey: 'qtyOnHand' as keyof StockBalance, className: 'text-right font-medium' },
    { header: 'Dự trữ (Reserved)', accessorKey: 'qtyReserved' as keyof StockBalance, className: 'text-right text-warning font-medium' },
    { header: 'Đang vận chuyển', accessorKey: 'qtyInTransit' as keyof StockBalance, className: 'text-right text-info font-medium' },
    { 
      header: 'Khả dụng', 
      cell: (item: StockBalance) => (
        <span className={`text-right block font-bold ${item.isLowStock ? 'text-danger' : 'text-success'}`}>
          {item.qtyAvailable}
        </span>
      )
    },
    { header: 'Cách ly', accessorKey: 'qtyQuarantined' as keyof StockBalance, className: 'text-right text-warning font-medium' },
    { header: 'Hư hỏng', accessorKey: 'qtyDamaged' as keyof StockBalance, className: 'text-right text-danger font-medium' },
    { header: 'Đang giữ', accessorKey: 'qtyOnHold' as keyof StockBalance, className: 'text-right text-info font-medium' },
    { 
      header: 'Giá TB', 
      cell: (item: StockBalance) => (
        <span className="text-right block text-text-secondary">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.averageCost)}
        </span>
      )
    },
    { 
      header: 'Tổng giá trị', 
      cell: (item: StockBalance) => (
        <span className="text-right block font-medium">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalValue)}
        </span>
      )
    },
    { 
      header: 'Còn lại (ngày)', 
      cell: (item: StockBalance) => {
        if (!item.expiryDate) return '-';
        const diff = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return <span className={`text-right block ${diff <= 30 ? 'text-danger font-bold' : ''}`}>{diff}</span>;
      }
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: () => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Xem chi tiết"><Eye size={18} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Tồn kho hiện tại</h1></div>
      </div>
      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />
      <DataTable columns={columns} data={stockBalances} pageIndex={pageIndex} pageSize={10} totalCount={totalCount} onPageChange={setPageIndex} isLoading={isLoading} />
    </div>
  );
};
export default StockBalancePage;
