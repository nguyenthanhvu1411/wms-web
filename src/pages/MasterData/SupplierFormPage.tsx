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
  name: z.string().min(1, 'Vui lòng nhập tên nhà cung cấp'),
  taxCode: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  paymentTermsDays: z.number().int().min(0),
  currency: z.string().min(1, 'Vui lòng chọn tiền tệ'),
  creditLimit: z.number().min(0),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SupplierFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const { data: supplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => masterDataApi.getSupplierById(Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      currency: 'VND',
      paymentTermsDays: 0,
      creditLimit: 0,
    }
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name || '',
        taxCode: supplier.taxCode || '',
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        website: supplier.website || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        paymentTermsDays: supplier.paymentTermsDays || 0,
        currency: supplier.currency || 'VND',
        creditLimit: supplier.creditLimit || 0,
        bankName: supplier.bankName || '',
        bankAccount: supplier.bankAccount || '',
        notes: supplier.notes || '',
      });
    }
  }, [supplier, reset]);

  const mutation = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => {
      if (isEdit) {
        return masterDataApi.updateSupplier(Number(id), data);
      }
      return masterDataApi.createSupplier(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/master-data/suppliers');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  if (isEdit && isLoadingSupplier) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/master-data/suppliers')}
          className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? 'Cập nhật Nhà cung cấp' : 'Thêm mới Nhà cung cấp'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isEdit ? `Chỉnh sửa thông tin nhà cung cấp ${supplier?.code || ''}` : 'Điền thông tin bên dưới để tạo nhà cung cấp mới'}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/master-data/suppliers')}
            className="px-4 py-2 bg-white border border-border text-text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit"
            form="supplier-form"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>

      <form id="supplier-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        
        {/* Basic Info Section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AutoCodeInput label="Mã nhà cung cấp" isManual={false} value={supplier?.code} />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tên nhà cung cấp <span className="text-danger">*</span></label>
              <input 
                {...register('name')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: Công ty TNHH ABC"
              />
              {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Mã số thuế</label>
              <input 
                {...register('taxCode')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Người liên hệ</label>
              <input 
                {...register('contactPerson')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Thông tin liên lạc & Địa chỉ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input 
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Điện thoại</label>
              <input 
                {...register('phone')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Địa chỉ</label>
              <input 
                {...register('address')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Thành phố</label>
              <input 
                {...register('city')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Quốc gia</label>
              <input 
                {...register('country')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Finance Info Section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Thông tin thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Kỳ hạn thanh toán (Ngày)</label>
              <input 
                type="number"
                {...register('paymentTermsDays', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {errors.paymentTermsDays && <p className="mt-1 text-sm text-danger">{errors.paymentTermsDays.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tiền tệ <span className="text-danger">*</span></label>
              <select 
                {...register('currency')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Hạn mức tín dụng</label>
              <input 
                type="number"
                {...register('creditLimit', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {errors.creditLimit && <p className="mt-1 text-sm text-danger">{errors.creditLimit.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Tên ngân hàng</label>
              <input 
                {...register('bankName')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Số tài khoản</label>
              <input 
                {...register('bankAccount')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
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

export default SupplierFormPage;
