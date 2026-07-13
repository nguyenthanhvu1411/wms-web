import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundApi } from '@/api/inboundApi';
import { outboundApi } from '@/api/outboundApi';
import { reportsApi } from '@/api/reportsApi';
import { useState, useMemo } from 'react';
import { subDays, format, isAfter, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DashboardPage = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all');

  const { data: warehousesData } = useQuery({
    queryKey: ['dashboard', 'warehouses'],
    queryFn: () => masterDataApi.getWarehouses({ pageSize: 100 }),
  });
  const warehouses = warehousesData?.items || [];

  const warehouseParams = selectedWarehouse !== 'all' ? { warehouseId: selectedWarehouse } : {};

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: () => masterDataApi.getProducts({ page: 1, pageSize: 1 }),
  });

  const { data: poData, isLoading: isPoLoading } = useQuery({
    queryKey: ['dashboard', 'po', selectedWarehouse],
    queryFn: () => inboundApi.getPurchaseOrders({ page: 1, pageSize: 1000, ...warehouseParams }),
  });

  const { data: soData, isLoading: isSoLoading } = useQuery({
    queryKey: ['dashboard', 'so', selectedWarehouse],
    queryFn: () => outboundApi.getSalesOrders({ page: 1, pageSize: 1000, ...warehouseParams }),
  });

  const { data: lowStockData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['dashboard', 'low-stock', selectedWarehouse],
    queryFn: () => reportsApi.getLowStock({ page: 1, pageSize: 1, ...warehouseParams }),
  });

  const productCount = (productsData as any)?.totalItems || (productsData as any)?.totalCount || 0;
  
  // Calculate counts for "New" tasks (assuming Draft = 1 or Submitted = 2)
  const pendingPoCount = poData?.items?.filter(po => po.status === 1 || po.status === 2).length || 0;
  const pendingSoCount = soData?.items?.filter(so => so.status === 1 || so.status === 2).length || 0;
  const totalTasks = pendingPoCount + pendingSoCount;

  // Process data for the chart (last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    const today = startOfDay(new Date());
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const day = date.getDay();
      const shortName = day === 0 ? 'CN' : `T${day + 1}`;
      
      // Filter POs and SOs for this specific date
      const poCountForDay = poData?.items?.filter(po => po.orderDate && po.orderDate.startsWith(dateStr)).length || 0;
      const soCountForDay = soData?.items?.filter(so => so.orderDate && so.orderDate.startsWith(dateStr)).length || 0;
      
      data.push({
        name: shortName,
        'Nhập': poCountForDay,
        'Xuất': soCountForDay
      });
    }
    return data;
  }, [poData, soData]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      <div className="bg-white border-b-2 border-slate-900 p-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">TỔNG QUAN HOẠT ĐỘNG</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">Tình hình hoạt động kho hôm nay</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="warehouse-select" className="sr-only">Chọn kho</label>
          <select 
            id="warehouse-select" 
            className="bg-white border-2 border-slate-900 font-medium text-slate-900 rounded-none px-4 py-2 text-sm focus:outline-none focus:border-slate-900"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">Tất cả kho </option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
            ))}
          </select>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-none font-bold text-sm hover:bg-slate-800 transition-colors">
            TẢI BÁO CÁO
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Sản Phẩm" 
          value={isProductsLoading ? "..." : productCount.toString()} 
          unit="SP" 
          trend="" 
          isPositive={true} 
          icon={<Package className="text-primary" />} 
          colorClass="bg-primary/10" 
        />
        <StatCard 
          title="Đơn Nhập (PO)" 
          value={isPoLoading ? "..." : (poData?.totalItems || 0).toString()} 
          subtitle="Tổng số PO hệ thống" 
          icon={<ArrowDownIcon className="text-success" />} 
          colorClass="bg-success/10" 
        />
        <StatCard 
          title="Đơn Xuất (SO)" 
          value={isSoLoading ? "..." : (soData?.totalItems || 0).toString()} 
          subtitle="Tổng số SO hệ thống" 
          icon={<ArrowUpIcon className="text-warning" />} 
          colorClass="bg-warning/10" 
        />
        <StatCard 
          title="Cảnh báo Tồn" 
          value={isLowStockLoading ? "..." : (lowStockData?.totalItems || 0).toString()} 
          subtitle="Sản phẩm dưới mức tối thiểu" 
          icon={<AlertCircle className="text-danger" />} 
          colorClass="bg-danger/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          <h3 className="font-semibold text-text-primary mb-6">Lưu lượng Nhập / Xuất (7 ngày qua)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                <Bar dataKey="Nhập" fill="#0F172A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Xuất" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-text-primary">Việc Cần Làm</h3>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-md">{totalTasks}</span>
          </div>
          <div className="space-y-4">
            <TaskItem title="Xử lý PO mới" count={pendingPoCount} priority="high" />
            <TaskItem title="Xử lý SO mới" count={pendingSoCount} priority="medium" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;

// Helper components
const StatCard = ({ title, value, unit, trend, subtitle, isPositive, icon, colorClass }: any) => (
  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colorClass}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <h4 className="text-text-secondary text-sm font-medium mb-1">{title}</h4>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-text-primary">{value}</span>
        {unit && <span className="text-sm font-medium text-text-muted">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  </div>
);

const TaskItem = ({ title, count, priority }: any) => {
  const getPriorityColor = () => {
    if (count === 0) return 'bg-slate-100 text-slate-400 border-slate-200';
    switch(priority) {
      case 'high': return 'bg-danger/10 text-danger border-danger/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-background text-text-secondary border-border';
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getPriorityColor()}`}>
          {count}
        </div>
        <span className="font-medium text-sm text-text-primary">{title}</span>
      </div>
      <Clock size={16} className="text-text-muted" />
    </div>
  );
};

// Temp icons
const ArrowDownIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7"/>
  </svg>
);
const ArrowUpIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
);
