import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePickingOrder, usePickLine } from './hooks/usePickingOrders';
import { ArrowLeft, Package, ScanLine, AlertCircle, CheckCircle, User, Clock, MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { PickingOrderStatus, pickingOrderStatusLabel } from '@/types/wms-enums';
import type { PickingOrderLine } from '@/types/outbound';
import { Modal, Input, message } from 'antd';
import { format } from 'date-fns';

const PickingOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: order, isLoading } = usePickingOrder(Number(id));
  const pickLineMutation = usePickLine();

  const [activeLine, setActiveLine] = useState<PickingOrderLine | null>(null);
  const [pickQty, setPickQty] = useState<number>(0);
  const [serialInput, setSerialInput] = useState('');
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);

  if (isLoading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (!order) return <div className="p-10 text-center text-danger">Không tìm thấy lệnh nhặt hàng</div>;

  const handleOpenPickModal = (line: PickingOrderLine) => {
    setActiveLine(line);
    setPickQty(line.qtyToPick - line.qtyPicked);
    setScannedSerials([]);
    setSerialInput('');
  };

  const handleScanSerial = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && serialInput.trim()) {
      const serial = serialInput.trim();
      if (scannedSerials.includes(serial)) {
        message.warning('Serial này đã được quét!');
      } else if (scannedSerials.length >= pickQty) {
        message.warning('Đã đủ số lượng yêu cầu!');
      } else {
        setScannedSerials([...scannedSerials, serial]);
      }
      setSerialInput('');
    }
  };

  const handleSubmitPick = () => {
    if (!activeLine) return;
    
    if (activeLine.trackSerialNumber && scannedSerials.length !== pickQty) {
      message.error(`Sản phẩm quản lý Serial, cần quét đủ ${pickQty} mã! (Đang có ${scannedSerials.length})`);
      return;
    }

    pickLineMutation.mutate({
      lineId: activeLine.id,
      data: {
        qtyPicked: pickQty,
        serialNumbers: scannedSerials
      }
    }, {
      onSuccess: () => {
        setActiveLine(null);
      }
    });
  };

  const getStatusString = (status: number) => {
    switch(status) {
      case PickingOrderStatus.Assigned: return 'Pending';
      case PickingOrderStatus.InProgress: return 'InProgress';
      case PickingOrderStatus.Completed: return 'Completed';
      case PickingOrderStatus.Cancelled: return 'Cancelled';
      default: return 'Pending';
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/outbound/picking')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              Phiếu lấy hàng: {order.pickingNumber}
              <StatusBadge 
                status={getStatusString(order.status)} 
                text={pickingOrderStatusLabel[order.status as unknown as PickingOrderStatus]} 
              />
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
              <span>Đơn BH: <span className="font-mono font-medium text-slate-700">{order.salesOrderNumber}</span></span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={13}/> Kho: <span className="font-medium text-slate-700">{order.warehouseCode}{order.warehouseName ? ` - ${order.warehouseName}` : ''}</span></span>
              {order.assignedTo && (
                <><span>•</span><span className="flex items-center gap-1"><User size={13}/> {order.assignedToName || order.assignedTo}</span></>
              )}
              {order.startedAt && (
                <><span>•</span><span className="flex items-center gap-1"><Clock size={13}/> Bắt đầu: {format(new Date(order.startedAt), 'dd/MM/yyyy HH:mm')}</span></>
              )}
              {order.completedAt && (
                <><span>•</span><span className="flex items-center gap-1 text-success"><CheckCircle size={13}/> Hoàn tất: {format(new Date(order.completedAt), 'dd/MM/yyyy HH:mm')}</span></>
              )}
            </p>
          </div>
        </div>

        {order.status === PickingOrderStatus.Completed && (
          <button
            onClick={() => navigate(`/outbound/packing/${order.id}`)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <Package size={18} /> Đóng gói hàng
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package size={18} /> Danh sách cần nhặt
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">Sản phẩm</th>
                <th className="px-6 py-3 font-medium">Vị trí</th>
                <th className="px-6 py-3 font-medium">Số lô (Lot)</th>
                <th className="px-6 py-3 font-medium text-right">SL Cần</th>
                <th className="px-6 py-3 font-medium text-right">Đã nhặt</th>
                <th className="px-6 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {order.lines?.map((line, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{line.productSku}</div>
                    <div className="text-xs text-slate-500">{line.productName}</div>
                    {line.trackSerialNumber && <div className="text-xs text-primary mt-1 flex items-center gap-1"><ScanLine size={12}/> Yêu cầu Serial</div>}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <div>{line.locationCode}</div>
                    {line.locationName && <div className="text-xs text-slate-400">{line.locationName}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono">{line.trackLot ? (line.lotNumber || 'N/A') : '-'}</div>
                    {line.trackLot && line.expiryDate && (
                      <div className="text-xs text-slate-500">HSD: {line.expiryDate.split('T')[0]}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{line.qtyToPick} {line.uomCode}</td>
                  <td className="px-6 py-4 text-right text-success font-medium">{line.qtyPicked}</td>
                  <td className="px-6 py-4 text-center">
                    {line.qtyPicked < line.qtyToPick && order.status !== PickingOrderStatus.Completed && (
                      <button 
                        onClick={() => handleOpenPickModal(line)}
                        className="bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        Thực hiện nhặt
                      </button>
                    )}
                    {line.qtyPicked >= line.qtyToPick && (
                      <span className="text-success text-xs font-medium bg-success/10 px-2 py-1 rounded flex items-center justify-center gap-1">
                        <CheckCircle size={14}/> Hoàn tất
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title="Thực hiện nhặt hàng"
        open={!!activeLine}
        onCancel={() => setActiveLine(null)}
        onOk={handleSubmitPick}
        confirmLoading={pickLineMutation.isPending}
        okText="Xác nhận"
        cancelText="Hủy"
        width={500}
      >
        {activeLine && (
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-sm font-medium">{activeLine.productSku} - {activeLine.productName}</p>
              <p className="text-xs text-slate-500 mt-1">Vị trí: <span className="font-mono">{activeLine.locationCode}</span></p>
            </div>

            {activeLine.trackLot && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số Lô (Lot)</label>
                <Input value={activeLine.lotNumber} disabled />
                {activeLine.expiryDate && (
                  <div className="mt-2 text-xs text-slate-500">
                    HSD: {activeLine.expiryDate.split('T')[0]}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1"><AlertCircle size={12} className="inline mr-1"/> Chỉ đọc theo chỉ định của hệ thống</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng nhặt</label>
              <Input 
                type="number" 
                value={pickQty} 
                onChange={e => setPickQty(Number(e.target.value))}
                max={activeLine.qtyToPick - activeLine.qtyPicked}
                min={1}
                disabled={activeLine.trackSerialNumber} // Nếu có serial thì SL được tính tự động từ mảng serial
                suffix={activeLine.uomCode}
              />
            </div>

            {activeLine.trackSerialNumber && (
              <div className="border-t border-slate-100 pt-4 mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Quét Số Serial</label>
                <Input 
                  placeholder="Quét hoặc nhập mã vạch rồi Enter" 
                  value={serialInput}
                  onChange={e => setSerialInput(e.target.value)}
                  onKeyDown={handleScanSerial}
                  prefix={<ScanLine size={16} className="text-slate-400" />}
                />
                <div className="mt-2 text-xs flex justify-between text-slate-500">
                  <span>Đã quét: {scannedSerials.length} / {pickQty}</span>
                </div>
                {scannedSerials.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {scannedSerials.map((s, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PickingOrderDetailPage;



