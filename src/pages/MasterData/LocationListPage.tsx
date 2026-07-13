import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Lock, Unlock } from 'lucide-react';
import type { Location } from '@/types/masterData';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LocationListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['locations', pageIndex, searchTerm],
    queryFn: () => masterDataApi.getLocations({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const locations = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: (location: Location) => {
      if (location.status === 1) { // 1 is active, 0 is inactive/locked based on typical enums (or 1 active, 2 locked). Let's use lockLocation
        return masterDataApi.lockLocation(location.id);
      }
      return masterDataApi.unlockLocation(location.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const columns = [
    { header: 'Mã Vị Trí', accessorKey: 'code' as keyof Location, className: 'font-mono text-primary font-medium' },
    { header: 'Kho', accessorKey: 'warehouseName' as keyof Location },
    { header: 'Zone', accessorKey: 'zone' as keyof Location },
    { header: 'Aisle', accessorKey: 'aisle' as keyof Location },
    { header: 'Rack', accessorKey: 'rack' as keyof Location },
    { header: 'Bin', accessorKey: 'bin' as keyof Location },
    { header: 'Tồn kho', accessorKey: 'qtyOnHand' as keyof Location, className: 'text-right font-medium' },
    { 
      header: 'Đang sử dụng', 
      cell: (item: Location) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${item.isOccupied ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
          {item.isOccupied ? 'Có hàng' : 'Trống'}
        </span>
      )
    },
    { 
      header: 'Trạng thái', 
      cell: (item: Location) => <StatusBadge status={item.status === 1 ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Location) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => navigate(`/master-data/locations/${item.id}/edit`)}
            className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors" title="Sửa"
          >
            <Edit size={18} />
          </button>

          <button 
            onClick={() => toggleStatusMutation.mutate(item)}
            className={`p-1.5 rounded transition-colors ${item.status === 1 ? 'text-text-secondary hover:bg-slate-100' : 'text-danger hover:bg-danger/10'}`} 
            title={item.status === 1 ? "Khóa vị trí" : "Mở khóa vị trí"}
          >
            {item.status === 1 ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Vị trí (Locations)</h1>
        </div>
        <button 
          onClick={() => navigate('/master-data/locations/create')}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Vị trí
        </button>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={locations}
        pageIndex={pageIndex}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />
    </div>
  );
};

export default LocationListPage;
