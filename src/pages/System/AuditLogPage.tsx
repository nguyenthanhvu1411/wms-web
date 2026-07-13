import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/api/systemApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { Eye } from 'lucide-react';
import type { AuditLog } from '@/types/system';

const AuditLogPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['auditLogs', pageIndex, searchTerm],
    queryFn: () => systemApi.getAuditLogs({ pageIndex, pageSize: 10, search: searchTerm }),
  });

  const auditLogs = useMemo(() => queryData?.items || [], [queryData]);
  const totalCount = queryData?.totalCount || 0;

  const columns = [
    { 
      header: 'Hành động', 
      cell: (item: AuditLog) => {
        const actionMap: Record<number, string> = { 1: 'Create', 2: 'Update', 3: 'Delete', 4: 'Read' };
        return <span className="font-medium text-text-primary">{actionMap[item.action] || 'Unknown'}</span>;
      }
    },
    { header: 'Thực thể', accessorKey: 'entityName' as keyof AuditLog },
    { header: 'ID', accessorKey: 'entityId' as keyof AuditLog },
    { header: 'User', accessorKey: 'userName' as keyof AuditLog },
    { header: 'IP', accessorKey: 'ipAddress' as keyof AuditLog },
    { header: 'Thời gian', accessorKey: 'occurredAt' as keyof AuditLog, cell: (item: AuditLog) => new Date(item.occurredAt).toLocaleString('vi-VN') },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: () => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-info hover:bg-info/10 rounded transition-colors" title="Xem thay đổi (JSON)"><Eye size={18} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Audit Logs (Nhật ký hệ thống)</h1></div>
      </div>
      <AdvancedFilter onSearch={setSearchTerm} onClear={() => setSearchTerm('')} />
      <DataTable columns={columns} data={auditLogs} pageIndex={pageIndex} pageSize={10} totalCount={totalCount} onPageChange={setPageIndex} isLoading={isLoading} />
    </div>
  );
};
export default AuditLogPage;
