import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, MapPin, Phone, Mail, Building, LayoutGrid, Package, Lock } from 'lucide-react';
import { masterDataApi } from '@/api/masterDataApi';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { DataTable } from '@/components/DataTable/DataTable';
import type { Location } from '@/types/masterData';

const WarehouseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pageIndex, setPageIndex] = useState(1);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => masterDataApi.getWarehouseById(Number(id)),
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['warehouse-summary', id],
    queryFn: () => masterDataApi.getWarehouseSummary(Number(id)),
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations', { warehouseId: id }, pageIndex],
    queryFn: () => masterDataApi.getLocations({ warehouseId: id, pageIndex, pageSize: 10 }),
    enabled: activeTab === 'locations'
  });

  if (isLoading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Đang tải thông tin kho...</div>;
  }

  if (!warehouse) {
    return <div className="p-8 text-center text-danger">Không tìm thấy kho!</div>;
  }

  const columns = [
    { header: 'Mã Vị trí', accessorKey: 'code' as keyof Location, className: 'font-mono text-primary font-medium' },
    { header: 'Zone', accessorKey: 'zone' as keyof Location },
    { header: 'Aisle', accessorKey: 'aisle' as keyof Location },
    { header: 'Rack', accessorKey: 'rack' as keyof Location },
    { header: 'Bin', accessorKey: 'bin' as keyof Location },
    { header: 'Chứa (Kg)', accessorKey: 'currentWeightKg' as keyof Location, className: 'text-right' },
    { header: 'Sức chứa (Kg)', accessorKey: 'maxWeightKg' as keyof Location, className: 'text-right' },
    { header: 'Đã chiếm dụng', cell: (item: Location) => item.isOccupied ? <span className="text-warning font-medium">Có</span> : <span className="text-success font-medium">Trống</span> },
    { header: 'Trạng thái', cell: (item: Location) => <StatusBadge status={item.status === 1 || item.status === 'Active' ? 'Active' : 'Inactive'} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/master-data/warehouses')}
            className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{warehouse.name}</h1>
              <StatusBadge status={warehouse.isActive ? 'Active' : 'Inactive'} />
              {warehouse.type === 1 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">Main</span>}
              {warehouse.type === 2 && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium border border-orange-200">Branch</span>}
            </div>
            <p className="text-sm text-text-secondary mt-1 font-mono">
              {warehouse.code}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/master-data/warehouses/${warehouse.id}/edit`)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          <Edit size={18} /> Chỉnh sửa
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Tổng quan
        </button>
        <button 
          onClick={() => setActiveTab('locations')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'locations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Sơ đồ / Vị trí
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building size={16} /> Thông tin địa chỉ
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2">
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><MapPin size={14} /> Địa chỉ chi tiết</p>
                  <p className="text-sm font-medium text-text-primary">{[warehouse.address, warehouse.province, warehouse.city, warehouse.country].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><Phone size={14} /> Điện thoại</p>
                  <p className="text-sm font-medium text-text-primary">{warehouse.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><Mail size={14} /> Email</p>
                  <p className="text-sm font-medium text-text-primary">{warehouse.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Diện tích (m2)</p>
                  <p className="text-sm font-medium text-text-primary">{warehouse.totalAreaM2 ? warehouse.totalAreaM2.toLocaleString() : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Quản lý kho</p>
                  <p className="text-sm font-medium text-text-primary">{warehouse.managerName || 'Chưa chỉ định'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Thống kê Vị trí (Summary)</h3>
              {isLoadingSummary ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-primary/10 rounded w-1/2"></div>
                  <div className="h-10 bg-primary/10 rounded w-1/2"></div>
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-primary/70">Tổng vị trí</p>
                      <p className="text-xl font-bold text-primary">{summary.totalLocations}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-success/70">Vị trí Active</p>
                      <p className="text-xl font-bold text-success">{summary.activeLocations}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                      <Lock size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-danger/70">Vị trí bị khóa</p>
                      <p className="text-xl font-bold text-danger">{summary.lockedLocations}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Không có dữ liệu thống kê.</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
               <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Tồn kho</h3>
               <div>
                  <p className="text-sm text-text-muted mb-1">Tổng sản phẩm (Số lượng)</p>
                  <p className="text-3xl font-bold text-text-primary">{summary?.totalStockQuantity || 0}</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-medium text-text-primary">Danh sách Vị trí trong kho</h2>
            <button 
              onClick={() => navigate('/master-data/locations/create?warehouseId=' + warehouse.id)}
              className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              + Tạo vị trí mới
            </button>
          </div>
          <DataTable
            columns={columns}
            data={locationsData?.items || []}
            pageIndex={pageIndex}
            pageSize={10}
            totalCount={locationsData?.totalCount || 0}
            onPageChange={setPageIndex}
            isLoading={isLoadingLocations}
          />
        </div>
      )}

    </div>
  );
};

export default WarehouseDetailPage;
