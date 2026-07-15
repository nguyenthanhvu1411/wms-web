import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X } from 'lucide-react';
import type { User } from '@/types/system';
import { systemApi } from '@/api/systemApi';
import { masterDataApi } from '@/api/masterDataApi';
import toast from 'react-hot-toast';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingUser
}) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Partial<User> & { password?: string }>({
    defaultValues: {
      isActive: true,
      role: 'Staff'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        reset({
          ...editingUser,
          password: ''
        });
      } else {
        reset({
          username: '',
          fullName: '',
          email: '',
          phone: '',
          role: 'Staff',
          isActive: true,
          assignedWarehouseId: undefined,
          password: ''
        });
      }
      
      // Fetch warehouses
      masterDataApi.getWarehouses({ pageIndex: 1, pageSize: 100 }).then(res => {
        setWarehouses(res.items || []);
      }).catch(err => console.error(err));
    }
  }, [isOpen, editingUser, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await systemApi.updateUser(editingUser.id, data);
        toast.success('Cập nhật người dùng thành công');
      } else {
        await systemApi.createUser(data);
        toast.success('Thêm người dùng thành công');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-text-primary">
            {editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Tài khoản (Username) <span className="text-danger">*</span>
              </label>
              <input
                {...register('username', { required: 'Vui lòng nhập tài khoản' })}
                disabled={!!editingUser}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:bg-slate-100"
                placeholder="Ví dụ: nva"
              />
              {errors.username && <p className="text-danger text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Họ và tên <span className="text-danger">*</span>
              </label>
              <input
                {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Ví dụ: Nguyễn Văn A"
              />
              {errors.fullName && <p className="text-danger text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                {...register('email', { required: 'Vui lòng nhập email' })}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Ví dụ: email@domain.com"
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Số điện thoại
              </label>
              <input
                {...register('phone')}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="Ví dụ: 0901234567"
              />
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Mật khẩu <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Vai trò (Role)
              </label>
              <select
                {...register('role')}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              >
                <option value="Staff">Nhân viên (Staff)</option>
                <option value="Supervisor">Giám sát vận hành (Supervisor)</option>
                <option value="WarehouseManager">Quản lý kho (Warehouse Manager)</option>
                <option value="Viewer">Chỉ xem (Viewer)</option>
                <option value="Admin">Quản trị hệ thống (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Kho phân công (Tùy chọn)
              </label>
              <select
                {...register('assignedWarehouseId', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-border-color focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              >
                <option value="">-- Tất cả kho --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-text-primary">Hoạt động</span>
              </label>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              {editingUser ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
