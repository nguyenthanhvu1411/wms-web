import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import type { AdvanceShippingNotice } from '@/types/inbound';

const updateAsnSchema = z.object({
  expectedArrivalDate: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  vehiclePlate: z.string().optional(),
  driverName: z.string().optional(),
  notes: z.string().optional(),
});

type UpdateAsnFormValues = z.infer<typeof updateAsnSchema>;

interface EditAsnModalProps {
  isOpen: boolean;
  onClose: () => void;
  asn: AdvanceShippingNotice;
  onSubmit: (data: UpdateAsnFormValues) => void;
  isSubmitting: boolean;
}

export const EditAsnModal: React.FC<EditAsnModalProps> = ({
  isOpen,
  onClose,
  asn,
  onSubmit,
  isSubmitting
}) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateAsnFormValues>({
    resolver: zodResolver(updateAsnSchema),
    defaultValues: {
      expectedArrivalDate: asn.expectedArrivalDate ? asn.expectedArrivalDate.split('T')[0] : '',
      carrierName: asn.carrierName || '',
      trackingNumber: asn.trackingNumber || '',
      vehiclePlate: asn.vehiclePlate || '',
      driverName: asn.driverName || '',
      notes: asn.notes || '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        expectedArrivalDate: asn.expectedArrivalDate ? asn.expectedArrivalDate.split('T')[0] : '',
        carrierName: asn.carrierName || '',
        trackingNumber: asn.trackingNumber || '',
        vehiclePlate: asn.vehiclePlate || '',
        driverName: asn.driverName || '',
        notes: asn.notes || '',
      });
    }
  }, [isOpen, asn, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background/50">
          <h2 className="text-lg font-semibold text-text-primary">Sửa Thông tin Vận chuyển ASN</h2>
          <button onClick={onClose} className="p-2 hover:bg-background-hover rounded-full transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {...register('trackingNumber')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">Ghi chú</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-background/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-background-hover transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
