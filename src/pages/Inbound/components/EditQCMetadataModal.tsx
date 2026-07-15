import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi, type UpdateQualityCheckMetadataRequest } from '@/api/inboundApi';
import { inboundKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';
import type { QualityCheck } from '@/types/inbound';

interface EditQCMetadataModalProps {
  qc: QualityCheck;
  isOpen: boolean;
  onClose: () => void;
}

export const EditQCMetadataModal: React.FC<EditQCMetadataModalProps> = ({ qc, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const getLocalDatetime = (dateString?: string | null) => {
    if (dateString) {
      return new Date(dateString).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<UpdateQualityCheckMetadataRequest>({
    defaultValues: {
      inspectorId: qc.inspectorId || '',
      inspectedAt: getLocalDatetime(qc.inspectedAt),
      methodUsed: qc.methodUsed || ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        inspectorId: qc.inspectorId || '',
        inspectedAt: getLocalDatetime(qc.inspectedAt),
        methodUsed: qc.methodUsed || ''
      });
    }
  }, [isOpen, qc, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateQualityCheckMetadataRequest) => 
      inboundApi.updateQualityCheckMetadata(qc.id, {
        inspectorId: data.inspectorId || undefined,
        inspectedAt: data.inspectedAt ? new Date(data.inspectedAt).toISOString() : undefined,
        methodUsed: data.methodUsed || undefined
      }),
    onSuccess: () => {
      toast.success('Cập nhật thông tin QC thành công');
      queryClient.invalidateQueries({ queryKey: [...inboundKeys.qualityChecks, String(qc.id)] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Cập nhật thất bại');
    }
  });

  const onSubmit = (data: UpdateQualityCheckMetadataRequest) => {
    updateMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Chỉnh sửa thông tin QC</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Người kiểm tra
              </label>
              <input
                type="text"
                {...register('inspectorId')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                placeholder="Nhập mã/tên người kiểm tra"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Ngày kiểm tra
              </label>
              <input
                type="datetime-local"
                {...register('inspectedAt')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Phương pháp kiểm tra
              </label>
              <select
                {...register('methodUsed')}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary bg-white"
              >
                <option value="">-- Chọn phương pháp --</option>
                <option value="AQL 1.0">AQL 1.0</option>
                <option value="AQL 2.5">AQL 2.5</option>
                <option value="AQL 4.0">AQL 4.0</option>
                <option value="Kiểm tra 100%">Kiểm tra 100%</option>
                <option value="Lấy mẫu ngẫu nhiên">Lấy mẫu ngẫu nhiên</option>
                <option value="Kiểm tra ngoại quan">Kiểm tra ngoại quan</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
