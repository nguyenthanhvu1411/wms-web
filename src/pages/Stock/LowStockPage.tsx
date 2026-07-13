import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';

const LowStockPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['lowStock', { page, pageSize }],
    queryFn: () => stockApi.getOnHand({ page, pageSize, lowStockOnly: true }),
  });

  const columns = [
    { header: 'Mã SKU', cell: (row: any) => row.productCode },
    { header: 'Tên Sản Phẩm', cell: (row: any) => row.productName },
    { header: 'Kho', cell: (row: any) => row.warehouseCode },
    { header: 'Vị Trí', cell: (row: any) => row.locationCode },
    { 
      header: 'Tồn Thực Tế', 
      cell: (row: any) => (
        <span className="font-semibold text-error">
          {row.qtyOnHand} {row.uomName}
        </span>
      ) 
    },
    { header: 'Mức Tồn Tối Thiểu', cell: (row: any) => <span className="text-text-secondary">{row.minStockLevel || 0} {row.uomName}</span> },
    { header: 'Khả Dụng', cell: (row: any) => `${row.qtyAvailable} ${row.uomName}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-background-hover rounded-full text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">Cảnh báo Tồn thấp</h1>
              <AlertTriangle className="text-warning" size={24} />
            </div>
            <p className="text-sm text-text-secondary mt-1">Danh sách sản phẩm có tồn kho thực tế bằng hoặc thấp hơn mức cảnh báo.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.items || []}
          isLoading={isLoading}
          pageIndex={data?.page || 1}
          pageSize={data?.pageSize || 10}
          totalCount={data?.totalItems || 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default LowStockPage;
