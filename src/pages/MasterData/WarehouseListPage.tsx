import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Eye, Lock, Unlock } from 'lucide-react';
import type { Warehouse } from '@/types/masterData';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const WarehouseListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['warehouses', pageIndex, searchTerm],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const warehouses = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: (warehouse: Warehouse) => {
      if (warehouse.isActive) {
        return masterDataApi.lockWarehouse(warehouse.id);
      }
      return masterDataApi.unlockWarehouse(warehouse.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const columns = [
    { header: 'Mã Kho', accessorKey: 'code' as keyof Warehouse, className: 'font-mono text-primary font-medium' },
    { header: 'Tên Kho', accessorKey: 'name' as keyof Warehouse, className: 'font-medium text-text-primary' },
    { header: 'Quản lý', accessorKey: 'managerName' as keyof Warehouse },
    { header: 'Thành phố', accessorKey: 'city' as keyof Warehouse },
    { header: 'Số Vị trí', accessorKey: 'locationCount' as keyof Warehouse, className: 'text-right' },
    { header: 'Tồn kho', accessorKey: 'totalStockQuantity' as keyof Warehouse, className: 'text-right font-medium' },
    { header: 'Trạng thái', cell: (item: Warehouse) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} /> },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Warehouse) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => navigate(`/master-data/warehouses/${item.id}`)}
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          
          <button 
            onClick={() => navigate(`/master-data/warehouses/${item.id}/edit`)}
            className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors" title="Sửa"
          >
            <Edit size={18} />
          </button>

          <button 
            onClick={() => toggleStatusMutation.mutate(item)}
            className={`p-1.5 rounded transition-colors ${item.isActive ? 'text-text-secondary hover:bg-slate-100' : 'text-success hover:bg-success/10'}`} 
            title={item.isActive ? "Khóa kho" : "Mở khóa kho"}
          >
            {item.isActive ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Danh sách Kho</h1>
        </div>
        <button 
          onClick={() => navigate('/master-data/warehouses/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Kho
        </button>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={warehouses}
        pageIndex={pageIndex}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default WarehouseListPage;
