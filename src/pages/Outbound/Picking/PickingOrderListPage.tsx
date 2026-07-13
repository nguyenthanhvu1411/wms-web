import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePickingOrders, useAssignPickingOrder } from './hooks/usePickingOrders';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Eye, UserCheck } from 'lucide-react';
import { PickingOrderStatus, pickingOrderStatusLabel } from '@/types/wms-enums';
import type { PickingOrder } from '@/types/outbound';
import { format } from 'date-fns';
import { Modal, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/api/systemApi';

const PickingOrderListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [assignedUser, setAssignedUser] = useState<string>('');

  const { data: queryData, isLoading } = usePickingOrders({ page, pageSize: 10, search: searchTerm });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['system-users'],
    queryFn: () => systemApi.getUsers({ pageSize: 100 }),
  });
  const users = usersData?.items || [];

  const assignMutation = useAssignPickingOrder();

  const pickingOrders = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalItems || 0;

  const handleView = (id: number) => navigate(`/outbound/picking/${id}`);

  const handleAssignConfirm = () => {
    if (selectedOrderId) {
      assignMutation.mutate({
        id: selectedOrderId,
        data: { assignedTo: assignedUser || undefined }
      }, {
        onSuccess: () => {
          setAssignModalVisible(false);
          setSelectedOrderId(null);
          setAssignedUser('');
        }
      });
    }
  };

  const getStatusString = (status: number) => {
    switch(status) {
      case PickingOrderStatus.Assigned: return 'Pending';
      case PickingOrderStatus.InProgress: return 'InProgress';
      case PickingOrderStatus.Completed: return 'Completed';
      case PickingOrderStatus.Cancelled: return 'Cancelled';
      default: return 'Pending';
    }
  };

  const columns = [
    { header: 'Mã picking', accessorKey: 'pickingNumber' as keyof PickingOrder, className: 'font-mono text-primary font-medium' },
    { header: 'Đơn bán hàng', accessorKey: 'salesOrderNumber' as keyof PickingOrder, className: 'font-mono text-slate-600 font-medium text-xs' },
    { 
      header: 'Kho xuất',
      cell: (item: PickingOrder) => (
        <div>
          <div className="font-semibold text-slate-800">{item.warehouseCode}</div>
          {item.warehouseName && <div className="text-xs text-slate-400 font-normal">{item.warehouseName}</div>}
        </div>
      )
    },
    { 
      header: 'Người phụ trách',
      cell: (item: PickingOrder) => {
        const assignedUsername = item.assignedTo;
        if (!assignedUsername) return <span className="text-slate-400">-</span>;
        
        const userObj = users.find(u => {
          const uName = (u as any).username || u.userName;
          return uName?.toLowerCase() === assignedUsername.toLowerCase();
        });
        
        const fullName = userObj?.fullName || item.assignedToName || assignedUsername;
        
        return (
          <div>
            <div className="font-semibold text-slate-800">{fullName}</div>
            {assignedUsername && fullName !== assignedUsername && (
              <div className="text-xs text-slate-400 font-mono">{assignedUsername}</div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Ngày tạo',
      cell: (item: PickingOrder) => (
        <span className="text-slate-600 text-xs font-mono">
          {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
        </span>
      )
    },
    { 
      header: 'Tiến độ', 
      cell: (item: PickingOrder) => {
        const total = item.totalLines ?? item.lines?.length ?? 0;
        const picked = item.completedLines ?? item.lines?.filter(l => l.qtyPicked >= l.qtyToPick).length ?? 0;
        const progress = item.progressPercent ?? (total > 0 ? (picked / total) * 100 : 0);
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">{picked}/{total}</span>
          </div>
        );
      }
    },
    { 
      header: 'Trạng thái', 
      cell: (item: PickingOrder) => (
        <StatusBadge 
          status={getStatusString(item.status)} 
          text={pickingOrderStatusLabel[item.status as unknown as PickingOrderStatus]} 
        />
      )
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: PickingOrder) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => {
              setSelectedOrderId(item.id);
              setAssignedUser(item.assignedTo || '');
              setAssignModalVisible(true);
            }}
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Phân công người phụ trách"
          >
            <UserCheck size={18} />
          </button>
          <button 
            onClick={() => handleView(item.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors" title="Thực hiện nhặt hàng"
          >
            <Eye size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Lệnh Nhặt Hàng (Picking)</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý và thực hiện quá trình lấy hàng khỏi kho</p>
        </div>
      </div>

      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />

      <DataTable
        columns={columns}
        data={pickingOrders}
        pageIndex={page}
        pageSize={10}
        totalCount={totalCount}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <Modal
        title="Phân công người phụ trách"
        open={assignModalVisible}
        onOk={handleAssignConfirm}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedOrderId(null);
          setAssignedUser('');
        }}
        confirmLoading={assignMutation.isPending}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div className="py-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chọn nhân viên nhặt hàng</label>
          <Select
            className="w-full"
            placeholder="Chọn nhân viên"
            value={assignedUser || undefined}
            onChange={value => setAssignedUser(value)}
            allowClear
            loading={isLoadingUsers}
            optionLabelProp="label"
            options={users.map(u => {
              const usernameVal = (u as any).username || u.userName;
              return {
                value: usernameVal,
                label: u.fullName || usernameVal,
              };
            })}
            optionRender={(option) => {
              const userObj = users.find(u => ((u as any).username || u.userName) === option.value);
              return (
                <div className="flex flex-col py-0.5">
                  <span className="font-medium text-slate-800">{userObj?.fullName || option.value}</span>
                  <span className="text-xs text-slate-400 font-mono">{option.value}</span>
                </div>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PickingOrderListPage;



