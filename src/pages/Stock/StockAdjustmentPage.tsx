import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { stockApi } from '@/api/stockApi';
import { MasterDataSelect } from '@/components/Form/MasterDataSelect';

const schema = z.object({
  productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  warehouseId: z.number().min(1, 'Vui lòng chọn kho'),
  locationId: z.number().min(1, 'Vui lòng chọn vị trí'),
  uomId: z.number().min(1, 'Vui lòng chọn ĐVT'),
  quantity: z.number().refine(val => val !== 0, 'Số lượng điều chỉnh phải khác 0'),
  unitCost: z.number().min(0, 'Đơn giá không hợp lệ'),
  reason: z.string().min(1, 'Vui lòng chọn lý do'),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const StockAdjustmentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 0,
      unitCost: 0,
    }
  });

  const handleProductChange = (productData: any) => {
    if (productData) {
      if (productData.costPrice !== undefined) {
        setValue('unitCost', productData.costPrice, { shouldValidate: true });
      }
      if (productData.uomId) {
        // Also auto-fill the UOM
        setValue('uomId', productData.uomId, { shouldValidate: true });
      }
    }
  };

  const quantity = watch('quantity');
  const isNegative = quantity < 0;

  const mutation = useMutation({
    mutationFn: (data: any) => stockApi.adjustStock(data),
    onSuccess: () => {
      toast.success('Điều chỉnh tồn kho thành công');
      queryClient.invalidateQueries({ queryKey: ['stockBalances'] });
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      navigate('/stock/balance');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra khi điều chỉnh tồn kho');
    }
  });

  const onSubmit = (data: FormValues) => {
    // Sanitize optional string fields to null to avoid 400 Bad Request on backend
    const payload = {
      ...data,
      lotNumber: data.lotNumber || null,
      expiryDate: data.expiryDate || null,
      notes: data.notes || null,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-background-hover rounded-full text-text-secondary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Điều chỉnh tồn kho</h1>
              <p className="text-sm text-text-secondary mt-1">Ghi nhận lượng tăng/giảm tồn kho thực tế</p>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || mutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting || mutation.isPending ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <Save size={18} />
            )}
            Lưu Phiếu Điều Chỉnh
          </button>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <MasterDataSelect 
                control={control as any} 
                name="productId" 
                label="Sản phẩm" 
                type="product" 
                onChangeData={handleProductChange}
                required 
              />
              {errors.productId && <p className="text-error text-sm mt-1">{errors.productId.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <MasterDataSelect control={control as any} name="warehouseId" label="Kho" type="warehouse" required />
                {errors.warehouseId && <p className="text-error text-sm mt-1">{errors.warehouseId.message}</p>}
              </div>
              <div>
                <MasterDataSelect control={control as any} name="locationId" label="Vị trí" type="location" required />
                {errors.locationId && <p className="text-error text-sm mt-1">{errors.locationId.message}</p>}
              </div>
            </div>

            <div>
              <MasterDataSelect control={control as any} name="uomId" label="Đơn vị tính (ĐVT)" type="uom" required />
              {errors.uomId && <p className="text-error text-sm mt-1">{errors.uomId.message}</p>}
            </div>

            <div>
               <label className="block text-sm font-medium text-text-primary mb-1.5">Lý do điều chỉnh <span className="text-error">*</span></label>
               <select 
                 {...register('reason')}
                 className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
               >
                   <option value="">-- Chọn lý do --</option>
                   <option value="Damage">Hư hỏng</option>
                   <option value="Loss">Thất thoát / Mất mát</option>
                   <option value="Found">Tìm thấy</option>
                   <option value="Correction">Kiểm kê / Sửa sai</option>
               </select>
               {errors.reason && <p className="text-error text-sm mt-1">{errors.reason.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Số lượng (+/-) <span className="text-error">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('quantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  placeholder="+10 hoặc -5"
                />
                {errors.quantity && <p className="text-error text-sm mt-1">{errors.quantity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Đơn giá</label>
                <input 
                  type="number" 
                  {...register('unitCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                />
                {errors.unitCost && <p className="text-error text-sm mt-1">{errors.unitCost.message}</p>}
              </div>
            </div>

            {isNegative && (
              <div className="md:col-span-2 bg-warning/10 border border-warning/20 p-4 rounded-lg flex items-start gap-3">
                 <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
                 <div>
                   <h4 className="font-medium text-warning-dark">Cảnh báo trừ tồn</h4>
                   <p className="text-sm text-warning-dark/80 mt-1">Bạn đang thực hiện điều chỉnh số lượng âm (giảm tồn kho). Hệ thống sẽ trừ vào số lượng Tồn Khả Dụng (Qty Available). Việc này có thể thất bại nếu số lượng khả dụng thực tế không đủ.</p>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Số Lô (Lot)</label>
                <input 
                  type="text" 
                  {...register('lotNumber')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Hạn SD (Expiry)</label>
                <input 
                  type="date" 
                  {...register('expiryDate')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ghi chú</label>
              <textarea 
                {...register('notes')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                rows={3} 
                placeholder="Lý do chi tiết..."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StockAdjustmentPage;
