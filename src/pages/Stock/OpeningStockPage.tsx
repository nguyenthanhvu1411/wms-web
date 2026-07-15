import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { stockApi } from '@/api/stockApi';
import { MasterDataSelect } from '@/components/Form/MasterDataSelect';
import { ExcelUploadModal } from '@/components/ExcelUploadModal';

const schema = z.object({
  productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
  warehouseId: z.number().min(1, 'Vui lòng chọn kho'),
  locationId: z.number().min(1, 'Vui lòng chọn vị trí'),
  uomId: z.number().min(1, 'Vui lòng chọn ĐVT'),
  quantity: z.number().min(0.01, 'Số lượng phải lớn hơn 0'),
  unitCost: z.number().min(0, 'Đơn giá không hợp lệ'),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  serialNumbers: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const OpeningStockPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [trackLot, setTrackLot] = useState(false);
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackSerial, setTrackSerial] = useState(false);

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
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
      setTrackLot(!!productData.trackLot);
      setTrackExpiry(!!productData.trackExpiry);
      setTrackSerial(!!productData.serialTrackingEnabled || !!productData.trackSerialNumber);
    } else {
      setTrackLot(false);
      setTrackExpiry(false);
      setTrackSerial(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: any) => stockApi.createOpeningStock(data),
    onSuccess: () => {
      toast.success('Nhập tồn đầu kỳ thành công');
      queryClient.invalidateQueries({ queryKey: ['stockBalances'] });
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] });
      navigate('/stock/balance');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra khi nhập tồn');
    }
  });

  const onSubmit = (data: FormValues) => {
    // Sanitize optional string fields to null to avoid 400 Bad Request on backend
    const payload = {
      ...data,
      lotNumber: data.lotNumber || null,
      expiryDate: data.expiryDate || null,
      serialNumbers: data.serialNumbers ? data.serialNumbers.split(',').map(s => s.trim()).filter(s => s) : [],
      notes: data.notes || null,
    };
    mutation.mutate(payload);
  };

  const handleExcelUpload = (file: File) => {
    // TODO: Connect to bulk import API
    toast.success(`Đã nhận file: ${file.name}. API import hàng loạt sẽ được gọi ở đây.`);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <ExcelUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleExcelUpload} 
        title="Import Tồn Đầu Kỳ"
      />
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-background-hover rounded-full text-text-secondary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Nhập tồn đầu kỳ</h1>
              <p className="text-sm text-text-secondary mt-1">Khởi tạo số lượng tồn kho ban đầu cho hệ thống</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-background text-text-primary border border-border font-medium rounded-lg hover:bg-background-hover transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              Import Excel
            </button>
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
            Lưu Tồn Kho
          </button>
          </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Số lượng <span className="text-error">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('quantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                />
                {errors.quantity && <p className="text-error text-sm mt-1">{errors.quantity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Đơn giá <span className="text-error">*</span></label>
                <input 
                  type="number" 
                  {...register('unitCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                />
                {errors.unitCost && <p className="text-error text-sm mt-1">{errors.unitCost.message}</p>}
              </div>
            </div>

            {(trackLot || trackExpiry) && (
              <div className="grid grid-cols-2 gap-4">
                {trackLot && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Số Lô (Lot)</label>
                    <input 
                      type="text" 
                      {...register('lotNumber')}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                    />
                  </div>
                )}
                {trackExpiry && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Hạn SD (Expiry)</label>
                    <input 
                      type="date" 
                      {...register('expiryDate')}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                    />
                  </div>
                )}
              </div>
            )}

            {trackSerial && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">Số Seri (Serial Numbers)</label>
                <textarea 
                  {...register('serialNumbers')}
                  placeholder="Nhập các số seri cách nhau bằng dấu phẩy (,)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                  rows={2} 
                ></textarea>
                <p className="text-xs text-text-secondary mt-1">Số lượng seri nhập vào phải bằng số lượng sản phẩm nhập kho.</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ghi chú</label>
              <textarea 
                {...register('notes')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                rows={3} 
              ></textarea>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OpeningStockPage;
