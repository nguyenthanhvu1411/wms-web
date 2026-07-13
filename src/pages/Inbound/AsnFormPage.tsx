import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import { MasterDataSelect } from '@/components/Form/MasterDataSelect';
import { Save, X, Plus, Trash2, Link } from 'lucide-react';
import toast from 'react-hot-toast';

const asnSchema = z.object({
  supplierId: z.number().min(1, 'Vui lòng chọn nhà cung cấp'),
  warehouseId: z.number().min(1, 'Vui lòng chọn kho nhập'),
  purchaseOrderId: z.number().optional(),
  expectedArrivalDate: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  vehiclePlate: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.number().min(1, 'Vui lòng chọn sản phẩm'),
    uomId: z.number().min(1, 'Vui lòng chọn đơn vị tính'),
    qtyExpected: z.number().min(0.01, 'Số lượng phải lớn hơn 0'),
    lotNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    manufactureDate: z.string().optional(),
    countryOfOrigin: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, 'Phải có ít nhất 1 dòng hàng'),
});

type AsnFormValues = z.infer<typeof asnSchema>;

const AsnFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poIdStr = searchParams.get('poId');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill if poId is present
  const { data: po } = useQuery({
    queryKey: inboundKeys.purchaseOrder(Number(poIdStr)),
    queryFn: () => inboundApi.getPurchaseOrderById(Number(poIdStr)),
    enabled: !!poIdStr,
  });

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<AsnFormValues>({
    resolver: zodResolver(asnSchema),
    defaultValues: {
      purchaseOrderId: poIdStr ? Number(poIdStr) : undefined,
      lines: [{ qtyExpected: 1 }],
    },
  });

  // Effect to pre-fill from PO
  React.useEffect(() => {
    if (po) {
      reset({
        supplierId: po.supplierId,
        warehouseId: po.warehouseId,
        purchaseOrderId: po.id,
        lines: po.lines.map(line => ({
          productId: line.productId,
          uomId: line.uomId,
          qtyExpected: line.qtyOrdered - line.qtyReceived > 0 ? line.qtyOrdered - line.qtyReceived : 0
        }))
      });
    }
  }, [po, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const createMutation = useMutation({
    mutationFn: inboundApi.createAsn,
    onSuccess: (data) => {
      toast.success('Tạo ASN thành công');
      queryClient.invalidateQueries({ queryKey: inboundKeys.asns });
      navigate(`/inbound/asns/${data.id}`);
    },
    onError: () => {
      // Error handling is managed by global interceptor, but we can stop submitting state here
      setIsSubmitting(false);
    }
  });

  const onSubmit = (data: AsnFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      expectedArrivalDate: data.expectedArrivalDate || undefined,
      carrierName: data.carrierName || undefined,
      trackingNumber: data.trackingNumber || undefined,
      vehiclePlate: data.vehiclePlate || undefined,
      driverName: data.driverName || undefined,
      notes: data.notes || undefined,
      lines: data.lines.map(l => ({
        ...l,
        lotNumber: l.lotNumber || undefined,
        expiryDate: l.expiryDate || undefined,
        manufactureDate: l.manufactureDate || undefined,
        countryOfOrigin: l.countryOfOrigin || undefined,
        notes: l.notes || undefined,
      }))
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tạo ASN Mới</h1>
          <p className="text-text-secondary mt-1">Tạo thông báo giao hàng mới từ nhà cung cấp</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/inbound/asns')}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-background border border-border rounded-lg hover:bg-background-hover transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Hủy
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu ASN'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <MasterDataSelect
              name="supplierId"
              control={control as any}
              type="supplier"
              label="Nhà cung cấp"
              required={true}
            />
          </div>

          <div>
            <MasterDataSelect
              name="warehouseId"
              control={control as any}
              type="warehouse"
              label="Kho nhận"
              required={true}
            />
          </div>

          {poIdStr && po && (
            <div className="md:col-span-1 lg:col-span-1">
              <label className="block text-sm font-medium text-text-primary mb-1">Liên kết Đơn Mua Hàng</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-border rounded-lg text-sm text-text-secondary">
                <Link size={16} className="text-primary" />
                <span className="font-medium text-primary">{po.poNumber}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Ngày dự kiến đến</label>
            <input
              type="date"
              {...register('expectedArrivalDate')}
              className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.expectedArrivalDate ? 'border-error' : 'border-border'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Đơn vị vận chuyển</label>
            <input
              type="text"
              {...register('carrierName')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Mã vận đơn</label>
            <input
              type="text"
              readOnly
              placeholder="Hệ thống tự động sinh "
              {...register('trackingNumber')}
              className="w-full px-3 py-2 bg-slate-50 border border-border rounded-lg text-sm text-text-secondary cursor-not-allowed focus:outline-none placeholder-text-secondary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Biển số xe</label>
            <input
              type="text"
              {...register('vehiclePlate')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Tài xế</label>
            <input
              type="text"
              {...register('driverName')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-text-primary mb-1">Ghi chú</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            Chi tiết hàng hóa <span className="text-error">*</span>
          </h2>
          <button
            type="button"
            onClick={() => append({ productId: 0, uomId: 0, qtyExpected: 1 })}
            className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Thêm dòng
          </button>
        </div>

        {errors.lines?.root && (
          <div className="mx-6 mt-4 p-3 bg-error/10 text-error text-sm rounded-lg border border-error/20">
            {errors.lines.root.message}
          </div>
        )}

        <div className="p-6 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-medium text-text-secondary text-sm w-12">#</th>
                <th className="pb-3 font-medium text-text-secondary text-sm min-w-[250px]">Sản phẩm</th>
                <th className="pb-3 font-medium text-text-secondary text-sm w-[150px]">ĐVT</th>
                <th className="pb-3 font-medium text-text-secondary text-sm w-[120px]">SL Dự Kiến</th>
                <th className="pb-3 font-medium text-text-secondary text-sm w-[150px]">Lô SX (Lot)</th>
                <th className="pb-3 font-medium text-text-secondary text-sm w-[150px]">Hạn SD</th>
                <th className="pb-3 font-medium text-text-secondary text-sm w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {fields.map((field, index) => (
                <tr key={field.id} className="group">
                  <td className="py-3 text-sm text-text-secondary align-top pt-5">{index + 1}</td>
                  <td className="py-3 pr-4 align-top">
                    <MasterDataSelect
                      name={`lines.${index}.productId`}
                      control={control as any}
                      type="product"
                      label=""
                      placeholder="Chọn sản phẩm"
                    />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <MasterDataSelect
                      name={`lines.${index}.uomId`}
                      control={control as any}
                      type="uom"
                      label=""
                      placeholder="Chọn ĐVT"
                    />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.qtyExpected`, { valueAsNumber: true })}
                      className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.lines?.[index]?.qtyExpected ? 'border-error' : 'border-border'}`}
                    />
                    {errors.lines?.[index]?.qtyExpected && (
                      <p className="text-error text-xs mt-1">{errors.lines[index]?.qtyExpected?.message}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <input
                      type="text"
                      placeholder="Tùy chọn"
                      {...register(`lines.${index}.lotNumber`)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <input
                      type="date"
                      {...register(`lines.${index}.expiryDate`)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </td>
                  <td className="py-3 align-top pt-4">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Xóa dòng"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fields.length === 0 && (
            <div className="text-center py-8 text-text-secondary text-sm">
              Chưa có sản phẩm nào. Bấm "Thêm dòng" để bắt đầu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsnFormPage;
