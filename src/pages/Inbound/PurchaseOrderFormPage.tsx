import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi, type CreatePurchaseOrderRequest, type UpdatePurchaseOrderRequest } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MasterDataSelect } from '@/components/Form/MasterDataSelect';
import { masterDataApi } from '@/api/masterDataApi';

const schema = z.object({
  supplierId: z.number({ message: 'Vui lòng chọn nhà cung cấp' }).min(1, 'Vui lòng chọn nhà cung cấp'),
  warehouseId: z.number({ message: 'Vui lòng chọn kho' }).min(1, 'Vui lòng chọn kho'),
  orderDate: z.string().min(1, 'Vui lòng chọn ngày đặt hàng'),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      productId: z.number({ message: 'Vui lòng chọn sản phẩm' }).min(1, 'Vui lòng chọn sản phẩm'),
      uomId: z.number({ message: 'Vui lòng chọn ĐVT' }).min(1, 'Vui lòng chọn ĐVT'),
      qtyOrdered: z.number({ message: "Vui lòng nhập số" }).int('Số lượng phải là số nguyên dương').min(1, 'Số lượng phải lớn hơn 0'),
      unitPrice: z.number().min(0, 'Đơn giá không hợp lệ'),
      discountPercent: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 dòng sản phẩm'),
}).refine((data) => {
  // Validate unique product + uom combinations
  const seen = new Set();
  for (const line of data.lines) {
    const key = `${line.productId}-${line.uomId}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}, {
  message: 'Không được phép có các dòng hàng trùng lặp (Cùng sản phẩm và cùng ĐVT)',
  path: ['lines'], // attach error to lines array
});

type FormValues = z.infer<typeof schema>;

const PurchaseOrderFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: poToEdit, isLoading: isEditingLoading } = useQuery({
    queryKey: inboundKeys.purchaseOrder(Number(id)),
    queryFn: () => inboundApi.getPurchaseOrderById(Number(id)),
    enabled: isEditMode,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => masterDataApi.getProducts({ pageIndex: 1, pageSize: 1000 }),
  });

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0],
      lines: [{ productId: 0, uomId: 0, qtyOrdered: 1, unitPrice: 0, discountPercent: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const linesWatch = watch('lines');

  useEffect(() => {
    if (isEditMode && poToEdit) {
      reset({
        supplierId: poToEdit.supplierId,
        warehouseId: poToEdit.warehouseId,
        orderDate: poToEdit.orderDate ? poToEdit.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
        expectedDeliveryDate: poToEdit.expectedDeliveryDate ? poToEdit.expectedDeliveryDate.split('T')[0] : '',
        notes: poToEdit.notes || '',
        lines: poToEdit.lines.map(line => ({
          productId: line.productId,
          uomId: line.uomId,
          qtyOrdered: line.qtyOrdered,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || 0,
          notes: line.notes || '',
        }))
      });
    }
  }, [isEditMode, poToEdit, reset]);

  // Watch for product changes to auto-update unitPrice
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // name might be "lines.0.productId"
      if (type === 'change' && name?.includes('.productId')) {
        const match = name.match(/lines\.(\d+)\.productId/);
        if (match) {
          const index = parseInt(match[1], 10);
          const lines = value.lines;
          if (lines && lines[index]) {
            let productId = lines[index].productId;
            // Handle if MasterDataSelect returns { value, label } instead of primitive
            if (productId && typeof productId === 'object' && 'value' in (productId as any)) {
              productId = (productId as any).value;
            }
            if (productId) {
              const product = productsData?.items?.find((p: any) => p.id === Number(productId));
              if (product) {
                setValue(`lines.${index}.unitPrice`, product.costPrice || 0);
              }
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, productsData, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => inboundApi.createPurchaseOrder(data),
    onSuccess: (res) => {
      toast.success('Tạo Đơn Mua Hàng thành công!');
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrders });
      navigate(`/inbound/purchase-orders/${res.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo Đơn Mua Hàng');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePurchaseOrderRequest) => inboundApi.updatePurchaseOrder(Number(id), data),
    onSuccess: (res) => {
      toast.success('Cập nhật Đơn Mua Hàng thành công!');
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrders });
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrder(Number(id)) });
      navigate(`/inbound/purchase-orders/${res.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật Đơn Mua Hàng');
    }
  });

  const onSubmit = (data: FormValues) => {
    // Format dates correctly
    const payload = {
      ...data,
      expectedDeliveryDate: data.expectedDeliveryDate || undefined,
    };
    if (isEditMode) {
      updateMutation.mutate(payload as UpdatePurchaseOrderRequest);
    } else {
      createMutation.mutate(payload as CreatePurchaseOrderRequest);
    }
  };

  if (isEditMode && isEditingLoading) {
    return <div className="p-8 text-center text-text-muted">Đang tải dữ liệu...</div>;
  }

  // Calculate totals for preview
  const grandTotal = linesWatch.reduce((acc, line) => {
    const qty = line.qtyOrdered || 0;
    const price = line.unitPrice || 0;
    const discount = line.discountPercent || 0;
    const lineTotal = qty * price * (1 - discount / 100);
    return acc + lineTotal;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/inbound/purchase-orders')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditMode ? `Cập Nhật PO: ${poToEdit?.poNumber || ''}` : 'Tạo Đơn Mua Hàng'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isEditMode ? 'Chỉnh sửa thông tin đơn mua hàng' : 'Hệ thống sẽ tự động sinh mã PO sau khi lưu'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Info */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border">Thông Tin Chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <MasterDataSelect
                name="supplierId"
                control={control as any}
                label="Nhà Cung Cấp"
                type="supplier"
                required
              />
              <MasterDataSelect
                name="warehouseId"
                control={control as any}
                label="Kho Nhận Hàng"
                type="warehouse"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Ngày Đặt Hàng <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                {...register('orderDate')}
                className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                  errors.orderDate ? 'border-danger focus:ring-danger/20' : 'border-border'
                }`}
              />
              {errors.orderDate && <p className="mt-1 text-sm text-danger">{errors.orderDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Ngày Dự Kiến Giao
              </label>
              <input
                type="date"
                {...register('expectedDeliveryDate')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Ghi chú</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Nhập ghi chú cho đơn hàng..."
              />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Chi Tiết Dòng Hàng</h2>
            <button
              type="button"
              onClick={() => append({ productId: 0, uomId: 0, qtyOrdered: 1, unitPrice: 0, discountPercent: 0 })}
              className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm Dòng
            </button>
          </div>

          {errors.lines?.root && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {errors.lines.root.message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border text-sm text-text-muted">
                  <th className="pb-3 font-medium w-1/3">Sản Phẩm</th>
                  <th className="pb-3 font-medium w-1/6">ĐVT</th>
                  <th className="pb-3 font-medium w-1/8 text-right">Số Lượng</th>
                  <th className="pb-3 font-medium w-1/6 text-right">Đơn Giá</th>
                  <th className="pb-3 font-medium w-24 text-right">CK (%)</th>
                  <th className="pb-3 font-medium w-24 text-right">Thành Tiền</th>
                  <th className="pb-3 font-medium w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields.map((field, index) => {
                  const lineTotal = (linesWatch[index]?.qtyOrdered || 0) * (linesWatch[index]?.unitPrice || 0) * (1 - (linesWatch[index]?.discountPercent || 0) / 100);
                  
                  return (
                    <tr key={field.id}>
                      <td className="py-3 pr-2">
                        <MasterDataSelect
                          name={`lines.${index}.productId`}
                          control={control as any}
                          label=""
                          type="product"
                          placeholder="Chọn sản phẩm"
                          onChangeData={(productData: any) => {
                            if (productData) {
                              setValue(`lines.${index}.unitPrice`, productData.costPrice || 0);
                              if (productData.defaultUomId) {
                                setValue(`lines.${index}.uomId`, productData.defaultUomId);
                              }
                            }
                          }}
                        />
                        {errors.lines?.[index]?.productId && (
                          <p className="mt-1 text-xs text-danger">{errors.lines[index]?.productId?.message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <MasterDataSelect
                          name={`lines.${index}.uomId`}
                          control={control as any}
                          label=""
                          type="uom"
                          placeholder="Chọn ĐVT"
                        />
                        {errors.lines?.[index]?.uomId && (
                          <p className="mt-1 text-xs text-danger">{errors.lines[index]?.uomId?.message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          {...register(`lines.${index}.qtyOrdered`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-right bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                        {errors.lines?.[index]?.qtyOrdered && (
                          <p className="mt-1 text-xs text-danger text-right">{errors.lines[index]?.qtyOrdered?.message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-right bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                        {errors.lines?.[index]?.unitPrice && (
                          <p className="mt-1 text-xs text-danger text-right">{errors.lines[index]?.unitPrice?.message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          step="0.1"
                          {...register(`lines.${index}.discountPercent`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-right bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                      </td>
                      <td className="py-3 pl-2 text-right font-medium text-text-primary align-middle">
                        {new Intl.NumberFormat('vi-VN').format(lineTotal)}
                      </td>
                      <td className="py-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors disabled:opacity-50"
                          disabled={fields.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="py-4 text-right font-medium text-text-primary">
                    Tổng cộng (Tạm tính):
                  </td>
                  <td className="py-4 text-right font-bold text-lg text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate('/inbound/purchase-orders')}
            className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors disabled:opacity-70"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={18} />
            )}
            Lưu PO
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderFormPage;
