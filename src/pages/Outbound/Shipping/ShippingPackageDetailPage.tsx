import { useParams, useNavigate } from 'react-router-dom';
import { useShippingPackage } from './hooks/useShippingPackages';
import { ArrowLeft, Package, Clock, Truck, FileText, CheckCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ShippingPackageStatus, shippingPackageStatusLabel, SalesOrderStatus } from '@/types/wms-enums';
import { format } from 'date-fns';
import { useCloseSalesOrder } from '../SalesOrders/hooks/useSalesOrders';
import { useQueryClient } from '@tanstack/react-query';
import { outboundKeys } from '@/api/queryKeys';

const ShippingPackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: pkg, isLoading } = useShippingPackage(Number(id));

  // Hooks phải được gọi trước mọi early return (Rules of Hooks)
  const closeMutation = useCloseSalesOrder();

  const handleCloseOrder = () => {
    if (pkg?.salesOrderId) {
      if (window.confirm(`Xác nhận đóng hoàn tất đơn hàng ${pkg.salesOrderNumber}?`)) {
        closeMutation.mutate(pkg.salesOrderId, {
          onSuccess: () => {
            // Invalidate để reload dữ liệu mới nhất, ở lại trang
            queryClient.invalidateQueries({ queryKey: outboundKeys.shipments });
            queryClient.invalidateQueries({ queryKey: outboundKeys.salesOrders });
          }
        });
      }
    }
  };

  const isSalesOrderClosed = pkg?.salesOrderStatus === SalesOrderStatus.Closed;

  if (isLoading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!pkg) return <div className="p-10 text-center text-danger">Không tìm thấy kiện hàng</div>;

  const getStatusString = (status: number) => {
    if (isSalesOrderClosed) return 'Completed';
    switch(status) {
      case ShippingPackageStatus.Packed: return 'Pending';
      case ShippingPackageStatus.Dispatched: return 'InProgress';
      case ShippingPackageStatus.InTransit: return 'InProgress';
      case ShippingPackageStatus.Delivered: return 'Completed';
      default: return 'Pending';
    }
  };

  const getStatusLabel = (): string => {
    if (isSalesOrderClosed) return 'Đã đóng';
    return shippingPackageStatusLabel[pkg.status as unknown as ShippingPackageStatus];
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/outbound/shipping')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              Kiện hàng: {pkg.packageNumber}
              <StatusBadge 
                status={getStatusString(pkg.status)} 
                text={getStatusLabel()} 
              />
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lệnh lấy hàng: <span className="font-mono font-medium text-slate-700">{pkg.pickingNumber || `#${pkg.pickingOrderId}`}</span>
              {pkg.salesOrderNumber && (
                <> &nbsp;&bull;&nbsp; Đơn BH: <span className="font-mono font-medium text-primary">{pkg.salesOrderNumber}</span></>
              )}
              {pkg.createdBy && (
                <> &nbsp;&bull;&nbsp; Người tạo: <span className="font-medium text-slate-700">{pkg.createdBy}</span></>
              )}
            </p>
          </div>
        </div>

        {/* Nút xác nhận đóng - chỉ hiển khi đã giao thành công và chưa đóng */}
        {pkg.status as unknown as ShippingPackageStatus === ShippingPackageStatus.Delivered && pkg.salesOrderId && !isSalesOrderClosed && (
          <button 
            onClick={handleCloseOrder}
            disabled={closeMutation.isPending}
            className="bg-success text-white px-4 py-2 rounded-lg font-semibold hover:bg-success-hover transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            <CheckCircle size={18} /> {closeMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đóng'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Package size={18} /> Sản phẩm trong kiện
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Sản phẩm</th>
                    <th className="px-6 py-3 font-medium text-right">SL Đóng Gói</th>
                    <th className="px-6 py-3 font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {pkg.lines?.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{line.productSku}</div>
                        <div className="text-xs text-slate-500">{line.productName}</div>
                        {line.lotNumber && <div className="text-xs text-slate-500 mt-1">Lot: {line.lotNumber}</div>}
                        {line.serialNumbers && line.serialNumbers.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">Serials: {line.serialNumbers.join(', ')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {line.qtyPacked} {line.uomCode}
                      </td>
                      <td className="px-6 py-4">{line.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Truck size={18} /> Thông tin vận chuyển
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Đơn vị vận chuyển</div>
                  <div className="font-medium text-slate-900">{pkg.carrierName || 'Chưa cập nhật'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Dịch vụ (Service)</div>
                  <div className="font-medium text-slate-900">{pkg.carrierService || '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Mã vận đơn</div>
                <div className="font-mono text-primary font-medium">{pkg.trackingNumber || 'Chưa cập nhật'}</div>
              </div>

              {(pkg.weightKg || pkg.lengthCm || pkg.widthCm || pkg.heightCm) && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-xs text-slate-500">Trọng lượng</div>
                    <div className="font-medium text-sm">{pkg.weightKg ? `${pkg.weightKg} kg` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Dài</div>
                    <div className="font-medium text-sm">{pkg.lengthCm ? `${pkg.lengthCm} cm` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Rộng</div>
                    <div className="font-medium text-sm">{pkg.widthCm ? `${pkg.widthCm} cm` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Cao</div>
                    <div className="font-medium text-sm">{pkg.heightCm ? `${pkg.heightCm} cm` : '-'}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Clock size={14} /> Thời gian đóng gói
                </div>
                <div className="font-medium text-slate-900">
                  {pkg.packedAt ? format(new Date(pkg.packedAt), 'dd/MM/yyyy HH:mm:ss') : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Clock size={14} /> Thời gian xuất kho
                </div>
                <div className="font-medium text-slate-900">
                  {pkg.dispatchedAt ? format(new Date(pkg.dispatchedAt), 'dd/MM/yyyy HH:mm:ss') : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Clock size={14} /> Thời gian giao thành công
                </div>
                <div className="font-medium text-slate-900">
                  {pkg.deliveredAt ? format(new Date(pkg.deliveredAt), 'dd/MM/yyyy HH:mm:ss') : '-'}
                </div>
              </div>
            </div>
          </div>
          {pkg.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={18} /> Ghi chú
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{pkg.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingPackageDetailPage;
