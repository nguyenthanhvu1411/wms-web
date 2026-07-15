import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { AutoCodeInput } from '@/components/AutoCodeInput/AutoCodeInput';

const schema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã kho'),
  name: z.string().min(1, 'Vui lòng nhập tên kho'),
  type: z.number().int(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  managerId: z.number().nullable().optional(),
  totalAreaM2: z.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const WarehouseFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => masterDataApi.getWarehouseById(Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      type: 1, // 1: Main, 2: Branch, 3: Virtual
      totalAreaM2: 0,
      managerId: null,
    }
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        code: warehouse.code || '',
        name: warehouse.name || '',
        type: Number(warehouse.type) || 1,
        address: warehouse.address || '',
        city: warehouse.city || '',
        province: warehouse.province || '',
        country: warehouse.country || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        managerId: warehouse.managerId || null,
        totalAreaM2: warehouse.totalAreaM2 || 0,
        notes: warehouse.notes || '',
      });
    }
  }, [warehouse, reset]);

  const mutation = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        managerId: data.managerId || undefined
      };
      if (isEdit) {
        return masterDataApi.updateWarehouse(Number(id), payload);
      }
      return masterDataApi.createWarehouse(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      navigate('/master-data/warehouses');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  if (isEdit && isLoadingWarehouse) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/master-data/warehouses')}
          className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? 'Cập nhật Kho bãi' : 'Thêm mới Kho bãi'}
          </h1>
        </div>
        <div className="ml-auto flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master-data/warehouses')}
            className="px-4 py-2 bg-white border border-border text-text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit"
            form="warehouse-form"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>

      <form id="warehouse-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Thông tin chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AutoCodeInput label="Mã kho" {...register('code')} error={errors.code?.message} />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tên kho <span className="text-danger">*</span></label>
              <input 
                {...register('name')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: Kho Tổng Miền Nam"
              />
              {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Loại kho</label>
              <select 
                {...register('type', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value={1}>Kho tiêu chuẩn (Standard)</option>
                <option value={2}>Kho lạnh (ColdStorage)</option>
                <option value={3}>Kho ngoại quan (Bonded)</option>
                <option value={4}>Kho phân phối (Distribution)</option>
                <option value={5}>Kho ảo (Virtual)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tổng diện tích (m2)</label>
              <input 
                type="number"
                step="0.01"
                {...register('totalAreaM2', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Địa chỉ & Liên hệ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Địa chỉ</label>
              <input 
                {...register('address')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Phường / Xã</label>
              <input 
                {...register('province')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tỉnh / Thành phố</label>
              <input 
                {...register('city')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Điện thoại</label>
              <input 
                {...register('phone')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input 
                {...register('email')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ghi chú</label>
              <textarea 
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default WarehouseFormPage;
