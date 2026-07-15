import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import toast from 'react-hot-toast';
import { AutoCodeInput } from '@/components/AutoCodeInput/AutoCodeInput';
import type { Uom } from '@/types/masterData';

const schema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã ĐVT'),
  name: z.string().min(1, 'Vui lòng nhập tên ĐVT'),
  symbol: z.string().min(1, 'Vui lòng nhập ký hiệu'),
  isBase: z.boolean(),
  baseUomId: z.number().nullable().optional(),
  conversionFactor: z.number().min(0, 'Hệ số quy đổi phải >= 0'),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isBase && !data.baseUomId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn ĐVT Cơ bản',
      path: ['baseUomId'],
    });
  }
  if (!data.isBase && data.conversionFactor <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Hệ số quy đổi phải lớn hơn 0',
      path: ['conversionFactor'],
    });
  }
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  uom?: Uom;
  uoms?: Uom[];
}

export const UomFormModal: React.FC<Props> = ({ isOpen, onClose, uom, uoms }) => {
  const queryClient = useQueryClient();
  const isEdit = !!uom;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      symbol: '',
      isBase: true,
      baseUomId: null,
      conversionFactor: 1,
      notes: '',
    }
  });

  const isBase = useWatch({ control, name: 'isBase' });

  useEffect(() => {
    if (isOpen) {
      if (isEdit && uom) {
        reset({
          code: uom.code || '',
          name: uom.name || '',
          symbol: uom.symbol || '',
          isBase: uom.isBase,
          baseUomId: uom.baseUomId || null,
          conversionFactor: uom.conversionFactor || 1,
          notes: uom.notes || '',
        });
      } else {
        reset({
          code: '',
          name: '',
          symbol: '',
          isBase: true,
          baseUomId: null,
          conversionFactor: 1,
          notes: '',
        });
      }
    }
  }, [isOpen, isEdit, uom, reset]);

  // Adjust conversion factor when isBase changes
  useEffect(() => {
    if (isBase) {
      reset(formValues => ({
        ...formValues,
        baseUomId: null,
        conversionFactor: 1,
      }));
    }
  }, [isBase, reset]);

  const mutation = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        baseUomId: data.isBase ? undefined : (data.baseUomId || undefined)
      };
      if (isEdit) {
        return masterDataApi.updateUom(uom.id, payload);
      }
      return masterDataApi.createUom(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
            {isEdit ? 'Cập nhật Đơn vị tính' : 'Thêm mới Đơn vị tính'}
          </h2>
          <button onClick={onClose} className="p-1 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <form id="uom-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            
            <AutoCodeInput label="Mã ĐVT" {...register('code')} error={errors.code?.message} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tên ĐVT <span className="text-danger">*</span></label>
                <input 
                  {...register('name')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="VD: Cái, Hộp, Kg..."
                />
                {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Ký hiệu <span className="text-danger">*</span></label>
                <input 
                  {...register('symbol')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="VD: PCS, BOX, KG..."
                />
                {errors.symbol && <p className="mt-1 text-sm text-danger">{errors.symbol.message}</p>}
              </div>
            </div>

            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isBase"
                {...register('isBase')}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
              />
              <label htmlFor="isBase" className="ml-2 text-sm font-medium text-text-primary cursor-pointer select-none">
                Là Đơn vị tính Cơ bản
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">ĐVT Cơ bản tham chiếu</label>
                <select 
                  {...register('baseUomId', { valueAsNumber: true })}
                  disabled={isBase}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value={0}>-- Chọn ĐVT Cơ bản --</option>
                  {uoms?.filter(u => u.isBase && u.id !== uom?.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                  ))}
                </select>
                {errors.baseUomId && <p className="mt-1 text-sm text-danger">{errors.baseUomId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Hệ số quy đổi</label>
                <input 
                  type="number"
                  step="0.0001"
                  {...register('conversionFactor', { valueAsNumber: true })}
                  disabled={isBase}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-slate-100 disabled:text-slate-400"
                />
                {errors.conversionFactor && <p className="mt-1 text-sm text-danger">{errors.conversionFactor.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ghi chú</label>
              <textarea 
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                placeholder="Nhập ghi chú..."
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
            form="uom-form"
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
