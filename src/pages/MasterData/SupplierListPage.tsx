import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Eye, Power, PowerOff } from 'lucide-react';
import type { Supplier } from '@/types/masterData';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SupplierListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['suppliers', pageIndex, searchTerm],
    queryFn: () => masterDataApi.getSuppliers({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const suppliers = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: (supplier: Supplier) => {
      if (supplier.isActive) {
        return masterDataApi.deactivateSupplier(supplier.id);
      }
      return masterDataApi.activateSupplier(supplier.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const columns = [
    { header: 'Mã', accessorKey: 'code' as keyof Supplier, className: 'font-mono text-primary font-medium' },
    { header: 'Tên NCC', accessorKey: 'name' as keyof Supplier, className: 'font-medium text-text-primary' },
    { header: 'Email', accessorKey: 'email' as keyof Supplier },
    { header: 'Điện thoại', accessorKey: 'phone' as keyof Supplier },
    { header: 'Thành phố', accessorKey: 'city' as keyof Supplier },
    { header: 'Số SP', accessorKey: 'supplierProductCount' as keyof Supplier, className: 'text-right' },
    { header: 'Số PO', accessorKey: 'purchaseOrderCount' as keyof Supplier, className: 'text-right' },
    { 
      header: 'Trạng thái', 
      cell: (item: Supplier) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Supplier) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => navigate(`/master-data/suppliers/${item.id}`)}
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>

          <button 
            onClick={() => navigate(`/master-data/suppliers/${item.id}/edit`)}
            className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors" title="Sửa"
          >
            <Edit size={18} />
          </button>

          <button 
            onClick={() => toggleStatusMutation.mutate(item)}
            className={`p-1.5 rounded transition-colors ${item.isActive ? 'text-text-secondary hover:bg-slate-100' : 'text-success hover:bg-success/10'}`} 
            title={item.isActive ? "Ngừng kích hoạt" : "Kích hoạt"}
          >
            {item.isActive ? <PowerOff size={18} /> : <Power size={18} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nhà cung cấp</h1>
        </div>
        <button 
          onClick={() => navigate('/master-data/suppliers/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Nhà cung cấp
        </button>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={suppliers}
        pageIndex={pageIndex}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SupplierListPage;
