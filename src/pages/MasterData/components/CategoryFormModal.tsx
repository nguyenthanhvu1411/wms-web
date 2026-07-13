import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import toast from 'react-hot-toast';
import { AutoCodeInput } from '@/components/AutoCodeInput/AutoCodeInput';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên danh mục'),
  description: z.string().optional(),
  parentId: z.number().nullable().optional(),
  iconUrl: z.string().optional(),
  sortOrder: z.number().int().min(0, 'Thứ tự phải lớn hơn hoặc bằng 0'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  category?: any; // If edit mode
  categories?: any[]; // For parentId select
}

export const CategoryFormModal: React.FC<Props> = ({ isOpen, onClose, category, categories }) => {
  const queryClient = useQueryClient();
  const isEdit = !!category;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      parentId: null,
      iconUrl: '',
      sortOrder: 0,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEdit && category) {
        reset({
          name: category.name || '',
          description: category.description || '',
          parentId: category.parentId || null,
          iconUrl: category.iconUrl || '',
          sortOrder: category.sortOrder || 0,
        });
      } else {
        reset({
          name: '',
          description: '',
          parentId: null,
          iconUrl: '',
          sortOrder: 0,
        });
      }
    }
  }, [isOpen, isEdit, category, reset]);

  const mutation = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        parentId: data.parentId || undefined
      };
      if (isEdit) {
        return masterDataApi.updateCategory(category.id, payload);
      }
      return masterDataApi.createCategory(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // in case products use category select
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}
          </h2>
          <button onClick={onClose} className="p-1 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <form id="category-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <AutoCodeInput label="Mã danh mục" isManual={false} value={category?.code} />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tên danh mục <span className="text-danger">*</span></label>
              <input 
                {...register('name')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Nhập tên..."
              />
              {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Danh mục cha</label>
              <select 
                {...register('parentId', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value={0}>-- Không có --</option>
                {categories?.filter(c => c.id !== category?.id).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Icon URL</label>
              <input 
                {...register('iconUrl')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Thứ tự sắp xếp</label>
              <input 
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {errors.sortOrder && <p className="mt-1 text-sm text-danger">{errors.sortOrder.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Mô tả</label>
              <textarea 
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder="Nhập mô tả..."
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-border text-text-primary text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            form="category-form"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
};
