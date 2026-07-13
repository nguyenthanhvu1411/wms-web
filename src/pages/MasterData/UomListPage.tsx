import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import type { Uom } from '@/types/masterData';
import { UomFormModal } from './components/UomFormModal';
import toast from 'react-hot-toast';

const UomListPage = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBaseFilter, setIsBaseFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<Uom | undefined>();

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['uoms', pageIndex, searchTerm, isBaseFilter],
    queryFn: () => masterDataApi.getUoms({ 
      pageIndex, 
      pageSize: 10, 
      search: searchTerm,
      isBase: isBaseFilter === 'true' ? true : (isBaseFilter === 'false' ? false : undefined)
    }),
  });

  const uoms = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: (uom: Uom) => {
      if (uom.isActive) {
        return masterDataApi.deactivateUom(uom.id);
      }
      return masterDataApi.activateUom(uom.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteUom(id),
    onSuccess: () => {
      toast.success('Xóa đơn vị tính thành công!');
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Không thể xóa ĐVT đang sử dụng')
  });

  const handleEdit = (uom: Uom) => {
    setEditingUom(uom);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUom(undefined);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Mã ĐVT', accessorKey: 'code' as keyof Uom, className: 'font-mono text-primary font-medium' },
    { header: 'Tên ĐVT', accessorKey: 'name' as keyof Uom, className: 'font-medium text-text-primary' },
    { header: 'Ký hiệu', accessorKey: 'symbol' as keyof Uom },
    { header: 'ĐVT Cơ bản', cell: (item: Uom) => item.isBase ? <span className="text-success font-medium">Có</span> : <span className="text-muted">Không</span> },
    { header: 'Hệ số quy đổi', accessorKey: 'conversionFactor' as keyof Uom, className: 'text-right' },
    { header: 'Quy đổi theo', accessorKey: 'baseUomName' as keyof Uom, className: 'font-mono' },
    { header: 'Trạng thái', cell: (item: Uom) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} /> },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Uom) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleEdit(item)}
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

          <button 
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa ĐVT này?')) {
                deleteMutation.mutate(item.id);
              }
            }}
            className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors" title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Đơn vị tính</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Thêm ĐVT
        </button>
      </div>

      <AdvancedFilter 
        onSearch={setSearchTerm} 
        onClear={() => {
          setSearchTerm('');
          setIsBaseFilter('');
        }}
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Loại ĐVT</label>
          <select 
            value={isBaseFilter}
            onChange={(e) => setIsBaseFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            <option value="true">ĐVT Cơ bản</option>
            <option value="false">ĐVT Quy đổi</option>
          </select>
        </div>
      </AdvancedFilter>

      <DataTable
        columns={columns}
        data={uoms}
        pageIndex={pageIndex}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />

      <UomFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        uom={editingUom}
        uoms={uoms}
      />
    </div>
  );
};

export default UomListPage;
