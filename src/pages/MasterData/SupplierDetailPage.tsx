import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Building2, MapPin, Mail, Phone, CreditCard } from 'lucide-react';
import { masterDataApi } from '@/api/masterDataApi';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { DataTable } from '@/components/DataTable/DataTable';
import type { SupplierProduct } from '@/types/masterData';

const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [pageIndex, setPageIndex] = useState(1);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => masterDataApi.getSupplierById(Number(id)),
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['supplier-products', id, pageIndex],
    queryFn: () => masterDataApi.getSupplierProducts(Number(id), { pageIndex, pageSize: 10 }),
    enabled: activeTab === 'products'
  });

  if (isLoading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Đang tải thông tin...</div>;
  }

  if (!supplier) {
    return <div className="p-8 text-center text-danger">Không tìm thấy nhà cung cấp!</div>;
  }

  const columns = [
    { header: 'Mã SP NCC', accessorKey: 'supplierSku' as keyof SupplierProduct, className: 'font-mono text-primary font-medium' },
    { header: 'Tên Sản phẩm', accessorKey: 'productName' as keyof SupplierProduct, className: 'font-medium' },
    { header: 'Giá mua gần nhất', accessorKey: 'lastPurchasePrice' as keyof SupplierProduct, className: 'text-right' },
    { header: 'Lead Time (Ngày)', accessorKey: 'leadTimeDays' as keyof SupplierProduct, className: 'text-right' },
    { header: 'Ưu tiên', cell: (item: SupplierProduct) => item.isPreferred ? <span className="text-success font-medium">Có</span> : <span className="text-muted">Không</span> },
    { header: 'Trạng thái', cell: (item: SupplierProduct) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/master-data/suppliers')}
            className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{supplier.name}</h1>
              <StatusBadge status={supplier.isActive ? 'Active' : 'Inactive'} />
            </div>
            <p className="text-sm text-text-secondary mt-1 font-mono">
              {supplier.code}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/master-data/suppliers/${supplier.id}/edit`)}
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
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Sản phẩm cung cấp
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 size={16} /> Thông tin liên hệ
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-text-muted mb-1">Người liên hệ</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.contactPerson || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><Phone size={14} /> Điện thoại</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><Mail size={14} /> Email</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Mã số thuế</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.taxCode || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-text-muted mb-1 flex items-center gap-1"><MapPin size={14} /> Địa chỉ</p>
                  <p className="text-sm font-medium text-text-primary">{[supplier.address, supplier.city, supplier.country].filter(Boolean).join(', ') || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Tài chính & Thanh toán
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-text-muted mb-1">Kỳ hạn thanh toán</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.paymentTermsDays} ngày</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Tiền tệ</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Hạn mức tín dụng</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.creditLimit?.toLocaleString()} {supplier.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Tài khoản ngân hàng</p>
                  <p className="text-sm font-medium text-text-primary">{supplier.bankAccount || '—'}</p>
                  <p className="text-xs text-text-muted mt-0.5">{supplier.bankName || ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Thống kê mua hàng</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-primary/70 mb-1">Đơn mua hàng (PO)</p>
                  <p className="text-2xl font-bold text-primary">{supplier.purchaseOrderCount}</p>
                </div>
                <div>
                  <p className="text-sm text-primary/70 mb-1">Sản phẩm cung cấp</p>
                  <p className="text-2xl font-bold text-primary">{supplier.supplierProductCount}</p>
                </div>
                <div>
                  <p className="text-sm text-primary/70 mb-1">Đánh giá sao</p>
                  <p className="text-lg font-medium text-warning">{'★'.repeat(supplier.rating)}{'☆'.repeat(5 - supplier.rating)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={productsData?.items || []}
            pageIndex={pageIndex}
            pageSize={10}
            totalCount={productsData?.totalCount || 0}
            onPageChange={setPageIndex}
            isLoading={isLoadingProducts}
          />
        </div>
      )}

    </div>
  );
};

export default SupplierDetailPage;
