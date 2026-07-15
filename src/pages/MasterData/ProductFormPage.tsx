import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { masterDataApi } from '@/api/masterDataApi';
import { AutoCodeInput } from '@/components/AutoCodeInput/AutoCodeInput';
import toast from 'react-hot-toast';
import { Save, X, ArrowLeft } from 'lucide-react';

const productSchema = z.object({
  sku: z.string().min(1, 'Vui lòng nhập mã sản phẩm'),
  name: z.string().min(1, 'Vui lòng nhập tên sản phẩm'),
  categoryId: z.number().min(1, 'Vui lòng chọn danh mục'),
  uomId: z.number().min(1, 'Vui lòng chọn ĐVT'),
  salePrice: z.number().min(0, 'Giá bán không hợp lệ'),
  costPrice: z.number().min(0, 'Giá vốn không hợp lệ'),
  trackLot: z.boolean(),
  trackSerialNumber: z.boolean(),
  trackExpiry: z.boolean(),
  requiresQualityInspection: z.boolean(),
  stockPolicy: z.string(),
  minStockLevel: z.number().min(0),
  reorderPoint: z.number().min(0),
  isPurchasable: z.boolean(),
  isSellable: z.boolean(),
  description: z.string().optional(),
  defaultBarcode: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

const ProductFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => masterDataApi.getProductById(Number(id)),
    enabled: isEdit,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => masterDataApi.getCategories({ pageIndex: 1, pageSize: 100 }),
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms', 'all'],
    queryFn: () => masterDataApi.getUoms({ pageIndex: 1, pageSize: 100 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      salePrice: 0,
      costPrice: 0,
      trackLot: false,
      trackSerialNumber: false,
      trackExpiry: false,
      requiresQualityInspection: false,
      stockPolicy: 'FIFO', // FIFO by default
      minStockLevel: 0,
      reorderPoint: 0,
      isPurchasable: true,
      isSellable: true,
      defaultBarcode: '',
      sku: '',
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        categoryId: product.categoryId || 0,
        uomId: product.uomId || 0,
        salePrice: product.salePrice || 0,
        costPrice: product.costPrice || 0,
        trackLot: product.trackLot || false,
        trackSerialNumber: product.trackSerialNumber || false,
        trackExpiry: product.trackExpiry || false,
        requiresQualityInspection: product.requiresQualityInspection || false,
        stockPolicy: product.stockPolicy ? String(product.stockPolicy) : 'FIFO',
        minStockLevel: product.minStockLevel || 0,
        reorderPoint: product.reorderPoint || 0,
        isPurchasable: product.isPurchasable ?? true,
        isSellable: product.isSellable ?? true,
        description: product.description || '',
        defaultBarcode: product.defaultBarcode || '',
        sku: product.sku || '',
      });
    }
  }, [product, reset]);

  const mutation = useMutation<any, any, ProductForm>({
    mutationFn: (data: ProductForm) => {
      const payload = isEdit && product ? { ...product, ...data } : data;
      if (isEdit) {
        return masterDataApi.updateProduct(Number(id), payload);
      }
      return masterDataApi.createProduct(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/master-data/products');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  });

  if (isEdit && isLoadingProduct) {
    return <div className="p-8 flex justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-primary/20"></div></div>;
  }

  const onSubmit = (data: ProductForm) => {
    mutation.mutate(data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-background rounded-lg text-text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {isEdit ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-background border border-border text-text-secondary font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <X size={18} /> Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <Save size={18} /> {mutation.isPending ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Thông tin cơ bản */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <AutoCodeInput label="Mã sản phẩm (SKU)" {...register('sku')} error={errors.sku?.message} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tên sản phẩm <span className="text-danger">*</span></label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${errors.name ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`}
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">Barcode / Mã vạch</label>
                <input
                  type="text"
                  {...register('defaultBarcode')}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Nhập mã vạch sản phẩm (nếu có)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Danh mục <span className="text-danger">*</span></label>
                <select
                  {...register('categoryId', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${errors.categoryId ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`}
                >
                  <option value={0}>-- Chọn danh mục --</option>
                  {categoriesData?.items?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-danger text-xs mt-1">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Đơn vị tính <span className="text-danger">*</span></label>
                <select
                  {...register('uomId', { valueAsNumber: true })}
                  className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors ${errors.uomId ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`}
                >
                  <option value={0}>-- Chọn ĐVT --</option>
                  {uomsData?.items?.map(uom => (
                    <option key={uom.id} value={uom.id}>{uom.name} ({uom.code})</option>
                  ))}
                </select>
                {errors.uomId && <p className="text-danger text-xs mt-1">{errors.uomId.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mô tả</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Nhập mô tả sản phẩm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Giá cả & Mua bán */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">Giá cả & Giao dịch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Giá bán (VND)</label>
                <input
                  type="number"
                  {...register('salePrice', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Giá vốn (VND)</label>
                <input
                  type="number"
                  {...register('costPrice', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-right"
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPurchasable" {...register('isPurchasable')} className="w-4 h-4 text-primary rounded border-border" />
                <label htmlFor="isPurchasable" className="text-sm font-medium text-text-primary">Được phép mua</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isSellable" {...register('isSellable')} className="w-4 h-4 text-primary rounded border-border" />
                <label htmlFor="isSellable" className="text-sm font-medium text-text-primary">Được phép bán</label>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải */}
        <div className="space-y-6">
          {/* Section 3: Quy tắc lưu kho */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">Quy tắc lưu kho</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Chính sách xuất kho</label>
                <select
                  {...register('stockPolicy')}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="FIFO">FIFO (Vào trước - Ra trước)</option>
                  <option value="FEFO">FEFO (Hết hạn trước - Ra trước)</option>
                  <option value="LIFO">LIFO (Vào sau - Ra trước)</option>
                  <option value="FEFO_FIFO">FEFO ưu tiên, fallback FIFO</option>
                </select>
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <label htmlFor="trackLot" className="text-sm font-medium text-text-primary cursor-pointer">Theo dõi Số lô (Lot)</label>
                  <input type="checkbox" id="trackLot" {...register('trackLot')} className="w-4 h-4 text-primary rounded border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="trackSerialNumber" className="text-sm font-medium text-text-primary cursor-pointer">Theo dõi Serial</label>
                  <input type="checkbox" id="trackSerialNumber" {...register('trackSerialNumber')} className="w-4 h-4 text-primary rounded border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="trackExpiry" className="text-sm font-medium text-text-primary cursor-pointer">Theo dõi Hạn sử dụng</label>
                  <input type="checkbox" id="trackExpiry" {...register('trackExpiry')} className="w-4 h-4 text-primary rounded border-border focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="requiresQualityInspection" className="text-sm font-medium text-text-primary cursor-pointer">Bắt buộc QC (Quality Check)</label>
                  <input type="checkbox" id="requiresQualityInspection" {...register('requiresQualityInspection')} className="w-4 h-4 text-primary rounded border-border focus:ring-primary/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Mức cảnh báo */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">Mức tồn kho & Cảnh báo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Mức tồn tối thiểu (Min Stock)</label>
                <input
                  type="number"
                  {...register('minStockLevel', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Điểm đặt hàng lại (Reorder Point)</label>
                <input
                  type="number"
                  {...register('reorderPoint', { valueAsNumber: true })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProductFormPage;
