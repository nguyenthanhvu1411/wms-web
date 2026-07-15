import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/api/masterDataApi';
import { DataTable } from '@/components/DataTable/DataTable';
import { AdvancedFilter } from '@/components/AdvancedFilter/AdvancedFilter';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Plus, Edit, Eye, Power, PowerOff, Download, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import type { Product } from '@/types/masterData';
import toast from 'react-hot-toast';

const ProductListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => masterDataApi.getCategories({ pageIndex: 1, pageSize: 100 }),
  });

  const { data: productStatusesData } = useQuery({
    queryKey: ['productStatuses'],
    queryFn: () => masterDataApi.getProductStatuses(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', pageIndex, pageSize, searchTerm, statusFilter, categoryFilter],
    queryFn: () => masterDataApi.getProducts({
      pageIndex,
      pageSize,
      search: searchTerm,
      status: statusFilter,
      categoryId: categoryFilter || undefined
    }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (product: Product) => {
      if (product.status === 1 || (product.status as unknown as string) === 'Active') {
        return masterDataApi.discontinueProduct(product.id);
      }
      return masterDataApi.activateProduct(product.id);
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái')
  });

  const handleExport = async () => {
    try {
      const blob = await masterDataApi.exportProducts({
        search: searchTerm,
        status: statusFilter,
        categoryId: categoryFilter || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Products_Export_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Lỗi khi xuất file Excel: ' + (error?.message || error));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await masterDataApi.downloadProductTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Product_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Lỗi khi tải bản mẫu: ' + (error?.message || error));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const toastId = toast.loading('Đang xử lý file import...');
      const res = await masterDataApi.importProducts(file);
      toast.dismiss(toastId);

      if (res.data?.errors?.length > 0) {
        toast.error(`Import ${res.data.successCount} thành công. Cảnh báo: ${res.data.errors.length} lỗi. Vui lòng xem logs.`);
        console.warn('Import Errors:', res.data.errors);
      } else {
        toast.success(`Import thành công ${res.data?.successCount || 0} sản phẩm!`);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Lỗi khi import file Excel');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const columns = [
    {
      header: 'SKU',
      accessorKey: 'sku' as keyof Product,
      className: 'font-mono text-primary font-medium',
    },
    {
      header: 'Tên Sản Phẩm',
      cell: (item: Product) => (
        <div>
          <p className="font-medium text-text-primary">{item.name}</p>
          <p className="text-xs text-text-muted mt-0.5">{item.categoryName}</p>
        </div>
      ),
    },
    {
      header: 'ĐVT',
      accessorKey: 'uomName' as keyof Product,
    },
    {
      header: 'Giá Bán',
      cell: (item: Product) => (
        <span className="font-medium text-text-primary">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.salePrice)}
        </span>
      ),
    },
    {
      header: 'Quản lý kho',
      cell: (item: Product) => (
        <div className="flex gap-1">
          {item.trackLot && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">LOT</span>}
          {item.trackSerialNumber && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">SN</span>}
          {item.trackExpiry && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">EXP</span>}
          {!item.trackLot && !item.trackSerialNumber && !item.trackExpiry && <span className="text-text-muted text-xs">-</span>}
        </div>
      )
    },
    {
      header: 'Trạng Thái',
      cell: (item: Product) => {
        const backendStatus = String(item.status);
        const statusItem = productStatusesData?.find(s => String(s.id) === backendStatus);
        const text = statusItem?.name || 'Không xác định';

        let mappedStatus = 'Unknown';
        if (backendStatus === '1' || backendStatus === 'Active') mappedStatus = 'Active';
        else if (backendStatus === '2' || backendStatus === 'Discontinued') mappedStatus = 'Inactive';
        else if (backendStatus === '3' || backendStatus === 'Pending') mappedStatus = 'Pending';
        
        return <StatusBadge status={mappedStatus} text={text} />;
      },
    },
    {
      header: 'Thao Tác',
      className: 'text-right',
      cell: (item: Product) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/master-data/products/${item.id}`); }}
            className="p-1.5 text-info hover:bg-info/10 rounded transition-colors"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/master-data/products/${item.id}/edit`); }}
            className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors"
            title="Sửa"
          >
            <Edit size={18} />
          </button>
          {item.status === 1 || item.status === 'Active' ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(item); }}
              className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors"
              title="Ngừng KD"
            >
              <PowerOff size={18} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(item); }}
              className="p-1.5 text-success hover:bg-success/10 rounded transition-colors"
              title="Kích hoạt"
            >
              <Power size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Danh mục Sản phẩm</h1>
          <p className="text-text-secondary mt-1">Quản lý danh sách hàng hóa và vật tư trong hệ thống</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx"
            className="hidden"
          />
          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2 border border-slate-300"
            title="Tải bản mẫu (Template) có hướng dẫn để nhập dữ liệu"
          >
            <FileText size={18} />
            Bản Mẫu
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-success text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-success-hover transition-colors flex items-center gap-2"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={handleExport}
            className="bg-info text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-info-hover transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => navigate('/master-data/products/create')}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 ml-2"
          >
            <Plus size={18} />
            Thêm Sản Phẩm
          </button>
        </div>
      </div>

      <AdvancedFilter
        onSearch={setSearchTerm}
        onClear={() => {
          setSearchTerm('');
          setStatusFilter('');
          setCategoryFilter('');
        }}
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {productStatusesData?.map((status) => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Danh mục</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Tất cả</option>
            {categoriesData?.items?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </AdvancedFilter>

      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        isError={isError}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={data?.totalCount || 0}
        onPageChange={setPageIndex}
      />
    </div>
  );
};

export default ProductListPage;
