import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/api/systemApi';
import { Bell, Check, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => systemApi.getNotifications(),
  });

  const notifications = response || [];

  const markReadMutation = useMutation({
    mutationFn: (id: number) => systemApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Không thể đánh dấu đã đọc')
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => systemApi.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success('Đã đánh dấu đọc tất cả thông báo');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Không thể thực hiện tác vụ')
  });

  const getTypeColor = (type: number) => {
    switch(type) {
      case 1: return 'text-success bg-success/10 border-success/20'; // Success
      case 2: return 'text-warning bg-warning/10 border-warning/20'; // Warning
      case 3: return 'text-danger bg-danger/10 border-danger/20'; // Error
      default: return 'text-info bg-info/10 border-info/20'; // Info
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Thông báo hệ thống</h1>
            <p className="text-sm text-text-secondary mt-1">Quản lý và theo dõi các cảnh báo từ hệ thống</p>
          </div>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <CheckCheck size={18} />
            Đánh dấu đọc tất cả
          </button>
        )}
      </div>

      <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Bell size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">Không có thông báo nào</h3>
            <p className="text-sm text-slate-500 mt-2">Bạn đã xem hết tất cả thông báo hiện tại.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 transition-colors flex gap-4 hover:bg-slate-800/30 ${!notification.isRead ? 'bg-slate-800/10' : 'opacity-70'}`}
              >
                <div className="mt-1">
                  <div className={`w-3 h-3 rounded-full ${!notification.isRead ? 'bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.6)]' : 'bg-slate-700'}`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-base ${!notification.isRead ? 'font-semibold text-slate-200' : 'font-medium text-slate-400'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </span>
                  </div>
                  <p className={`text-sm mb-3 ${!notification.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                    {notification.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(notification.type)}`}>
                      {notification.type === 1 ? 'Thành công' : notification.type === 2 ? 'Cảnh báo' : notification.type === 3 ? 'Lỗi' : 'Thông tin'}
                    </span>
                    {!notification.isRead && (
                      <button 
                        onClick={() => markReadMutation.mutate(notification.id)}
                        disabled={markReadMutation.isPending}
                        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-medium"
                      >
                        <Check size={14} />
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
