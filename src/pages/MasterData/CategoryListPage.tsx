import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import type { Category } from '@/types/masterData';
import { CategoryFormModal } from './components/CategoryFormModal';
import toast from 'react-hot-toast';

const CategoryListPage = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['categories', pageIndex, searchTerm],
    queryFn: () => masterDataApi.getCategories({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const categories = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const toggleStatusMutation = useMutation({
    mutationFn: (category: Category) => {
      if (category.isActive) {
        return masterDataApi.deactivateCategory(category.id);
      }
      return masterDataApi.activateCategory(category.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterDataApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Xóa danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Không thể xóa danh mục đang sử dụng')
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'Mã danh mục', accessorKey: 'code' as keyof Category, className: 'font-mono text-primary font-medium' },
    { header: 'Tên danh mục', accessorKey: 'name' as keyof Category, className: 'font-medium text-text-primary' },
    { header: 'Danh mục cha', accessorKey: 'parentName' as keyof Category },
    { header: 'Cấp', accessorKey: 'level' as keyof Category },
    { header: 'Số sản phẩm', accessorKey: 'productCount' as keyof Category, className: 'text-right' },
    { 
      header: 'Trạng thái', 
      cell: (item: Category) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Category) => (
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
              if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
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
          <h1 className="text-2xl font-bold text-text-primary">Danh mục Sản phẩm</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Danh mục
        </button>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={categories}
        pageIndex={pageIndex}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        isLoading={isLoading}
      />

      <CategoryFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        categories={categories}
      />
    </div>
  );
};

export default CategoryListPage;
