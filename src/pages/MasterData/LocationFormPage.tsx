import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Printer } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AutoCodeInput } from '@/components/AutoCodeInput/AutoCodeInput';

const schema = z.object({
  code: z.string().min(1, 'Vui lòng nhập hoặc sinh mã vị trí'),
  warehouseId: z.number().min(1, 'Vui lòng chọn Kho'),
  zone: z.string().optional(),
  aisle: z.string().optional(),
  rack: z.string().optional(),
  bin: z.string().optional(),
  type: z.number(),
  maxVolumeM3: z.number().min(0),
  maxWeightKg: z.number().min(0),
  allowMixedProducts: z.boolean(),
  allowMixedLots: z.boolean(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const LocationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const defaultWarehouseId = searchParams.get('warehouseId');
  const isEdit = !!id;
  const queryClient = useQueryClient();

  const { data: location, isLoading: isLoadingLocation } = useQuery({
    queryKey: ['location', id],
    queryFn: () => masterDataApi.getLocationById(Number(id)),
    enabled: isEdit,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: () => masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }),
  });

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      warehouseId: defaultWarehouseId ? Number(defaultWarehouseId) : 0,
      type: 1, // 1: Storage, 2: Picking, 3: Receiving, 4: Shipping
      maxVolumeM3: 0,
      maxWeightKg: 0,
      allowMixedProducts: false,
      allowMixedLots: false,
    }
  });

  const watchZone = useWatch({ control, name: 'zone' });
  const watchAisle = useWatch({ control, name: 'aisle' });
  const watchRack = useWatch({ control, name: 'rack' });
  const watchBin = useWatch({ control, name: 'bin' });
  const watchCode = useWatch({ control, name: 'code' });

  useEffect(() => {
    if (location) {
      reset({
        code: location.code || '',
        warehouseId: location.warehouseId || 0,
        zone: location.zone || '',
        aisle: location.aisle || '',
        rack: location.rack || '',
        bin: location.bin || '',
        type: location.type || 1,
        maxVolumeM3: location.maxVolumeM3 || 0,
        maxWeightKg: location.maxWeightKg || 0,
        allowMixedProducts: location.allowMixedProducts,
        allowMixedLots: location.allowMixedLots,
        notes: location.notes || '',
      });
    }
  }, [location, reset]);

  const handleGenerateCode = () => {
    const parts = [watchZone, watchAisle, watchRack, watchBin].filter(Boolean);
    if (parts.length === 0) {
      toast.error('Vui lòng nhập ít nhất một thông tin Zone, Aisle, Rack, hoặc Bin để sinh mã');
      return;
    }
    const newCode = parts.join('-');
    setValue('code', newCode.toUpperCase(), { shouldValidate: true });
    toast.success(`Đã sinh mã: ${newCode.toUpperCase()}`);
  };

  const printLabelMutation = useMutation({
    mutationFn: (locationId: number) => masterDataApi.getLocationLabel(locationId),
    onSuccess: () => {
      // In a real scenario, this might return a PDF or base64 image
      toast.success('Đã gửi lệnh in nhãn!');
    },
    onError: () => toast.error('Không thể in nhãn')
  });

  const mutation = useMutation<any, any, FormValues>({
    mutationFn: (data: FormValues) => {
      if (isEdit) {
        return masterDataApi.updateLocation(Number(id), data);
      }
      return masterDataApi.createLocation(data);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-summary'] });
      navigate('/master-data/locations');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  if (isEdit && isLoadingLocation) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? 'Cập nhật Vị trí' : 'Thêm mới Vị trí'}
          </h1>
        </div>
        <div className="ml-auto flex gap-3">
          {isEdit && (
            <button 
              type="button"
              onClick={() => printLabelMutation.mutate(Number(id))}
              className="px-4 py-2 bg-white border border-border text-text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Printer size={18} /> In nhãn
            </button>
          )}
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white border border-border text-text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit"
            form="location-form"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>

      <form id="location-form" onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Thông tin Vị trí & Định danh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <AutoCodeInput 
                label="Mã vị trí (Code)" 
                prefix="LOC-" 
                isManual={true} 
                value={watchCode}
                onChange={(val) => setValue('code', val.toUpperCase(), { shouldValidate: true })}
                onGenerate={handleGenerateCode}
                error={errors.code?.message}
              />
              <p className="text-xs text-text-muted mt-1">Nhập tay mã vị trí hoặc điền thông tin Zone/Aisle/Rack/Bin và bấm nút cây đũa phép để sinh mã tự động.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Kho <span className="text-danger">*</span></label>
              <select 
                {...register('warehouseId', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value={0}>-- Chọn kho --</option>
                {warehousesData?.items?.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
              {errors.warehouseId && <p className="mt-1 text-sm text-danger">{errors.warehouseId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Loại vị trí</label>
              <select 
                {...register('type', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value={1}>Lưu trữ (Storage)</option>
                <option value={2}>Lấy hàng (Picking)</option>
                <option value={3}>Nhận hàng (Receiving)</option>
                <option value={4}>Xuất hàng (Shipping)</option>
                <option value={5}>Chờ xử lý (Staging)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Zone (Khu vực)</label>
              <input 
                {...register('zone')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: Z1, COLD, DRY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Aisle (Dãy/Lối đi)</label>
              <input 
                {...register('aisle')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: A01, A02"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Rack (Kệ)</label>
              <input 
                {...register('rack')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: R01, R02"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Bin (Ô/Ngăn)</label>
              <input 
                {...register('bin')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="VD: 01, 02, 03"
              />
            </div>

          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border">Giới hạn & Sức chứa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Thể tích tối đa (m3)</label>
              <input 
                type="number"
                step="0.01"
                {...register('maxVolumeM3', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Khối lượng tối đa (Kg)</label>
              <input 
                type="number"
                step="0.01"
                {...register('maxWeightKg', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="md:col-span-2 flex gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  {...register('allowMixedProducts')}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text-primary">Cho phép trộn sản phẩm (Mixed Products)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  {...register('allowMixedLots')}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text-primary">Cho phép trộn Lot/Date (Mixed Lots)</span>
              </label>
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

export default LocationFormPage;
