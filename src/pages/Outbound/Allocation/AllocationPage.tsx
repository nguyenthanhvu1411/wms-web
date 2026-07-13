import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSalesOrder } from '../SalesOrders/hooks/useSalesOrders';
import { outboundApi } from '@/api/outboundApi';
import { stockApi } from '@/api/stockApi';
import { PickingStrategy, SalesOrderStatus } from '@/types/wms-enums';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { message } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { outboundKeys } from '@/api/queryKeys';

const AllocationPage = () => {
  const [searchParams] = useSearchParams();
  const salesOrderId = searchParams.get('salesOrderId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [strategy, setStrategy] = useState<number>(PickingStrategy.FEFO);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: order, isLoading } = useSalesOrder(Number(salesOrderId));

  const { data: stockData } = useQuery({
    queryKey: ['stock-on-hand', order?.warehouseId],
    queryFn: () => stockApi.getOnHand({ warehouseId: order?.warehouseId, pageSize: 100 }),
    enabled: !!order?.warehouseId,
  });

  const relevantStock = useMemo(() => {
    if (!order || !stockData?.items) return [];
    const productIds = order.lines.map(l => l.productId);
    return stockData.items.filter(s => productIds.includes(s.productId));
  }, [order, stockData]);

  if (!salesOrderId) return <div className="p-10 text-center">Missing Sales Order ID</div>;
  if (isLoading) return <div className="p-10 text-center">Đang tải...</div>;
  if (!order) return <div className="p-10 text-center">Không tìm thấy đơn bán hàng</div>;

  const handleAllocate = async () => {
    setIsSubmitting(true);
    try {
      await outboundApi.createPickingOrder({
        salesOrderId: Number(salesOrderId),
        strategy,
        method: 1 // SingleOrder
      });
      message.success('Đã cấp phát thành công!');
      queryClient.invalidateQueries({ queryKey: outboundKeys.salesOrders });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      queryClient.invalidateQueries({ queryKey: outboundKeys.pickingTasks });
      navigate(`/outbound/sales-orders/${salesOrderId}`);
    } catch (err: any) {
      message.error(err.message || 'Lỗi cấp phát kho');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(`/outbound/sales-orders/${salesOrderId}`)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Cấp phát kho (Allocation)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Thông tin đơn hàng</h3>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Mã ĐH:</strong> {order.orderNumber}</p>
          <p><strong>Khách hàng:</strong> {order.customerName}</p>
          <p><strong>Kho xuất:</strong> {order.warehouseCode}</p>
          <p><strong>Trạng thái:</strong> {order.status === SalesOrderStatus.Released ? 'Đã release (Sẵn sàng cấp phát)' : 'Chưa release'}</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-amber-800">Cảnh báo</h4>
          <p className="text-amber-700 text-sm mt-1">
            <strong>Allocate (Cấp phát) chỉ giữ hàng (tăng QtyReserved và giảm QtyAvailable), chưa trừ tồn kho thực tế (QtyOnHand).</strong> Tồn kho thực tế chỉ bị trừ khi thực hiện Dispatch kiện hàng.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 overflow-hidden">
        <h3 className="font-semibold text-slate-800 mb-4">Tồn khả dụng trước cấp phát</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Vị trí (Location)</th>
                <th className="px-4 py-3">Lot / HSD</th>
                <th className="px-4 py-3 text-right">QtyOnHand</th>
                <th className="px-4 py-3 text-right">QtyReserved</th>
                <th className="px-4 py-3 text-right">QtyAvailable</th>
              </tr>
            </thead>
            <tbody>
              {relevantStock.length > 0 ? (
                relevantStock.map((stock) => (
                  <tr key={stock.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{stock.productSku} - {stock.productName}</td>
                    <td className="px-4 py-3">{stock.locationCode}</td>
                    <td className="px-4 py-3 text-xs">
                      {stock.lotNumber || '-'} <br/> {stock.expiryDate?.split('T')[0] || ''}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{stock.qtyOnHand}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600">{stock.qtyReserved}</td>
                    <td className="px-4 py-3 text-right font-bold text-success">{stock.qtyAvailable}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Không tìm thấy tồn kho cho các sản phẩm trong đơn hàng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Chiến lược nhặt hàng (Picking Strategy)</h3>
        
        <div className="flex flex-col gap-3 mb-6">
          <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === PickingStrategy.FEFO ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
            <input type="radio" name="strategy" value={PickingStrategy.FEFO} checked={strategy === PickingStrategy.FEFO} onChange={() => setStrategy(PickingStrategy.FEFO)} className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium text-slate-900">FEFO (First Expired, First Out)</p>
              <p className="text-sm text-slate-500 mt-1">Ưu tiên xuất hàng hết hạn trước. Phù hợp cho hàng có HSD (Thực phẩm, Dược phẩm).</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === PickingStrategy.FIFO ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
            <input type="radio" name="strategy" value={PickingStrategy.FIFO} checked={strategy === PickingStrategy.FIFO} onChange={() => setStrategy(PickingStrategy.FIFO)} className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium text-slate-900">FIFO (First In, First Out)</p>
              <p className="text-sm text-slate-500 mt-1">Ưu tiên xuất hàng nhập kho trước. Phù hợp cho hàng không có HSD (Điện tử, Thời trang).</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === PickingStrategy.LIFO ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}>
            <input type="radio" name="strategy" value={PickingStrategy.LIFO} checked={strategy === PickingStrategy.LIFO} onChange={() => setStrategy(PickingStrategy.LIFO)} className="w-4 h-4 text-primary" />
            <div>
              <p className="font-medium text-slate-900">LIFO (Last In, First Out)</p>
              <p className="text-sm text-slate-500 mt-1">Ưu tiên xuất hàng mới nhập kho. Ít phổ biến, dùng cho hàng rời chất đống (Cát, Đá).</p>
            </div>
          </label>
        </div>

        <button 
          onClick={handleAllocate}
          disabled={isSubmitting || order.status !== SalesOrderStatus.Released}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang cấp phát...' : <><CheckCircle size={20} /> Xác nhận cấp phát & Tạo lệnh nhặt</>}
        </button>
      </div>
    </div>
  );
};

export default AllocationPage;
