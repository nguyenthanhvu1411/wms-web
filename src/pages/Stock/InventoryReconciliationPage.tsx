import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reportsApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import type { ReconciliationResponse } from '@/types/stock';

const InventoryReconciliationPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['inventoryReconciliation', pageIndex, searchTerm],
    queryFn: () => reportsApi.getInventoryReconciliation({ page: pageIndex, pageSize: 10, lotNumber: searchTerm }), // simple search mapping
  });

  const reconciliationData = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const columns = [
    { header: 'Mã SP', accessorKey: 'productSku' as keyof ReconciliationResponse, className: 'font-mono text-primary font-medium' },
    { header: 'Tên Sản phẩm', accessorKey: 'productName' as keyof ReconciliationResponse, className: 'font-medium text-text-primary' },
    { header: 'Kho', accessorKey: 'warehouseCode' as keyof ReconciliationResponse },
    { header: 'Vị trí', accessorKey: 'locationCode' as keyof ReconciliationResponse },
    { header: 'Lot/Serial', accessorKey: 'lotNumber' as keyof ReconciliationResponse },
    { header: 'HSD', accessorKey: 'expiryDate' as keyof ReconciliationResponse, cell: (item: ReconciliationResponse) => item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '-' },
    { header: 'Nhập (Lịch sử)', accessorKey: 'inboundQty' as keyof ReconciliationResponse, className: 'text-right' },
    { header: 'Xuất (Lịch sử)', accessorKey: 'outboundQty' as keyof ReconciliationResponse, className: 'text-right' },
    { header: 'Tồn Lý Thuyết', accessorKey: 'calculatedQty' as keyof ReconciliationResponse, className: 'text-right font-medium text-info' },
    { header: 'Tồn Thực Tế', accessorKey: 'systemQty' as keyof ReconciliationResponse, className: 'text-right font-bold' },
    { header: 'Chênh Lệch', accessorKey: 'differenceQty' as keyof ReconciliationResponse, className: 'text-right font-bold', cell: (item: ReconciliationResponse) => (
      <span className={item.differenceQty !== 0 ? 'text-danger' : 'text-success'}>
        {item.differenceQty > 0 ? `+${item.differenceQty}` : item.differenceQty}
      </span>
    )},
    {
      header: 'Trạng Thái',
      cell: (item: ReconciliationResponse) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.differenceQty === 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {item.differenceQty === 0 ? 'Khớp' : 'Lệch'}
        </span>
      ),
      className: 'text-center'
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Báo cáo Đối soát Tồn kho</h1></div>
      </div>
      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />
      <DataTable columns={columns} data={reconciliationData} pageIndex={pageIndex} pageSize={10} totalCount={totalCount} onPageChange={setPageIndex} isLoading={isLoading} />
    </div>
  );
};
export default InventoryReconciliationPage;
