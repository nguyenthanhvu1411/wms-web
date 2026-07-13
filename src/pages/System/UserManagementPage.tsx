import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/api/systemApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Lock, Unlock } from 'lucide-react';
import type { User } from '@/types/system';

const UserManagementPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['users', pageIndex, searchTerm],
    queryFn: () => systemApi.getUsers({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const users = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const columns = [
    { header: 'Username', accessorKey: 'userName' as keyof User, className: 'font-mono text-primary font-medium' },
    { header: 'Họ tên', accessorKey: 'fullName' as keyof User, className: 'font-medium text-text-primary' },
    { header: 'Email', accessorKey: 'email' as keyof User },
    { header: 'Vai trò', cell: (item: User) => item.roles?.join(', ') || '' },
    { header: 'Đăng nhập cuối', accessorKey: 'lastLoginAt' as keyof User, cell: (item: User) => item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('vi-VN') : '-' },
    { header: 'Khóa', cell: (item: User) => item.isLocked ? <span className="text-danger font-medium">Đã khóa</span> : <span className="text-success font-medium">Bình thường</span> },
    { header: 'Trạng thái', cell: (item: User) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} /> },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors" title="Sửa"><Edit size={18} /></button>
          {item.isLocked ? (
              <button className="p-1.5 text-success hover:bg-success/10 rounded transition-colors" title="Mở khóa"><Unlock size={18} /></button>
          ) : (
              <button className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors" title="Khóa"><Lock size={18} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Quản lý người dùng</h1></div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Thêm User
        </button>
      </div>
      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />
      <DataTable columns={columns} data={users} pageIndex={pageIndex} pageSize={10} totalCount={totalCount} onPageChange={setPageIndex} isLoading={isLoading} />
    </div>
  );
};
export default UserManagementPage;
