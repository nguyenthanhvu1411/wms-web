import { useNavigate } from 'react-router-dom';
import { useCycleCountDashboard, useCycleCounts } from './hooks/useCycleCounts';
import {
  Package, CheckCircle2, Clock, AlertTriangle, TrendingDown,
  RefreshCw, XCircle, List, ClipboardCheck, CalendarCheck
} from 'lucide-react';
import { CycleCountStatus } from '@/types/wms-enums';
import { format } from 'date-fns';

const formatQty = (val: number | undefined) =>
  typeof val === 'number' ? new Intl.NumberFormat('vi-VN').format(val) : '—';

interface MetricCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
}

const MetricCard = ({ label, value, icon, color = 'text-slate-900', bg = 'bg-white' }: MetricCardProps) => (
  <div className={`${bg} border-2 border-slate-900 p-5 flex flex-col justify-between`}>
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{label}</h3>
      <div className={color}>{icon}</div>
    </div>
    <div className={`text-3xl font-black font-mono ${color}`}>{formatQty(value)}</div>
  </div>
);

const CycleCountDashboardPage = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading: isDashboardLoading } = useCycleCountDashboard();
  const { data: pendingData, isLoading: isListLoading } = useCycleCounts({
    pageIndex: 1,
    pageSize: 5,
    onlyPendingApproval: true,
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      <div className="bg-white border-b-2 border-slate-900 p-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard Kiểm kê</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium uppercase tracking-wider">
            Tổng quan hiệu suất và tiến độ kiểm đếm tồn kho
          </p>
        </div>
        <button
          onClick={() => navigate('/cycle-counts/create')}
          className="bg-slate-900 text-white px-5 py-2.5 font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} /> TẠO PHIẾU MỚI
        </button>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Metrics: Trạng thái phiếu */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">PHIẾU KIỂM KÊ THEO TRẠNG THÁI</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricCard label="Tổng phiếu" value={dashboardData?.totalCounts} icon={<Package size={20} />} />
            <MetricCard label="Nháp" value={dashboardData?.draftCounts} icon={<List size={20} />} color="text-slate-500" />
            <MetricCard label="Đã lên lịch" value={dashboardData?.scheduledCounts} icon={<CalendarCheck size={20} />} color="text-blue-600" />
            <MetricCard label="Đang kiểm" value={dashboardData?.inProgressCounts} icon={<Clock size={20} />} color="text-blue-700" bg="bg-blue-50" />
            <MetricCard label="Chờ duyệt" value={dashboardData?.pendingApprovalCounts} icon={<AlertTriangle size={20} />} color="text-orange-600" bg="bg-orange-50" />
            <MetricCard label="Đã duyệt" value={dashboardData?.approvedCounts} icon={<CheckCircle2 size={20} />} color="text-emerald-700" bg="bg-emerald-50" />
            <MetricCard label="Đã điều chỉnh" value={dashboardData?.adjustedCounts} icon={<ClipboardCheck size={20} />} color="text-teal-700" bg="bg-teal-50" />
            <MetricCard label="Đã hủy" value={dashboardData?.cancelledCounts} icon={<XCircle size={20} />} color="text-red-600" />
          </div>
        </div>

        {/* KPI: Hiệu suất */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border-2 border-slate-900 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b-2 border-slate-100 pb-3">
              CHỈ SỐ HIỆU SUẤT TỒN KHO
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-200">
                <div className="text-4xl font-black font-mono text-slate-900 mb-1">
                  {isDashboardLoading ? '...' : `${(dashboardData?.inventoryAccuracyPct ?? 0).toFixed(1)}%`}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Độ chính xác tồn kho</div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-orange-50 border-2 border-orange-200">
                <div className="text-4xl font-black font-mono text-orange-600 mb-1">
                  {isDashboardLoading ? '...' : formatQty(dashboardData?.totalVarianceQty)}
                </div>
                <div className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1 text-center">
                  <TrendingDown size={14} /> Tổng chênh lệch
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-200">
                <div className="text-4xl font-black font-mono text-slate-900 mb-1">
                  {isDashboardLoading ? '...' : formatQty(dashboardData?.totalLines)}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tổng dòng kiểm kê</div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 border-2 border-emerald-200">
                <div className="text-4xl font-black font-mono text-emerald-700 mb-1">
                  {isDashboardLoading ? '...' : formatQty(dashboardData?.countedLines)}
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider text-center">Dòng đã kiểm</div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-blue-50 border-2 border-blue-200">
                <div className="text-4xl font-black font-mono text-blue-700 mb-1">
                  {isDashboardLoading ? '...' : formatQty(dashboardData?.remainingLines)}
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider text-center">Dòng còn lại</div>
              </div>
            </div>
          </div>

          {/* Phiếu chờ duyệt gần nhất */}
          <div className="bg-white border-2 border-slate-900 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-3">
              PHIẾU CHỜ DUYỆT GẦN NHẤT
            </h3>
            <div className="space-y-3">
              {isListLoading ? (
                <div className="text-slate-400 text-sm text-center py-6">Đang tải...</div>
              ) : pendingData?.items?.filter(i => i.status === CycleCountStatus.ReviewDifference).length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
                  Không có phiếu nào chờ duyệt
                </div>
              ) : (
                pendingData?.items
                  ?.filter(i => i.status === CycleCountStatus.ReviewDifference)
                  .slice(0, 5)
                  .map(item => (
                    <div
                      key={item.id}
                      className="p-3 border-l-4 border-orange-500 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => navigate(`/cycle-counts/${item.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-900 font-mono text-sm">{item.countNumber}</div>
                        <div className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-0.5 rounded">CHỜ DUYỆT</div>
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">{item.warehouseName}</div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{item.scheduledDate ? format(new Date(item.scheduledDate), 'dd/MM/yyyy') : ''}</span>
                        <span className={`font-bold ${item.totalVarianceQty !== 0 ? 'text-orange-700' : 'text-emerald-600'}`}>
                          Chênh: {item.totalVarianceQty > 0 ? '+' : ''}{formatQty(item.totalVarianceQty)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleCountDashboardPage;
