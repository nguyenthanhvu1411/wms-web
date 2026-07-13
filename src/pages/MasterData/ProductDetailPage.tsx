import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Package, Box, Tag, Layers, Barcode, Trash2, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { masterDataApi } from '@/api/masterDataApi';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { DataTable } from '@/components/DataTable/DataTable';
import type { ProductBarcode } from '@/types/masterData';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const barcodeSchema = z.object({
  barcode: z.string().min(1, 'Vui lòng nhập barcode'),
  uomId: z.number().min(1, 'Vui lòng chọn ĐVT (UOM)'),
  qtyPerUom: z.number().min(1, 'Số lượng quy đổi phải > 0'),
  isDefault: z.boolean(),
});
type BarcodeForm = z.infer<typeof barcodeSchema>;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => masterDataApi.getProductById(Number(id)),
  });

  const { data: barcodes, isLoading: isLoadingBarcodes } = useQuery({
    queryKey: ['product-barcodes', id],
    queryFn: () => masterDataApi.getProductBarcodes(Number(id)),
    enabled: activeTab === 'barcodes'
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms', 'all'],
    queryFn: () => masterDataApi.getUoms({ pageIndex: 1, pageSize: 100 }),
    enabled: activeTab === 'barcodes'
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BarcodeForm>({
    resolver: zodResolver(barcodeSchema),
    defaultValues: { uomId: 0, qtyPerUom: 1, isDefault: false }
  });

  const addBarcodeMutation = useMutation({
    mutationFn: (data: BarcodeForm) => masterDataApi.addProductBarcode(Number(id), data),
    onSuccess: () => {
      toast.success('Thêm barcode thành công');
      queryClient.invalidateQueries({ queryKey: ['product-barcodes', id] });
      reset();
    },
    onError: () => toast.error('Lỗi khi thêm barcode (có thể đã tồn tại)')
  });

  const deleteBarcodeMutation = useMutation({
    mutationFn: (barcodeId: number) => masterDataApi.deleteProductBarcode(Number(id), barcodeId),
    onSuccess: () => {
      toast.success('Xóa barcode thành công');
      queryClient.invalidateQueries({ queryKey: ['product-barcodes', id] });
    },
    onError: () => toast.error('Lỗi khi xóa barcode')
  });

  if (isLoading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Đang tải thông tin sản phẩm...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-danger">Không tìm thấy sản phẩm!</div>;
  }

  const barcodeColumns = [
    { header: 'Barcode', accessorKey: 'barcode' as keyof ProductBarcode, className: 'font-mono text-primary font-medium' },
    { header: 'Đơn vị tính (UOM)', accessorKey: 'uomName' as keyof ProductBarcode },
    { header: 'Quy đổi (Qty/UOM)', accessorKey: 'qtyPerUom' as keyof ProductBarcode },
    { header: 'Mặc định', accessorKey: 'isDefault' as keyof ProductBarcode, cell: (item: any) => item.isDefault ? 'Có' : 'Không' },
    { 
      header: 'Thao Tác', 
      className: 'text-right',
      cell: (item: ProductBarcode) => (
        <div className="flex justify-end">
          <button 
            onClick={() => deleteBarcodeMutation.mutate(item.id)}
            className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/master-data/products')}
            className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{product.name}</h1>
              <StatusBadge status={product.status === 1 ? 'Active' : product.status === 2 ? 'Inactive' : 'Pending'} />
            </div>
            <p className="text-sm text-text-secondary mt-1 font-mono">
              SKU: {product.sku}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/master-data/products/${product.id}/edit`)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Edit size={18} /> Chỉnh sửa
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          <Package size={16} /> Tổng quan
        </button>
        <button 
          onClick={() => setActiveTab('barcodes')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'barcodes' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          <Barcode size={16} /> Barcodes & Mã vạch
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Box size={16} /> Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-text-muted mb-1">Danh mục</p>
                  <p className="text-sm font-medium text-text-primary">{product.categoryName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Đơn vị tính (UOM)</p>
                  <p className="text-sm font-medium text-text-primary">{product.uomName || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-text-muted mb-1">Mô tả</p>
                  <p className="text-sm text-text-primary">{product.description || 'Chưa có mô tả'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Tag size={16} /> Thông tin tài chính
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-text-muted mb-1">Giá bán</p>
                  <p className="text-lg font-bold text-success">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Giá vốn</p>
                  <p className="text-lg font-bold text-warning">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.costPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Được phép mua</p>
                  <p className="text-sm font-medium text-text-primary">{product.isPurchasable ? 'Có' : 'Không'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Được phép bán</p>
                  <p className="text-sm font-medium text-text-primary">{product.isSellable ? 'Có' : 'Không'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={16} /> Quy tắc lưu kho
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-primary/70 mb-1">Chính sách xuất kho</p>
                  <p className="text-base font-bold text-primary">
                    {product.stockPolicy === 1 ? 'FIFO (Vào trước ra trước)' : product.stockPolicy === 2 ? 'FEFO (Hết hạn trước)' : 'LIFO (Vào sau ra trước)'}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Theo dõi Số lô (Lot)</span>
                    {product.trackLot ? <ShieldCheck size={18} className="text-success" /> : <span className="text-text-muted text-xs">Không</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Theo dõi Serial</span>
                    {product.trackSerialNumber ? <ShieldCheck size={18} className="text-success" /> : <span className="text-text-muted text-xs">Không</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Theo dõi Hạn SD (Exp)</span>
                    {product.trackExpiry ? <ShieldCheck size={18} className="text-success" /> : <span className="text-text-muted text-xs">Không</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
               <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle size={16} /> Cảnh báo tồn kho
               </h3>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-text-muted">Tồn tối thiểu (Min)</p>
                    <p className="text-base font-bold text-text-primary">{product.minStockLevel || 0}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-text-muted">Điểm đặt hàng (Reorder)</p>
                    <p className="text-base font-bold text-text-primary">{product.reorderPoint || 0}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'barcodes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-medium text-text-primary">Danh sách Barcode</h2>
              </div>
              <DataTable
                columns={barcodeColumns}
                data={barcodes || []}
                pageIndex={1}
                pageSize={100}
                totalCount={barcodes?.length || 0}
                onPageChange={() => {}}
                isLoading={isLoadingBarcodes}
              />
            </div>
          </div>
          
          <div>
            <form onSubmit={handleSubmit((d) => addBarcodeMutation.mutate(d))} className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-6">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Thêm Barcode Mới</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Mã Barcode</label>
                  <input 
                    {...register('barcode')}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                    placeholder="VD: 8935044231234"
                  />
                  {errors.barcode && <p className="text-danger text-xs mt-1">{errors.barcode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Đơn vị tính (UOM)</label>
                  <select 
                    {...register('uomId', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value={0}>-- Chọn ĐVT --</option>
                    {uomsData?.items?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                  </select>
                  {errors.uomId && <p className="text-danger text-xs mt-1">{errors.uomId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Hệ số quy đổi (Qty/UOM)</label>
                  <input 
                    type="number"
                    step="1"
                    {...register('qtyPerUom', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  {errors.qtyPerUom && <p className="text-danger text-xs mt-1">{errors.qtyPerUom.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isDefault" {...register('isDefault')} className="w-4 h-4 text-primary rounded border-border" />
                  <label htmlFor="isDefault" className="text-sm font-medium text-text-primary">Barcode mặc định</label>
                </div>
                <button 
                  type="submit"
                  disabled={addBarcodeMutation.isPending}
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                  {addBarcodeMutation.isPending ? 'Đang thêm...' : <><Plus size={18} /> Thêm vào danh sách</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailPage;
