import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '@/api/reportsApi';
import { masterDataApi } from '@/api/masterDataApi';
import {
  BarChart3,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  ShoppingCart,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
const toDate = new Date().toISOString().substring(0, 10);

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  onClick?: () => void;
}) => (
  <div
    className={`bg-white border border-border rounded-xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-text-primary mt-1 font-mono">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
    {onClick && <ChevronRight size={16} className="text-slate-400 mt-1 flex-shrink-0" />}
  </div>
);

const ReportLinkCard = ({
  icon: Icon,
  title,
  description,
  path,
  badge,
  badgeColor = 'bg-red-100 text-red-700',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  badge?: string | number;
  badgeColor?: string;
}) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(path)}
      className="bg-white border border-border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors">
          <Icon size={20} className="text-slate-600 group-hover:text-primary transition-colors" />
        </div>
        {badge !== undefined && badge !== null && Number(badge) > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-bold text-text-primary text-sm mb-1">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
};

const ReportsDashboardPage = () => {
  const navigate = useNavigate();

  const { data: kpiData } = useQuery({
    queryKey: ['reports', 'kpi', 'dashboard', fromDate, toDate],
    queryFn: () => reportsApi.getKpi({ fromDate, toDate, page: 1, pageSize: 50 }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['reports', 'low-stock', 'count'],
    queryFn: () => reportsApi.getLowStock({ page: 1, pageSize: 1 }),
  });

  const { data: expiryData } = useQuery({
    queryKey: ['reports', 'expiry', 'count'],
    queryFn: () => reportsApi.getExpiry({ page: 1, pageSize: 1 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'select'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });

  const { data: inboundData } = useQuery({
    queryKey: ['reports', 'inbound', 'count', fromDate, toDate],
    queryFn: () => reportsApi.getInbound({ fromDate, toDate, page: 1, pageSize: 1 }),
  });

  const { data: outboundData } = useQuery({
    queryKey: ['reports', 'outbound', 'count', fromDate, toDate],
    queryFn: () => reportsApi.getOutbound({ fromDate, toDate, page: 1, pageSize: 1 }),
  });

  const kpiItems = kpiData?.items || [];
  const lowStockCount = lowStockData?.totalItems ?? 0;
  const expiryCount = expiryData?.totalItems ?? 0;
  const warehouseCount = warehousesData?.items?.length ?? 0;

  // Aggregate stock value from KPI items (which are InventoryKpiResponse)
  const totalStockValue = kpiItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  const stockValue = totalStockValue > 0 
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalStockValue)
    : '—';

  // Use the totalItems (number of transactions) for inbound/outbound
  const totalInbound = inboundData?.totalItems ? `${inboundData.totalItems} phiếu` : '—';
  const totalOutbound = outboundData?.totalItems ? `${outboundData.totalItems} đơn` : '—';

  const reportLinks = [
    {
      icon: Package,
      title: 'Báo cáo tồn kho',
      description: 'Xem chi tiết tồn kho theo kho, vị trí, sản phẩm và lô hàng',
      path: '/reports/inventory',
    },
    {
      icon: ArrowDownToLine,
      title: 'Báo cáo nhập/xuất kho',
      description: 'Lịch sử giao dịch hàng hóa nhập vào và xuất ra theo phân hệ',
      path: '/reports/inbound-outbound',
    },
    {
      icon: AlertTriangle,
      title: 'Cảnh báo Low Stock',
      description: 'Danh sách hàng tồn kho dưới mức tối thiểu cần bổ sung',
      path: '/reports/low-stock',
      badge: lowStockCount,
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      icon: Clock,
      title: 'Hàng sắp hết hạn',
      description: 'Danh sách hàng hóa sắp đến hạn sử dụng cần xử lý',
      path: '/reports/expiry',
      badge: expiryCount,
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      icon: ShoppingCart,
      title: 'Hiệu suất nhà cung cấp',
      description: 'Đánh giá chất lượng giao hàng và đúng hạn của nhà cung cấp',
      path: '/reports/supplier-performance',
    },
    {
      icon: ClipboardCheck,
      title: 'Chênh lệch kiểm kê',
      description: 'Báo cáo sai lệch giữa tồn kho thực tế và hệ thống sau kiểm kê',
      path: '/reports/cycle-count-variance',
    },
    {
      icon: TrendingUp,
      title: 'Phân tích ABC',
      description: 'Phân loại hàng hóa theo giá trị doanh thu: A (cao), B (trung), C (thấp)',
      path: '/reports/abc-analysis',
    },
    {
      icon: BarChart3,
      title: 'KPI kho hàng',
      description: 'Theo dõi các chỉ tiêu hiệu suất hoạt động kho theo kỳ',
      path: '/reports/kpi',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Tổng quan Báo cáo Kho
          </h1>
          <p className="text-text-secondary mt-1">
            Theo dõi tình hình nhập – xuất – tồn kho và KPI hoạt động. Cập nhật lúc{' '}
            <span className="font-medium text-text-primary">{format(new Date(), 'HH:mm, dd/MM/yyyy')}</span>
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Số kho đang hoạt động"
          value={warehouseCount}
          sub="Kho hàng trong hệ thống"
          color="bg-blue-500"
          onClick={() => navigate('/master-data/warehouses')}
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Tổng nhập kho (tháng này)"
          value={totalInbound}
          sub={`Từ ${format(new Date(fromDate), 'dd/MM')} – ${format(new Date(toDate), 'dd/MM/yyyy')}`}
          color="bg-emerald-500"
          onClick={() => navigate('/reports/inbound-outbound')}
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Tổng xuất kho (tháng này)"
          value={totalOutbound}
          sub={`Từ ${format(new Date(fromDate), 'dd/MM')} – ${format(new Date(toDate), 'dd/MM/yyyy')}`}
          color="bg-violet-500"
          onClick={() => navigate('/reports/inbound-outbound')}
        />
        <StatCard
          icon={TrendingUp}
          label="Giá trị tồn kho"
          value={stockValue}
          sub="Tính theo giá vốn hiện tại"
          color="bg-amber-500"
          onClick={() => navigate('/reports/inventory')}
        />
      </div>

      {/* Alert Strip */}
      {(lowStockCount > 0 || expiryCount > 0) && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {lowStockCount > 0 && (
            <div
              className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => navigate('/reports/low-stock')}
            >
              <AlertTriangle size={16} />
              <span>{lowStockCount} mặt hàng dưới mức tối thiểu</span>
              <ChevronRight size={14} />
            </div>
          )}
          {expiryCount > 0 && (
            <div
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => navigate('/reports/expiry')}
            >
              <Clock size={16} />
              <span>{expiryCount} mặt hàng sắp hết hạn</span>
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      )}

      {/* Report Grid */}
      <div>
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">
          Các loại báo cáo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportLinks.map((link) => (
            <ReportLinkCard key={link.path} {...link} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboardPage;
