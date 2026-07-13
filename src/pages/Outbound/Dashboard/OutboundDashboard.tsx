import React from 'react';
import { Package, Clock, CheckCircle, TrendingUp, Truck } from 'lucide-react';
import { format } from 'date-fns';

export const OutboundDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Outbound Dashboard</h1>
        <div className="text-sm text-slate-500">
          Last updated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Đơn chờ duyệt" value="12" icon={<Clock className="text-warning" />} />
        <KpiCard title="Đang Picking" value="45" icon={<Package className="text-primary" />} />
        <KpiCard title="Chờ Shipping" value="8" icon={<Truck className="text-info" />} />
        <KpiCard title="Giao thành công" value="156" icon={<CheckCircle className="text-success" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Chart placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary" /> Năng suất Outbound (Items/Hour)
          </h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <span className="text-slate-400">Biểu đồ năng suất Picking/Packing</span>
          </div>
        </div>

        {/* OTIF & Fill Rate */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Tỷ lệ On-Time In-Full (OTIF)</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-success/20">
                <div className="absolute w-full h-full rounded-full border-8 border-success border-t-transparent animate-spin-slow"></div>
                <span className="text-2xl font-bold text-slate-700">94%</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">Mục tiêu: = 95%</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Tỷ lệ Fill Rate</h3>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden">
              <div className="bg-primary h-4 rounded-full" style={{ width: '98%' }}></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Current: 98%</span>
              <span className="text-slate-500">Target: 99%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="p-3 bg-slate-50 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default OutboundDashboard;
