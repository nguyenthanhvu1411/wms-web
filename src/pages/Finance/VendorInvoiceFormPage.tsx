import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboundApi } from '@/api/inboundApi';
import { masterDataApi } from '@/api/masterDataApi';
import { ArrowLeft, Save, Plus, DollarSign } from 'lucide-react';
import { message, Spin } from 'antd';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { VendorInvoiceStatus, vendorInvoiceStatusLabel } from '@/types/wms-enums';
import { PermissionGuard } from '@/components/PermissionGuard/PermissionGuard';

const VendorInvoiceFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isViewMode = !!id;
  const invoiceId = Number(id);

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['vendorInvoice', invoiceId],
    queryFn: () => inboundApi.getVendorInvoiceById(invoiceId),
    enabled: isViewMode
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => masterDataApi.getSuppliers({ pageSize: 1000 })
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inboundApi.createVendorInvoice(data),
    onSuccess: () => {
      message.success('Tạo hóa đơn thành công');
      queryClient.invalidateQueries({ queryKey: ['vendorInvoices'] });
      navigate('/finance/invoices');
    },
    onError: (err: any) => message.error(err.message || 'Lỗi khi tạo')
  });

  const [formData, setFormData] = useState<any>({
    lines: []
  });

  useEffect(() => {
    if (isViewMode && invoiceData) {
      setFormData({
        invoiceNumber: invoiceData.invoiceNumber,
        supplierId: invoiceData.supplierId,
        poNumber: invoiceData.poNumber,
        invoiceDate: invoiceData.invoiceDate?.substring(0, 10),
        dueDate: invoiceData.dueDate?.substring(0, 10),
        taxAmount: invoiceData.taxAmount,
        discountAmount: invoiceData.discountAmount,
        totalAmount: invoiceData.totalAmount,
        notes: invoiceData.notes,
        lines: invoiceData.lines || []
      });
    }
  }, [isViewMode, invoiceData]);

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...(formData.lines || []), { productId: 0, qtyInvoiced: 1, unitPrice: 0, taxPercent: 0 }]
    });
  };

  const handleUpdateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...(formData.lines || [])];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleSave = () => {
    if (!formData.invoiceNumber) {
      message.error('Vui lòng nhập số hóa đơn');
      return;
    }
    createMutation.mutate(formData);
  };

  if (isViewMode && isLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  const status = invoiceData?.status as VendorInvoiceStatus || VendorInvoiceStatus.Draft;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/finance/invoices')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {isViewMode ? `Hóa đơn: ${invoiceData?.invoiceNumber}` : 'Tạo Hóa đơn (Vendor Invoice)'}
              </h1>
              {isViewMode && (
                <StatusBadge 
                  status={Object.keys(VendorInvoiceStatus).find(key => (VendorInvoiceStatus as any)[key] === status) || 'Draft'} 
                  text={vendorInvoiceStatusLabel[status] || 'Unknown'} 
                />
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">Quản lý hóa đơn mua hàng từ nhà cung cấp</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isViewMode ? (
            <PermissionGuard permissions="VendorInvoice.Create">
              <button
                onClick={handleSave}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                disabled={createMutation.isPending}
              >
                <Save size={18} /> LƯU HÓA ĐƠN
              </button>
            </PermissionGuard>
          ) : (
            <>
              {status === VendorInvoiceStatus.Matched && (
                <PermissionGuard permissions="Finance.CreatePaymentRequest">
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
                    <DollarSign size={18} /> YÊU CẦU THANH TOÁN
                  </button>
                </PermissionGuard>
              )}
              {status === VendorInvoiceStatus.Mismatched && (
                <PermissionGuard permissions="Finance.OverrideMismatch">
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2">
                    <DollarSign size={18} /> Y/C THANH TOÁN (OVERRIDE)
                  </button>
                </PermissionGuard>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Thông tin chung</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số Hóa Đơn {!isViewMode && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="Nhập số hóa đơn..."
              value={formData.invoiceNumber || ''}
              onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500"
              value={formData.supplierId || ''}
              onChange={e => setFormData({ ...formData, supplierId: Number(e.target.value) })}
              disabled={isViewMode}
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliersData?.items?.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số PO / ASN liên kết</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500"
              value={formData.poNumber || ''}
              onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hóa đơn</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500"
              value={formData.invoiceDate || ''}
              onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
              disabled={isViewMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hạn thanh toán (Due Date)</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-slate-100 disabled:text-slate-500"
              value={formData.dueDate || ''}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Chi tiết Hóa đơn</h3>
          {!isViewMode && (
            <button
              onClick={handleAddLine}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={16} /> Thêm chi tiết
            </button>
          )}
        </div>
        <div className="p-0">
          {!formData.lines || formData.lines.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Chưa có chi tiết nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-medium">
                    <th className="px-4 py-3">Product ID</th>
                    <th className="px-4 py-3 text-right">Số lượng</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thuế (%)</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.lines.map((line: any, index: number) => {
                    const lineTotal = (line.qtyInvoiced * line.unitPrice) * (1 + line.taxPercent / 100);
                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="w-full min-w-[100px] px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-primary disabled:bg-transparent disabled:border-transparent"
                            value={line.productId || ''}
                            onChange={e => handleUpdateLine(index, 'productId', Number(e.target.value))}
                            disabled={isViewMode}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            className="w-full min-w-[80px] px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-primary text-right disabled:bg-transparent disabled:border-transparent"
                            value={line.qtyInvoiced || ''}
                            onChange={e => handleUpdateLine(index, 'qtyInvoiced', Number(e.target.value))}
                            disabled={isViewMode}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="w-full min-w-[100px] px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-primary text-right disabled:bg-transparent disabled:border-transparent"
                            value={line.unitPrice || ''}
                            onChange={e => handleUpdateLine(index, 'unitPrice', Number(e.target.value))}
                            disabled={isViewMode}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            className="w-full min-w-[80px] px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-primary text-right disabled:bg-transparent disabled:border-transparent"
                            value={line.taxPercent || ''}
                            onChange={e => handleUpdateLine(index, 'taxPercent', Number(e.target.value))}
                            disabled={isViewMode}
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(lineTotal || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorInvoiceFormPage;
