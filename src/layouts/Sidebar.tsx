import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Package, 
  Repeat2, 
  Settings, 
  ChevronDown,
  Undo2,
  ClipboardCheck,
  CircleDollarSign,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  children?: { title: string; path: string }[];
};

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Master Data',
    path: '/master-data',
    icon: Database,
    children: [
      { title: 'Sản phẩm', path: '/master-data/products' },
      { title: 'Danh mục', path: '/master-data/categories' },
      { title: 'Đơn vị tính', path: '/master-data/uoms' },
      { title: 'Nhà cung cấp', path: '/master-data/suppliers' },
      { title: 'Kho', path: '/master-data/warehouses' },
      { title: 'Vị trí', path: '/master-data/locations' },
    ],
  },
  {
    title: 'Nhập kho',
    path: '/inbound',
    icon: ArrowDownToLine,
    children: [
      { title: 'Đơn mua hàng PO', path: '/inbound/purchase-orders' },
      { title: 'ASN', path: '/inbound/asns' },
      { title: 'Phiếu nhận hàng GR', path: '/inbound/goods-receipts' },
      { title: 'Kiểm tra chất lượng QC', path: '/inbound/quality-checks' },
      { title: 'Putaway', path: '/inbound/putaway-tasks' },
    ],
  },
  {
    title: 'Tồn kho',
    path: '/stock',
    icon: Package,
    children: [
      { title: 'Tồn kho hiện tại', path: '/stock/balance' },
      { title: 'Giao dịch kho', path: '/stock/transactions' },
      { title: 'Nhập tồn đầu kỳ', path: '/stock/opening' },
      { title: 'Điều chỉnh tồn', path: '/stock/adjustments' },
      { title: 'Low Stock', path: '/stock/low-stock' },
      { title: 'Expiry Alert', path: '/stock/expiry-alert' },
      { title: 'Lot', path: '/stock/lots' },
      { title: 'Serial', path: '/stock/serials' },
    ],
  },
  {
    title: 'Xuất kho',
    path: '/outbound',
    icon: ArrowUpFromLine,
    children: [
      { title: 'Đơn bán hàng', path: '/outbound/sales-orders' },
      { title: 'Nhặt hàng', path: '/outbound/picking' },
      { title: 'Đóng gói / Giao hàng', path: '/outbound/shipping' },
    ],
  },
  {
    title: 'Trả hàng',
    path: '/returns',
    icon: Undo2,
    children: [
      { title: 'Khách trả hàng', path: '/returns/customer' },
      { title: 'Trả hàng nhà cung cấp', path: '/returns/vendor' },
    ]
  },
  {
    title: 'Chuyển hàng',
    path: '/transfers',
    icon: Repeat2,
  },
  {
    title: 'Kiểm kê kho',
    path: '/cycle-counts',
    icon: ClipboardCheck,
  },
  {
    title: 'Tài chính',
    path: '/finance',
    icon: CircleDollarSign,
    children: [
      { title: 'Hóa đơn nhà cung cấp', path: '/finance/invoices' },
      { title: 'Đối chiếu ba bề', path: '/finance/matches' },
      { title: 'Yêu cầu thanh toán', path: '/finance/payments' },
    ]
  },
  {
    title: 'Báo cáo',
    path: '/reports',
    icon: BarChart3,
    children: [
      { title: 'Tổng quan báo cáo', path: '/reports/dashboard' },
      { title: 'Tồn kho', path: '/reports/inventory' },
      { title: 'Nhập/Xuất kho', path: '/reports/inbound-outbound' },
      { title: 'Cảnh báo Low Stock', path: '/reports/low-stock' },
      { title: 'Hàng sắp hết hạn', path: '/reports/expiry' },
      { title: 'Nhà cung cấp', path: '/reports/supplier-performance' },
      { title: 'Chênh lệch kiểm kê', path: '/reports/cycle-count-variance' },
      { title: 'Phân tích ABC', path: '/reports/abc-analysis' },
      { title: 'KPI kho hàng', path: '/reports/kpi' },
    ]
  },
  {
    title: 'Hệ thống',
    path: '/system',
    icon: Settings,
    children: [
      { title: 'Users', path: '/system/users' },
      { title: 'Audit Logs', path: '/system/audit' },
      { title: 'Notifications', path: '/system/notifications' },
      { title: 'Settings', path: '/system/settings' },
    ],
  }
];

const SidebarItem = ({ item }: { item: NavItem }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(
    item.children?.some(child => location.pathname.startsWith(child.path)) || false
  );

  const isActive = location.pathname === item.path || (item.children && item.children.some(c => location.pathname.startsWith(c.path)));

  if (item.children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors group",
            isActive ? "text-white" : "text-slate-400 hover:bg-sidebar-active/10 hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon size={20} className={isActive ? "text-primary-400" : "text-slate-400 group-hover:text-slate-300"} />
            <span className="font-medium">{item.title}</span>
          </div>
          <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
        
        {isOpen && (
          <div className="mt-1 ml-6 pl-4 border-l border-slate-700/50 space-y-1">
            {item.children.map(child => {
              const isChildActive = location.pathname === child.path;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                    isChildActive 
                      ? "bg-primary/20 text-white font-medium" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1 group",
        isActive 
          ? "bg-sidebar-active text-white font-medium shadow-md shadow-primary/20" 
          : "text-slate-400 hover:bg-sidebar-active/10 hover:text-slate-200"
      )}
    >
      <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"} />
      <span>{item.title}</span>
    </Link>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-[260px] h-screen bg-sidebar flex flex-col hidden lg:flex border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Package size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">WMS Enterprise</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-1">Phiên bản</p>
          <p className="text-sm text-slate-200">v2.0.0 (Enterprise)</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
