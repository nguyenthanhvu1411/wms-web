import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCycleCount, useCreateCycleCount, useUpdateCycleCount } from './hooks/useCycleCounts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { systemApi } from '@/api/systemApi';
import { ArrowLeft, Save, X } from 'lucide-react';
import { message, Spin, Popconfirm, Select, DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import type { CreateCycleCountRequest } from '@/types/operations';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { CycleCountStatus, cycleCountStatusLabel } from '@/types/wms-enums';

const methodLabel: Record<number, string> = {
  1: 'Theo hệ thống (System-guided)',
  2: 'Theo người dùng (User-guided)',
  3: 'Toàn bộ kho (Full Count)',
  4: 'Chọn lọc (Spot Check)',
};

const getStatusKey = (status: CycleCountStatus): string => {
  const found = Object.entries(CycleCountStatus).find(([, v]) => v === status);
  return found ? found[0] : 'Draft';
};

const CycleCountFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: cycleCountData, isLoading } = useCycleCount(isEditing ? Number(id) : 0);
  const createMutation = useCreateCycleCount();
  const updateMutation = useUpdateCycleCount();

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CreateCycleCountRequest>>({
    warehouseId: 0,
    method: 1,
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    locationIds: [],
  });
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Warehouses from API
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  // Users from API
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => systemApi.getUsers({ pageSize: 100 }),
  });
  const users = usersData?.items?.filter(u => u.isActive) || [];

  // Locations filtered by selected warehouse
  const { data: locationsData } = useQuery({
    queryKey: ['locations', formData.warehouseId],
    queryFn: () =>
      masterDataApi.getLocations({
        warehouseId: formData.warehouseId,
        pageSize: 500,
      }),
    enabled: !!formData.warehouseId,
  });
  const locations = locationsData?.items || [];

  useEffect(() => {
    if (isEditing && cycleCountData) {
      setFormData({
        warehouseId: cycleCountData.warehouseId,
        method: cycleCountData.method,
        assignedTo: cycleCountData.assignedTo,
        scheduledDate: cycleCountData.scheduledDate ? cycleCountData.scheduledDate.substring(0, 10) : dayjs().format('YYYY-MM-DD'),
        notes: cycleCountData.notes,
        locationIds: [],
      });
    }
  }, [isEditing, cycleCountData]);

  const handleCancel = () => {
    // Check if form has data
    const isDirty = formData.warehouseId || formData.assignedTo || formData.notes || selectedLocationIds.length > 0;
    if (isDirty) {
      Modal.confirm({
        title: 'Xác nhận',
        content: 'Dữ liệu chưa lưu sẽ bị mất, bạn có chắc muốn thoát?',
        okText: 'Có, thoát',
        cancelText: 'Không',
        onOk: () => navigate('/cycle-counts'),
      });
    } else {
      navigate('/cycle-counts');
    }
  };

  const handleSave = (isDraft: boolean = false) => {
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    // Validation
    if (!isDraft) {
      if (!formData.warehouseId) {
        newErrors.warehouseId = 'Vui lòng chọn kho kiểm kê';
        hasError = true;
      }
      if (!formData.method) {
        newErrors.method = 'Vui lòng chọn phương thức kiểm kê';
        hasError = true;
      }
      if (!formData.assignedTo) {
        newErrors.assignedTo = 'Vui lòng chọn người phụ trách';
        hasError = true;
      }
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Vui lòng chọn ngày lên lịch';
        hasError = true;
      }
      if (formData.method !== 3 && selectedLocationIds.length === 0) {
        newErrors.locations = 'Vui lòng chọn ít nhất 1 vị trí kiểm kê đối với phương thức này';
        hasError = true;
      }
    } else {
      if (!formData.warehouseId) {
        newErrors.warehouseId = 'Cần ít nhất kho kiểm kê để lưu nháp';
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      message.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const payload: CreateCycleCountRequest = {
      ...(formData as CreateCycleCountRequest),
      locationIds: selectedLocationIds.length > 0 ? selectedLocationIds : undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(id), data: payload as any }, {
        onSuccess: () => {
          message.success('Cập nhật lịch kiểm kê thành công');
          queryClient.invalidateQueries({ queryKey: ['cycleCounts'] });
          queryClient.invalidateQueries({ queryKey: ['cycleCountDetail'] });
          queryClient.invalidateQueries({ queryKey: ['stock'] });
          queryClient.invalidateQueries({ queryKey: ['locations'] });
          navigate(`/cycle-counts/${id}`);
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu phiếu');
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => {
          message.success(isDraft ? 'Lưu nháp thành công' : 'Tạo lịch kiểm kê thành công');
          queryClient.invalidateQueries({ queryKey: ['cycleCounts'] });
          queryClient.invalidateQueries({ queryKey: ['cycleCountDetail'] });
          queryClient.invalidateQueries({ queryKey: ['stock'] });
          queryClient.invalidateQueries({ queryKey: ['locations'] });
          navigate(`/cycle-counts/${data?.id || ''}`);
        },
        onError: (err: any) => {
          message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu');
        }
      });
    }
  };

  const updateField = (field: keyof CreateCycleCountRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Reset locations when warehouse changes
    if (field === 'warehouseId') {
      setSelectedLocationIds([]);
    }
  };

  const toggleLocation = (locId: number) => {
    setSelectedLocationIds(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
    if (errors.locations) {
      setErrors(prev => ({ ...prev, locations: '' }));
    }
  };

  if (isEditing && isLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const status = cycleCountData?.status as CycleCountStatus;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cycle-counts')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {isEditing ? `Phiếu kiểm kê: ${cycleCountData?.countNumber}` : 'Lên lịch kiểm kê mới'}
              </h1>
              {isEditing && status && (
                <StatusBadge
                  status={getStatusKey(status)}
                  text={cycleCountStatusLabel[status] || 'Không rõ'}
                />
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Quản lý phiên kiểm đếm đối chiếu tồn kho</p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              HỦY
            </button>
            <button
              onClick={() => handleSave(true)}
              className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              LƯU NHÁP
            </button>
            <Popconfirm
              title="Xác nhận tạo lịch kiểm kê kho?"
              onConfirm={() => handleSave(false)}
              okText="Đồng ý"
              cancelText="Hủy"
              placement="bottomRight"
            >
              <button
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? <Spin size="small" /> : <Save size={18} />}
                {isEditing ? 'CẬP NHẬT' : 'LÊN LỊCH KIỂM KÊ'}
              </button>
            </Popconfirm>
          </div>
        </div>
      </div>

      {/* Thông tin chung */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Thông tin chung</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kho kiểm kê <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-slate-100 ${errors.warehouseId ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary/50'}`}
              value={formData.warehouseId || ''}
              onChange={e => updateField('warehouseId', Number(e.target.value))}
              disabled={isEditing}
            >
              <option value="">-- Chọn kho --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
              ))}
            </select>
            {errors.warehouseId && <p className="text-red-500 text-xs mt-1">{errors.warehouseId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phương thức kiểm kê</label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.method ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary/50'}`}
              value={formData.method || 1}
              onChange={e => updateField('method', Number(e.target.value))}
            >
              {Object.entries(methodLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {errors.method && <p className="text-red-500 text-xs mt-1">{errors.method}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Người phụ trách <span className="text-red-500">*</span>
            </label>
            <Select
              showSearch
              placeholder="Tìm theo mã hoặc tên nhân viên"
              className={`w-full h-[42px] ${errors.assignedTo ? 'border-red-500 ant-select-error' : ''}`}
              loading={isLoadingUsers}
              value={formData.assignedTo || undefined}
              onChange={(value) => updateField('assignedTo', value)}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((u: any) => ({
                value: u.id?.toString(),
                label: `${u.employeeCode || u.code || u.userCode || u.userName} - ${u.fullName || u.name || u.displayName || u.userName}`
              }))}
            />
            {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngày lên lịch <span className="text-red-500">*</span>
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              className={`w-full h-[42px] ${errors.scheduledDate ? 'border-red-500 ant-picker-error' : ''}`}
              value={formData.scheduledDate ? dayjs(formData.scheduledDate) : null}
              onChange={(date) => updateField('scheduledDate', date ? date.format('YYYY-MM-DD') : '')}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
            {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
              placeholder="Nhập ghi chú thêm..."
              value={formData.notes || ''}
              onChange={e => updateField('notes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh sách vị trí */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-800">Danh sách vị trí kiểm kê</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedLocationIds.length > 0
                ? `Đã chọn ${selectedLocationIds.length} vị trí`
                : 'Không chọn = kiểm toàn bộ kho'}
            </p>
          </div>
          {selectedLocationIds.length > 0 && (
            <button
              onClick={() => setSelectedLocationIds([])}
              className="text-red-500 text-sm hover:underline flex items-center gap-1"
            >
              <X size={14} /> Bỏ chọn tất cả
            </button>
          )}
        </div>
        <div className="p-6">
          {!formData.warehouseId ? (
            <p className="text-slate-400 text-sm text-center py-8">Chọn kho để xem danh sách vị trí</p>
          ) : locations.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Không có vị trí nào trong kho này</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {locations.map(loc => (
                <label
                  key={loc.id}
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                    selectedLocationIds.includes(loc.id)
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={selectedLocationIds.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                  />
                  <span className="font-mono">{loc.code}</span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2 flex-wrap">
            {selectedLocationIds.map(locId => {
              const loc = locations.find(l => l.id === locId);
              return loc ? (
                <span key={locId} className="bg-primary/10 text-primary text-xs font-mono px-2 py-1 rounded flex items-center gap-1">
                  {loc.code}
                  <button onClick={() => toggleLocation(locId)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
          {errors.locations && <p className="text-red-500 text-sm mt-3">{errors.locations}</p>}
        </div>
      </div>

      <div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            HỦY
          </button>
          <button
            onClick={() => handleSave(true)}
            className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            LƯU NHÁP
          </button>
          <Popconfirm
            title="Xác nhận tạo lịch kiểm kê kho?"
            onConfirm={() => handleSave(false)}
            okText="Đồng ý"
            cancelText="Hủy"
            placement="topLeft"
          >
            <button
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? <Spin size="small" /> : <Save size={18} />}
              {isEditing ? 'CẬP NHẬT' : 'LÊN LỊCH KIỂM KÊ'}
            </button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
};

export default CycleCountFormPage;
