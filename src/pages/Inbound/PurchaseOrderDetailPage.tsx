import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { inboundKeys } from '@/api/queryKeys';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { ArrowLeft, CheckCircle, Send, XCircle, FileText, Package, CheckSquare, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { PurchaseOrderStatus } from '@/types/wms-enums';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'related'>('overview');

  const { data: po, isLoading, isError } = useQuery({
    queryKey: inboundKeys.purchaseOrder(Number(id)),
    queryFn: () => inboundApi.getPurchaseOrderById(Number(id)),
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

  const submitMutation = useMutation({
    mutationFn: () => inboundApi.submitPurchaseOrder(Number(id)),
    onSuccess: () => {
      toast.success('Đã gửi duyệt PO thành công');
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrder(Number(id)) });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi gửi duyệt PO'),
  });

  const approveMutation = useMutation({
    mutationFn: () => inboundApi.approvePurchaseOrder(Number(id)),
    onSuccess: () => {
      toast.success('Đã duyệt PO thành công');
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrder(Number(id)) });
      queryClient.invalidateQueries({ queryKey: inboundKeys.asns });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi duyệt PO'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => inboundApi.cancelPurchaseOrder(Number(id), 'Người dùng hủy'),
    onSuccess: () => {
      toast.success('Đã hủy PO thành công');
      queryClient.invalidateQueries({ queryKey: inboundKeys.purchaseOrder(Number(id)) });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi khi hủy PO'),
  });

  if (isLoading) return <div className="p-8 text-center text-text-muted">Đang tải dữ liệu...</div>;
  if (isError || !po) return <div className="p-8 text-center text-danger">Lỗi khi tải dữ liệu PO</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/inbound/purchase-orders')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">PO: {po.poNumber}</h1>
              <StatusBadge status={
                po.status === 1 ? 'Nháp' :
                po.status === 2 ? 'Đã Gửi' :
                po.status === 3 ? 'Đã Duyệt' :
                po.status === 4 ? 'Nhận Một Phần' :
                po.status === 5 ? 'Đã Nhận Đủ' :
                po.status === 6 ? 'Hoàn Thành' : 'Đã Hủy'
              } />
            </div>
            <p className="text-text-secondary mt-1">Chi tiết đơn mua hàng</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {po.status === PurchaseOrderStatus.Draft && (
            <>
              <button
                onClick={() => navigate(`/inbound/purchase-orders/${po.id}/edit`)}
                className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors"
              >
                Sửa
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <Send size={16} /> Gửi Duyệt
              </button>
            </>
          )}

          {po.status === PurchaseOrderStatus.Submitted && (
            <>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-white border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/5 transition-colors flex items-center gap-2"
              >
                <XCircle size={16} /> Hủy
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} /> Duyệt
              </button>
            </>
          )}

          {po.status === PurchaseOrderStatus.Approved && (
            <button
              onClick={() => navigate(`/inbound/asns/create?poId=${po.id}`)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Package size={16} /> Tạo ASN
            </button>
          )}
        </div>
      </div>

      {/* Stepper (Simplified) */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6 overflow-hidden">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
          
          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${po.status >= PurchaseOrderStatus.Draft ? 'bg-primary' : 'bg-slate-200 text-slate-400'}`}>
              <FileText size={20} />
            </div>
            <span className="text-xs font-medium text-text-secondary">Tạo Mới</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${po.status >= PurchaseOrderStatus.Submitted ? 'bg-primary' : 'bg-slate-200 text-slate-400'}`}>
              <Send size={20} />
            </div>
            <span className="text-xs font-medium text-text-secondary">Gửi Duyệt</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${po.status >= PurchaseOrderStatus.Approved ? 'bg-primary' : 'bg-slate-200 text-slate-400'}`}>
              <CheckSquare size={20} />
            </div>
            <span className="text-xs font-medium text-text-secondary">Đã Duyệt</span>
          </div>

          <div className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${po.status >= PurchaseOrderStatus.PartiallyReceived ? 'bg-primary' : 'bg-slate-200 text-slate-400'}`}>
              <LogIn size={20} />
            </div>
            <span className="text-xs font-medium text-text-secondary">Nhận Hàng</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'lines'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
          >
            Dòng Hàng {po.lines?.length ? `(${po.lines.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'related'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
            }`}
          >
            Chứng Từ Liên Quan
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Thông tin chung</h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Nhà Cung Cấp</span>
                    <span className="font-medium text-text-primary">{po.supplierCode} - {po.supplierName}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Kho Nhận Hàng</span>
                    <span className="font-medium text-text-primary">{po.warehouseCode} - {po.warehouseName}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Ngày Đặt Hàng</span>
                    <span className="font-medium text-text-primary">{new Date(po.orderDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Dự Kiến Giao</span>
                    <span className="font-medium text-text-primary">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Ngày Thực Giao</span>
                    <span className="font-medium text-text-primary">{po.actualDeliveryDate ? new Date(po.actualDeliveryDate).toLocaleDateString('vi-VN') : '-'}</span>
                  </div>
                  {po.approvedBy && (
                    <div className="flex justify-between pb-3 border-b border-border/50">
                      <span className="text-text-secondary">Người Duyệt</span>
                      <span className="font-medium text-text-primary">{po.approvedBy} ({new Date(po.approvedAt!).toLocaleDateString('vi-VN')})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Tài Chính & Ghi Chú</h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Tổng Tiền (Chưa VAT)</span>
                    <span className="font-medium text-text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: po.currency || 'VND' }).format(po.totalAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary">Thuế VAT</span>
                    <span className="font-medium text-text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: po.currency || 'VND' }).format(po.taxAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-border/50">
                    <span className="text-text-secondary font-medium">Tổng Cộng</span>
                    <span className="font-bold text-lg text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: po.currency || 'VND' }).format(po.grandTotal || 0)}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-text-secondary block mb-1">Ghi chú:</span>
                    <p className="text-sm text-text-primary bg-slate-50 p-3 rounded-lg border border-border">{po.notes || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lines' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border text-sm text-text-muted bg-slate-50">
                    <th className="py-3 px-4 font-medium">Sản Phẩm</th>
                    <th className="py-3 px-4 font-medium">ĐVT</th>
                    <th className="py-3 px-4 font-medium text-right">SL Đặt</th>
                    <th className="py-3 px-4 font-medium text-right">SL Đã Nhận</th>
                    <th className="py-3 px-4 font-medium text-right">Đơn Giá</th>
                    <th className="py-3 px-4 font-medium text-right">Chiết Khấu</th>
                    <th className="py-3 px-4 font-medium text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(po.lines || []).map((line, index: number) => (
                    <tr key={line.id || index} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-text-primary">{line.productSku}</p>
                        <p className="text-xs text-text-muted">{line.productName}</p>
                      </td>
                      <td className="py-3 px-4">{getUomName(line.uomCode)}</td>
                      <td className="py-3 px-4 text-right font-medium">{line.qtyOrdered}</td>
                      <td className="py-3 px-4 text-right text-success font-medium">{line.qtyReceived || 0}</td>
                      <td className="py-3 px-4 text-right">{new Intl.NumberFormat('vi-VN').format(line.unitPrice)}</td>
                      <td className="py-3 px-4 text-right">{line.discountPercent}%</td>
                      <td className="py-3 px-4 text-right font-medium text-text-primary">{new Intl.NumberFormat('vi-VN').format(line.lineTotal)}</td>
                    </tr>
                  ))}
                  {(!po.lines || po.lines.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">Không có dòng hàng nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'related' && (
            <div>
              <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Chứng từ đã liên kết</h3>
              {po.linkedAsnId ? (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Package className="text-primary" size={24} />
                    <div>
                      <p className="font-medium text-text-primary">Advance Shipping Notice (ASN)</p>
                      <p className="text-sm text-text-secondary">Đã tự động tạo từ PO này</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/inbound/asns/${po.linkedAsnId}`)}
                    className="px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Xem Chi Tiết
                  </button>
                </div>
              ) : (
                <p className="text-text-secondary italic">Chưa có chứng từ liên kết.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
