import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '@/api/financeApi';
import { DollarSign, FileText, CheckCircle, CreditCard, Box, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from 'antd';

const formatVND = (val: number | undefined) =>
  typeof val === 'number'
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    : '—';

const formatCount = (val: number | undefined) =>
  typeof val === 'number' ? new Intl.NumberFormat('vi-VN').format(val) : '—';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
  isCurrency?: boolean;
  accentColor?: string;
}

const StatCard = ({ title, value, icon, subtitle, loading = false, isCurrency = false, accentColor = 'text-slate-900' }: StatCardProps) => (
  <div className="bg-white border-2 border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-colors rounded-lg">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      <div className="text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">{icon}</div>
    </div>
    {loading ? (
      <Skeleton.Input active size="large" />
    ) : (
      <>
        <div className={`text-3xl font-black mb-1 ${accentColor}`}>
          {isCurrency ? formatVND(value) : formatCount(value)}
        </div>
        {subtitle && <div className="text-sm font-medium text-slate-400">{subtitle}</div>}
      </>
    )}
  </div>
);

const FinanceDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'dashboard'],
    queryFn: () => financeApi.getDashboard(),
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      <div className="bg-slate-900 text-white p-6 shrink-0 shadow-md z-10 sticky top-0">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TÀI CHÍNH KẾ TOÁN</div>
        <h1 className="text-2xl font-black tracking-tight">Tổng quan tài chính</h1>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Công nợ phải trả (AP)"
            value={data?.totalAccountsPayable}
            isCurrency
            icon={<DollarSign size={24} />}
            loading={isLoading}
            accentColor="text-slate-900"
          />
          <StatCard
            title="Giá trị tồn kho"
            value={data?.inventoryValue}
            isCurrency
            icon={<Box size={24} />}
            loading={isLoading}
          />
          <StatCard
            title="Đã chi trong tháng"
            value={data?.totalPaidThisMonth}
            isCurrency
            icon={<CreditCard size={24} />}
            loading={isLoading}
            accentColor="text-emerald-700"
          />
          <StatCard
            title="Hóa đơn chờ duyệt"
            value={data?.pendingInvoicesCount}
            icon={<AlertTriangle size={24} />}
            loading={isLoading}
            accentColor="text-orange-600"
          />
          <StatCard
            title="Hóa đơn đã duyệt"
            value={data?.approvedInvoicesCount}
            icon={<CheckCircle size={24} />}
            loading={isLoading}
            accentColor="text-emerald-600"
          />
          <StatCard
            title="Lệnh chi chờ duyệt"
            value={data?.pendingPaymentsCount}
            icon={<Clock size={24} />}
            loading={isLoading}
            accentColor="text-orange-600"
          />
          <StatCard
            title="Lệnh chi đã thanh toán"
            value={data?.paidPaymentsCount}
            icon={<FileText size={24} />}
            loading={isLoading}
            accentColor="text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
