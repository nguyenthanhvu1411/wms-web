import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stockApi } from '@/api/stockApi';
import { DataTable } from '@/components/DataTable/DataTable';

const ExpiryAlertPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [daysAhead, setDaysAhead] = useState<number>(30);

  const expiringBefore = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString();
  }, [daysAhead]);

  const { data, isLoading } = useQuery({
    queryKey: ['expiryAlert', { page, pageSize, expiringBefore }],
    queryFn: () => stockApi.getOnHand({ page, pageSize, expiringBefore }),
  });

  const columns = [
    { header: 'Mã SKU', cell: (row: any) => row.productCode },
    { header: 'Tên Sản Phẩm', cell: (row: any) => row.productName },
    { header: 'Lô / Lot', cell: (row: any) => row.lotNumber || '-' },
    { 
      header: 'Hạn Sử Dụng', 
      cell: (row: any) => {
        if (!row.expiryDate) return '-';
        const expiry = new Date(row.expiryDate);
        const today = new Date();
        const isExpired = expiry < today;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isExpired ? 'text-error' : 'text-warning'}`}>
              {expiry.toLocaleDateString('vi-VN')}
            </span>
            {isExpired && <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Đã hết hạn</span>}
          </div>
        );
      } 
    },
    { header: 'Kho', cell: (row: any) => row.warehouseCode },
    { header: 'Vị Trí', cell: (row: any) => row.locationCode },
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
              <h1 className="text-2xl font-bold text-text-primary">Cảnh báo Hết hạn</h1>
              <Clock className="text-warning" size={24} />
            </div>
            <p className="text-sm text-text-secondary mt-1">Quản lý các mặt hàng sắp hết hạn hoặc đã hết hạn.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-border rounded-xl shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar size={18} />
          <label htmlFor="days-ahead-select" className="font-medium text-sm">Hiển thị sản phẩm hết hạn trong vòng:</label>
        </div>
        <select 
          id="days-ahead-select"
          className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
          value={daysAhead}
          onChange={(e) => {
            setDaysAhead(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={7}>7 ngày tới</option>
          <option value={15}>15 ngày tới</option>
          <option value={30}>30 ngày tới</option>
          <option value={60}>60 ngày tới</option>
          <option value={90}>90 ngày tới</option>
          <option value={180}>6 tháng tới</option>
        </select>
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

export default ExpiryAlertPage;
