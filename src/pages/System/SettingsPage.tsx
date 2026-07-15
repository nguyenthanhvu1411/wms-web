import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemApi } from '@/api/systemApi';
import { Settings, Save, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SystemSetting } from '@/types/system';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => systemApi.getSettings(),
  });

  const settings = response || [];

  const updateSettingMutation = useMutation({
    mutationFn: (data: { key: string, value: string }) => systemApi.updateSetting(data.key, { value: data.value }),
    onSuccess: () => {
      toast.success('Lưu cấu hình thành công');
      setEditingKey(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast.error('Không thể lưu cấu hình')
  });

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value || setting.defaultValue || '');
  };

  const handleSave = (key: string) => {
    updateSettingMutation.mutate({ key, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
  };

  // Group settings by groupName
  const groupedSettings = settings.reduce((acc, setting) => {
    const group = setting.groupName || 'Chung';
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Settings size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cấu hình Hệ thống</h1>
          <p className="text-sm text-text-secondary mt-1">Quản lý các tham số hoạt động chung của phần mềm</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          Đang tải cấu hình...
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          Không có dữ liệu cấu hình
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([groupName, items]) => (
            <div key={groupName} className="bg-surface border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-slate-200">{groupName}</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {items.map((setting) => (
                  <div key={setting.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {setting.key}
                        </span>
                        {!setting.isEditable && (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                            Chỉ Đọc
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{setting.description || 'Không có mô tả'}</p>
                      
                      {editingKey === setting.key ? (
                        <div className="mt-3 max-w-lg flex gap-2">
                          <input 
                            type="text" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            autoFocus
                            placeholder={setting.defaultValue}
                          />
                          <button 
                            onClick={() => handleSave(setting.key)}
                            disabled={updateSettingMutation.isPending}
                            className="bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Lưu"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={handleCancel}
                            disabled={updateSettingMutation.isPending}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                            title="Hủy"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-base font-medium text-slate-200">
                            {setting.value || setting.defaultValue || <span className="text-slate-500 italic">Chưa thiết lập</span>}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {setting.isEditable && editingKey !== setting.key && (
                      <div className="flex-shrink-0 self-start md:self-center">
                        <button 
                          onClick={() => handleEdit(setting)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} /> Sửa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
