import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { 
  ArrowLeft, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Package, 
  MapPin, 
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { asnStatusLabel, AsnStatus } from '@/types/wms-enums';
import { EditAsnModal } from './components/EditAsnModal';
import { Edit } from 'lucide-react';

const AsnDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'lines'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: asn, isLoading, isError } = useQuery({
    queryKey: [...inboundKeys.asns, id],
    queryFn: () => inboundApi.getAsnById(Number(id)),
    enabled: !!id,
  });

  const { data: uomsData } = useQuery({
    queryKey: ['uoms'],
    queryFn: () => masterDataApi.getUoms({ pageIndex: 1, pageSize: 500 }),
  });

  const getUomName = (code: string) => {
    const uom = uomsData?.items?.find((u: any) => u.code === code);
    return uom ? uom.name : code;
  };

  const { data: linkedGrData } = useQuery({
    queryKey: [...inboundKeys.goodsReceipts, 'byAsn', id],
    queryFn: () => inboundApi.getGoodsReceipts({ asnId: Number(id), pageSize: 1 }),
    enabled: !!asn,
  });

  const linkedGr = linkedGrData?.items?.[0];

  const invalidateAndToast = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: [...inboundKeys.asns, id] });
    queryClient.invalidateQueries({ queryKey: inboundKeys.asns });
  };

  const inTransitMutation = useMutation({
    mutationFn: () => inboundApi.markAsnInTransit(Number(id)),
    onSuccess: () => invalidateAndToast('Đã chuyển ASN sang trạng thái Đang giao'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => inboundApi.confirmAsn(Number(id)),
    onSuccess: () => {
      toast.success('Xác nhận ASN thành công');
      queryClient.invalidateQueries({ queryKey: [...inboundKeys.asns, 'detail', Number(id)] });
      queryClient.invalidateQueries({ queryKey: inboundKeys.goodsReceipts });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error occurred while confirming ASN');
    }
  });

  const arrivedMutation = useMutation({
    mutationFn: () => inboundApi.markAsnArrived(Number(id)),
    onSuccess: () => {
      invalidateAndToast('Đã xác nhận ASN tới kho');
      queryClient.invalidateQueries({ queryKey: inboundKeys.goodsReceipts });
      queryClient.invalidateQueries({ queryKey: [...inboundKeys.goodsReceipts, 'byAsn', id] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => inboundApi.cancelAsn(Number(id)),
    onSuccess: () => invalidateAndToast('Đã hủy ASN thành công'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => inboundApi.updateAsn(Number(id), data),
    onSuccess: () => {
      invalidateAndToast('Đã cập nhật thông tin ASN');
      setIsEditModalOpen(false);
    }
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !asn) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">Không tìm thấy thông báo giao hàng hoặc có lỗi xảy ra.</p>
        <button onClick={() => navigate('/inbound/asns')} className="text-primary hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/inbound/asns')}
          className="p-2 hover:bg-background-hover rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              ASN: {asn.asnNumber}
            </h1>
            <StatusBadge status={asnStatusLabel[asn.status as AsnStatus] || 'Unknown'} />
          </div>
          <p className="text-text-secondary mt-1">
            Nhà cung cấp: {asn.supplierName} • Kho nhận: {asn.warehouseName}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          {asn.status === AsnStatus.Pending && (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Xác nhận hủy ASN này?')) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <XCircle size={18} />
                Hủy ASN
              </button>
              <button
                onClick={() => inTransitMutation.mutate()}
                disabled={inTransitMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <Truck size={18} />
                Đánh dấu Đang Giao
              </button>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-background border border-border rounded-lg hover:bg-background-hover transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Sửa ASN
              </button>
            </>
          )}

          {asn.status === AsnStatus.InTransit && (
            <button
              onClick={() => arrivedMutation.mutate()}
              disabled={arrivedMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Đánh dấu Tới Kho
            </button>
          )}

          {(asn.status === AsnStatus.Pending || asn.status === AsnStatus.InTransit || asn.status === AsnStatus.Arrived) && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Xác nhận ASN
            </button>
          )}

          {asn.status === AsnStatus.Confirmed && linkedGr && (
            <button
              onClick={() => navigate(`/inbound/goods-receipts/${linkedGr.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Package size={18} />
              Xem Phiếu Nhận Hàng (GR)
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'overview' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Tổng quan
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('lines')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'lines' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Chi tiết hàng hóa ({asn.lines?.length || 0})
          {activeTab === 'lines' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
          )}
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              Thông tin giao nhận
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Nhà cung cấp</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.supplierName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Kho nhận</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.warehouseName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Số PO liên kết</span>
                <span className="col-span-2 font-medium text-primary cursor-pointer hover:underline" onClick={() => asn.purchaseOrderId && navigate(`/inbound/purchase-orders/${asn.purchaseOrderId}`)}>
                  {asn.poNumber || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-text-secondary">Ghi chú</span>
                <span className="col-span-2 text-text-primary">{asn.notes || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              Thông tin vận chuyển
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Đơn vị vận chuyển</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.carrierName || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Mã vận đơn</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.trackingNumber || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 pb-3">
                <span className="text-text-secondary">Tài xế</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.driverName || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-text-secondary">Biển số xe</span>
                <span className="col-span-2 font-medium text-text-primary">{asn.vehiclePlate || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:col-span-2">
             <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Thời gian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-text-secondary">Dự kiến đến</span>
                <span className="col-span-2 font-medium text-text-primary">
                  {asn.expectedArrivalDate ? new Date(asn.expectedArrivalDate).toLocaleString('vi-VN') : '-'}
                </span>
              </div>
               <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-text-secondary">Thực tế đến</span>
                <span className="col-span-2 font-medium text-text-primary">
                  {asn.actualArrivalDate ? new Date(asn.actualArrivalDate).toLocaleString('vi-VN') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Lines */}
      {activeTab === 'lines' && (
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm w-16">#</th>
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm">ĐVT</th>
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm">SL Dự Kiến</th>
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm">Lô SX (Lot)</th>
                  <th className="px-6 py-4 font-medium text-text-secondary text-sm">Hạn SD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {asn.lines?.map((line, index) => (
                  <tr key={line.id} className="hover:bg-background-hover transition-colors">
                    <td className="px-6 py-4 text-sm text-text-secondary">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{line.productName}</div>
                      <div className="text-sm text-text-secondary">{line.productSku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">{getUomName(line.uomCode)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-text-primary">
                        {new Intl.NumberFormat('vi-VN').format(line.qtyExpected)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {line.lotNumber || '-'}
                    </td>
                     <td className="px-6 py-4 text-sm text-text-secondary">
                      {line.expiryDate ? new Date(line.expiryDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
                {(!asn.lines || asn.lines.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {asn && (
        <EditAsnModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          asn={asn}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default AsnDetailPage;
