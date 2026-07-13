import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, FileX } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isError?: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onRowClick,
  emptyMessage = 'Không có dữ liệu',
  className
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`bg-card rounded-2xl border border-border shadow-sm flex flex-col w-full overflow-hidden ${className || ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-background border-b border-border sticky top-0">
            <tr>
              <th className="px-6 py-4 font-semibold w-16 text-center">STT</th>
              {columns.map((col, index) => (
                <th key={index} className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-full max-w-[120px]"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-danger">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileX size={32} />
                    <p className="font-medium">Có lỗi xảy ra khi tải dữ liệu.</p>
                    <button className="text-primary hover:underline text-sm mt-2">Thử lại</button>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={32} className="opacity-20" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-background/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-6 py-4 text-center text-text-muted font-medium">
                    {(pageIndex - 1) * pageSize + rowIndex + 1}
                  </td>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.cell 
                        ? col.cell(item) 
                        : col.accessorKey 
                          ? String(item[col.accessorKey] ?? '') 
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <div className="text-sm text-text-muted">
            Hiển thị <span className="font-medium text-text-primary">{(pageIndex - 1) * pageSize + 1}</span> đến{' '}
            <span className="font-medium text-text-primary">
              {Math.min(pageIndex * pageSize, totalCount)}
            </span>{' '}
            trong tổng số <span className="font-medium text-text-primary">{totalCount}</span> bản ghi
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pageIndex === 1}
              className="p-1.5 rounded hover:bg-background disabled:opacity-50 text-text-secondary"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex === 1}
              className="p-1.5 rounded hover:bg-background disabled:opacity-50 text-text-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = pageIndex - 2 + i;
                if (pageIndex <= 3) p = i + 1;
                else if (pageIndex >= totalPages - 2) p = totalPages - 4 + i;
                
                if (p > 0 && p <= totalPages) {
                  return (
                    <button
                      key={p}
                      onClick={() => onPageChange(p)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        pageIndex === p 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-background text-text-secondary'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex === totalPages}
              className="p-1.5 rounded hover:bg-background disabled:opacity-50 text-text-secondary"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={pageIndex === totalPages}
              className="p-1.5 rounded hover:bg-background disabled:opacity-50 text-text-secondary"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
