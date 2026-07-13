import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Hash, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';

const SerialListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['serialList', { page, pageSize, search: appliedSearch, status: statusFilter || undefined }],
    queryFn: () => stockApi.getSerials({ 
      page, 
      pageSize, 
      search: appliedSearch || undefined,
      status: statusFilter ? Number(statusFilter) : undefined 
    }),
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">Sẵn sàng (Available)</span>;
      case 2: return <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">Đã giữ (Reserved)</span>;
      case 3: return <span className="bg-info/10 text-info px-2 py-1 rounded text-xs font-medium">Đã xuất (Shipped)</span>;
      case 4: return <span className="bg-error/10 text-error px-2 py-1 rounded text-xs font-medium">Lỗi (Damaged)</span>;
      case 5: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">Đã trả (Returned)</span>;
      case 6: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">Cách ly (Quarantined)</span>;
      case 7: return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium">Đã nhận (Received)</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">Khác ({status})</span>;
    }
  };

  const columns = [
    { 
      header: 'Số Serial', 
      cell: (row: any) => (
        <span className="font-mono font-medium text-text-primary">
          {row.serial}
        </span>
      ) 
    },
    { header: 'Mã SKU', cell: (row: any) => row.productCode },
    { header: 'Tên Sản Phẩm', cell: (row: any) => row.productName },
    { header: 'Trạng Thái', cell: (row: any) => getStatusBadge(row.status) },
    { header: 'Kho', cell: (row: any) => row.warehouseCode || '-' },
    { header: 'Vị Trí', cell: (row: any) => row.locationCode || '-' },
    { header: 'Lô / Lot', cell: (row: any) => row.lotNumber || '-' },
    { header: 'Hạn Sử Dụng', cell: (row: any) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('vi-VN') : '-' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
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
              <h1 className="text-2xl font-bold text-text-primary">Quản lý Serial Number</h1>
              <Hash className="text-brand-primary" size={24} />
            </div>
            <p className="text-sm text-text-secondary mt-1">Quản lý và tra cứu trạng thái từng Serial Number.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-border rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-4 items-center flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input 
              type="text" 
              placeholder="Tìm theo Serial hoặc SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-secondary transition-colors">
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-secondary">Trạng thái:</span>
          <select 
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Sẵn sàng (Available)</option>
            <option value="2">Đã giữ (Reserved)</option>
            <option value="3">Đã xuất (Shipped)</option>
            <option value="7">Đã nhận (Received)</option>
            <option value="6">Cách ly (Quarantined)</option>
            <option value="4">Lỗi (Damaged)</option>
          </select>
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

export default SerialListPage;
