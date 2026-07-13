import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import type { StockTransaction } from '@/types/stock';

const StockTransactionPage = () => {
  const [searchParams] = window.location.search ? [new URLSearchParams(window.location.search)] : [new URLSearchParams()];
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('documentRef') || searchParams.get('search') || '');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['stockTransactions', pageIndex, searchTerm],
    queryFn: () => stockApi.getTransactions({ page: pageIndex, pageSize: 10, search: searchTerm }),
  });

  const stockTransactions = queryData?.items || [];
  const totalCount = queryData?.totalItems || 0;

  const columns = [
    { 
      header: 'Loại', 
      cell: (item: StockTransaction) => {
        const typeMap: Record<number, { text: string, color: string }> = {
          1: { text: 'Nhập kho', color: 'text-success' },
          2: { text: 'Xuất kho', color: 'text-danger' },
          3: { text: 'Điều chỉnh', color: 'text-warning' },
          4: { text: 'Xuất ĐC', color: 'text-info' },
          5: { text: 'Nhập ĐC', color: 'text-info' },
          6: { text: 'Kiểm kê', color: 'text-warning' },
          7: { text: 'Trả hàng', color: 'text-primary' },
          8: { text: 'Hư hỏng', color: 'text-danger' },
          9: { text: 'Cách ly', color: 'text-warning' },
          10: { text: 'Hủy', color: 'text-danger' },
          11: { text: 'Cất hàng', color: 'text-success' },
          12: { text: 'Giữ hàng', color: 'text-warning' },
          13: { text: 'Bỏ giữ', color: 'text-info' },
          14: { text: 'Dự trữ', color: 'text-warning' },
          15: { text: 'Hủy dự trữ', color: 'text-info' }
        };
        const mapped = typeMap[item.transactionType] || { text: 'Unknown', color: 'text-text-secondary' };
        return <span className={`font-medium ${mapped.color}`}>{mapped.text}</span>;
      }
    },
    { header: 'SKU', accessorKey: 'productSku' as keyof StockTransaction, className: 'font-mono text-primary font-medium' },
    { header: 'Từ vị trí', accessorKey: 'fromLocationCode' as keyof StockTransaction },
    { header: 'Đến vị trí', accessorKey: 'toLocationCode' as keyof StockTransaction },
    { header: 'Trước', accessorKey: 'beforeQuantity' as keyof StockTransaction, className: 'text-right text-text-secondary' },
    { 
      header: 'Thay đổi', 
      cell: (item: StockTransaction) => (
        <span className={`block text-right font-bold ${item.quantity > 0 ? 'text-success' : item.quantity < 0 ? 'text-danger' : 'text-text-secondary'}`}>
          {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
        </span>
      )
    },
    { header: 'Sau', accessorKey: 'afterQuantity' as keyof StockTransaction, className: 'text-right font-medium' },
    { 
      header: 'Tham chiếu', 
      cell: (item: StockTransaction) => (
        <span className="font-mono text-xs bg-bg-secondary px-2 py-1 rounded">
          {item.referenceType ? `${item.referenceType}-${item.referenceId}` : item.referenceId}
        </span>
      )
    },
    { header: 'Lý do', accessorKey: 'notes' as keyof StockTransaction, className: 'text-sm text-text-secondary max-w-[150px] truncate' },
    { header: 'Người tạo', accessorKey: 'createdBy' as keyof StockTransaction, className: 'text-sm' },
    { header: 'Thời gian', accessorKey: 'transactionDate' as keyof StockTransaction, className: 'text-sm', cell: (item: StockTransaction) => new Date(item.transactionDate).toLocaleString('vi-VN') },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Giao dịch kho</h1></div>
      </div>
      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />
      <DataTable columns={columns} data={stockTransactions} pageIndex={pageIndex} pageSize={10} totalCount={totalCount} onPageChange={setPageIndex} isLoading={isLoading} />
    </div>
  );
};
export default StockTransactionPage;
