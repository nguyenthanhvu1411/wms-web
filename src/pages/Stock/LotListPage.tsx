import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PackageCheck, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';

const LotListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [lotSearch, setLotSearch] = useState('');
  const [appliedLot, setAppliedLot] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['lotList', { page, pageSize, lotNumber: appliedLot }],
    queryFn: () => stockApi.getOnHand({ page, pageSize, lotNumber: appliedLot }),
  });

  const columns = [
    { 
      header: 'Lô / Lot', 
      cell: (row: any) => (
        <span className="font-semibold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
          {row.lotNumber || 'N/A'}
        </span>
      ) 
    },
    { header: 'Mã SKU', cell: (row: any) => row.productCode },
    { header: 'Tên Sản Phẩm', cell: (row: any) => row.productName },
    { header: 'Hạn Sử Dụng', cell: (row: any) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('vi-VN') : '-' },
    { header: 'Kho', cell: (row: any) => row.warehouseCode },
    { header: 'Vị Trí', cell: (row: any) => row.locationCode },
    { header: 'Tồn Thực Tế', cell: (row: any) => `${row.qtyOnHand} ${row.uomName}` },
    { header: 'Khả Dụng', cell: (row: any) => `${row.qtyAvailable} ${row.uomName}` },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedLot(lotSearch || undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-background-hover rounded-full text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">Quản lý Lô (Lot)</h1>
              <PackageCheck className="text-brand-primary" size={24} />
            </div>
            <p className="text-sm text-text-secondary mt-1">Theo dõi tồn kho chi tiết theo từng số lô sản xuất.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-border rounded-xl shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input 
              type="text" 
              placeholder="Nhập số lô để tìm kiếm..." 
              value={lotSearch}
              onChange={(e) => setLotSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-secondary transition-colors">
            Tìm kiếm
          </button>
        </form>
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

export default LotListPage;
