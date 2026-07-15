import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/Auth/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import ProductListPage from '@/pages/MasterData/ProductListPage';
import ProductFormPage from '@/pages/MasterData/ProductFormPage';
import ProductDetailPage from '@/pages/MasterData/ProductDetailPage';
import CategoryListPage from '@/pages/MasterData/CategoryListPage';
import UomListPage from '@/pages/MasterData/UomListPage';
import SupplierListPage from '@/pages/MasterData/SupplierListPage';
import SupplierFormPage from '@/pages/MasterData/SupplierFormPage';
import SupplierDetailPage from '@/pages/MasterData/SupplierDetailPage';
import WarehouseListPage from '@/pages/MasterData/WarehouseListPage';
import WarehouseFormPage from '@/pages/MasterData/WarehouseFormPage';
import WarehouseDetailPage from '@/pages/MasterData/WarehouseDetailPage';
import LocationListPage from '@/pages/MasterData/LocationListPage';
import LocationFormPage from '@/pages/MasterData/LocationFormPage';
import PurchaseOrderListPage from '@/pages/Inbound/PurchaseOrderListPage';
import PurchaseOrderFormPage from '@/pages/Inbound/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from '@/pages/Inbound/PurchaseOrderDetailPage';
import GoodsReceiptListPage from '@/pages/Inbound/GoodsReceiptListPage';
import GoodsReceiptDetailPage from '@/pages/Inbound/GoodsReceiptDetailPage';
import AdvanceShippingNoticeListPage from '@/pages/Inbound/AdvanceShippingNoticeListPage';
import AsnFormPage from '@/pages/Inbound/AsnFormPage';
import AsnDetailPage from '@/pages/Inbound/AsnDetailPage';
import QualityCheckListPage from '@/pages/Inbound/QualityCheckListPage';

import QualityCheckDetailPage from '@/pages/Inbound/QualityCheckDetailPage';
import PutawayTaskListPage from '@/pages/Inbound/PutawayTaskListPage';
import PutawayTaskDetailPage from '@/pages/Inbound/PutawayTaskDetailPage';

import StockBalancePage from '@/pages/Stock/StockBalancePage';
import StockTransactionPage from '@/pages/Stock/StockTransactionPage';
import InventoryReconciliationPage from '@/pages/Stock/InventoryReconciliationPage';
import OpeningStockPage from '@/pages/Stock/OpeningStockPage';
import StockAdjustmentPage from '@/pages/Stock/StockAdjustmentPage';
import LowStockPage from '@/pages/Stock/LowStockPage';
import ExpiryAlertPage from '@/pages/Stock/ExpiryAlertPage';
import LotListPage from '@/pages/Stock/LotListPage';
import SerialListPage from '@/pages/Stock/SerialListPage';
import SalesOrderListPage from '@/pages/Outbound/SalesOrders/SalesOrderListPage';
import SalesOrderFormPage from '@/pages/Outbound/SalesOrders/SalesOrderFormPage';
import SalesOrderDetailPage from '@/pages/Outbound/SalesOrders/SalesOrderDetailPage';
import AllocationPage from '@/pages/Outbound/Allocation/AllocationPage';
import PickingOrderListPage from '@/pages/Outbound/Picking/PickingOrderListPage';
import PickingOrderDetailPage from '@/pages/Outbound/Picking/PickingOrderDetailPage';
import PackingStationPage from '@/pages/Outbound/Shipping/PackingStationPage';
import ShippingPackageListPage from '@/pages/Outbound/Shipping/ShippingPackageListPage';
import ShippingPackageDetailPage from '@/pages/Outbound/Shipping/ShippingPackageDetailPage';

import CustomerReturnListPage from '@/pages/Returns/CustomerReturns/CustomerReturnListPage';
import CustomerReturnFormPage from '@/pages/Returns/CustomerReturns/CustomerReturnFormPage';
import CustomerReturnDetailPage from '@/pages/Returns/CustomerReturns/CustomerReturnDetailPage';
import VendorReturnListPage from '@/pages/Returns/VendorReturns/VendorReturnListPage';
import VendorReturnFormPage from '@/pages/Returns/VendorReturns/VendorReturnFormPage';
import VendorReturnDetailPage from '@/pages/Returns/VendorReturns/VendorReturnDetailPage';
import TransferListPage from '@/pages/Transfers/TransferListPage';
import TransferFormPage from '@/pages/Transfers/TransferFormPage';
import TransferDetailPage from '@/pages/Transfers/TransferDetailPage';
import CycleCountListPage from '@/pages/CycleCounts/CycleCountListPage';
import CycleCountDashboardPage from '@/pages/CycleCounts/CycleCountDashboardPage';
import CycleCountFormPage from '@/pages/CycleCounts/CycleCountFormPage';
import CycleCountDetailPage from '@/pages/CycleCounts/CycleCountDetailPage';
import VendorInvoiceListPage from '@/pages/Finance/VendorInvoiceListPage';
import UserManagementPage from '@/pages/System/UserManagementPage';
import AuditLogPage from '@/pages/System/AuditLogPage';
import SettingsPage from '@/pages/System/SettingsPage';
import NotificationsPage from '@/pages/System/NotificationsPage';
import VendorInvoiceFormPage from '@/pages/Finance/VendorInvoiceFormPage';
import MatchListPage from '@/pages/Finance/MatchListPage';
import PaymentRequestListPage from '@/pages/Finance/PaymentRequestListPage';
import FinanceDashboardPage from '@/pages/Finance/FinanceDashboardPage';
import ApAgingReportPage from '@/pages/Finance/ApAgingReportPage';
import InventoryReportPage from '@/pages/Reports/InventoryReportPage';
import InboundOutboundReportPage from '@/pages/Reports/InboundOutboundReportPage';
import KpiReportPage from '@/pages/Reports/KpiReportPage';
import ReportsDashboardPage from '@/pages/Reports/ReportsDashboardPage';
import LowStockReportPage from '@/pages/Reports/LowStockReportPage';
import ExpiryReportPage from '@/pages/Reports/ExpiryReportPage';
import SupplierPerformancePage from '@/pages/Reports/SupplierPerformancePage';
import CycleCountVarianceReportPage from '@/pages/Reports/CycleCountVarianceReportPage';
import AbcAnalysisReportPage from '@/pages/Reports/AbcAnalysisReportPage';

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'master-data',
            children: [
              {
                path: 'products',
                element: <ProductListPage />,
              },
              {
                path: 'products/create',
                element: <ProductFormPage />,
              },
              {
                path: 'products/:id',
                element: <ProductDetailPage />,
              },
              {
                path: 'products/:id/edit',
                element: <ProductFormPage />,
              },
              {
                path: 'categories',
                element: <CategoryListPage />,
              },
              {
                path: 'uoms',
                element: <UomListPage />,
              },
              {
                path: 'suppliers',
                element: <SupplierListPage />,
              },
              {
                path: 'suppliers/create',
                element: <SupplierFormPage />,
              },
              {
                path: 'suppliers/:id',
                element: <SupplierDetailPage />,
              },
              {
                path: 'suppliers/:id/edit',
                element: <SupplierFormPage />,
              },
              {
                path: 'warehouses',
                element: <WarehouseListPage />,
              },
              {
                path: 'warehouses/create',
                element: <WarehouseFormPage />,
              },
              {
                path: 'warehouses/:id',
                element: <WarehouseDetailPage />,
              },
              {
                path: 'warehouses/:id/edit',
                element: <WarehouseFormPage />,
              },
              {
                path: 'locations',
                element: <LocationListPage />,
              },
              {
                path: 'locations/create',
                element: <LocationFormPage />,
              },
              {
                path: 'locations/:id/edit',
                element: <LocationFormPage />,
              },
            ],
          },
          {
            path: 'inbound',
            children: [
              {
                path: 'purchase-orders',
                element: <PurchaseOrderListPage />
              },
              {
                path: 'purchase-orders/create',
                element: <PurchaseOrderFormPage />
              },
              {
                path: 'purchase-orders/:id',
                element: <PurchaseOrderDetailPage />
              },
              {
                path: 'purchase-orders/:id/edit',
                element: <PurchaseOrderFormPage />
              },
              {
                path: 'goods-receipts',
                element: <GoodsReceiptListPage />
              },
              {
                path: 'goods-receipts/:id',
                element: <GoodsReceiptDetailPage />
              },
              {
                path: 'asns',
                element: <AdvanceShippingNoticeListPage />
              },
              {
                path: 'asns/create',
                element: <AsnFormPage />
              },
              {
                path: 'asns/:id',
                element: <AsnDetailPage />
              },
              {
                path: 'quality-checks',
                element: <QualityCheckListPage />
              },

              {
                path: 'quality-checks/:id',
                element: <QualityCheckDetailPage />
              },
              {
                path: 'putaway-tasks',
                element: <PutawayTaskListPage />
              },
              {
                path: 'putaway-tasks/:id',
                element: <PutawayTaskDetailPage />
              },

            ]
          },
          {
            path: 'stock',
            children: [
              {
                path: 'balance',
                element: <StockBalancePage />
              },
              {
                path: 'transactions',
                element: <StockTransactionPage />
              },
              {
                path: 'reconciliation',
                element: <InventoryReconciliationPage />
              },
              {
                path: 'opening',
                element: <OpeningStockPage />
              },
              {
                path: 'adjustments',
                element: <StockAdjustmentPage />
              },
              {
                path: 'low-stock',
                element: <LowStockPage />
              },
              {
                path: 'expiry-alert',
                element: <ExpiryAlertPage />
              },
              {
                path: 'lots',
                element: <LotListPage />
              },
              {
                path: 'serials',
                element: <SerialListPage />
              }
            ]
          },
          {
            path: 'outbound',
            children: [
              {
                path: 'sales-orders',
                element: <SalesOrderListPage />
              },
              {
                path: 'sales-orders/create',
                element: <SalesOrderFormPage />
              },
              {
                path: 'sales-orders/:id',
                element: <SalesOrderDetailPage />
              },
              {
                path: 'sales-orders/:id/edit',
                element: <SalesOrderFormPage />
              },
              {
                path: 'allocation',
                element: <AllocationPage />
              },
              {
                path: 'picking',
                element: <PickingOrderListPage />
              },
              {
                path: 'picking/:id',
                element: <PickingOrderDetailPage />
              },
              {
                path: 'packing/:id',
                element: <PackingStationPage />
              },
              {
                path: 'shipping',
                element: <ShippingPackageListPage />
              },
              {
                path: 'shipping/:id',
                element: <ShippingPackageDetailPage />
              }
            ]
          },
          {
            path: 'transfers',
            children: [
              {
                index: true,
                element: <TransferListPage />
              },
              {
                path: 'create',
                element: <TransferFormPage />
              },
              {
                path: ':id',
                element: <TransferDetailPage />
              },
              {
                path: ':id/edit',
                element: <TransferFormPage />
              }
            ]
          },
          {
            path: 'returns',
            children: [
              {
                path: 'customer',
                element: <CustomerReturnListPage />
              },
              {
                path: 'customer/create',
                element: <CustomerReturnFormPage />
              },
              {
                path: 'customer/:id',
                element: <CustomerReturnDetailPage />
              },
              {
                path: 'customer/:id/edit',
                element: <CustomerReturnFormPage />
              },
              {
                path: 'vendor',
                element: <VendorReturnListPage />
              },
              {
                path: 'vendor/create',
                element: <VendorReturnFormPage />
              },
              {
                path: 'vendor/:id',
                element: <VendorReturnDetailPage />
              },
              {
                path: 'vendor/:id/edit',
                element: <VendorReturnFormPage />
              }
            ]
          },
          {
            path: 'cycle-counts',
            children: [
              {
                index: true,
                element: <CycleCountListPage />
              },
              {
                path: 'dashboard',
                element: <CycleCountDashboardPage />
              },
              {
                path: 'create',
                element: <CycleCountFormPage />
              },
              {
                path: ':id',
                element: <CycleCountDetailPage />
              },
              {
                path: ':id/edit',
                element: <CycleCountFormPage />
              }
            ]
          },
          {
            path: 'finance',
            children: [
              {
                index: true,
                element: <Navigate to="/finance/dashboard" replace />
              },
              {
                path: 'dashboard',
                element: <FinanceDashboardPage />
              },
              {
                path: 'invoices',
                element: <VendorInvoiceListPage />
              },
              {
                path: 'invoices/create',
                element: <VendorInvoiceFormPage />
              },
              {
                path: 'invoices/:id',
                element: <VendorInvoiceFormPage />
              },
              {
                path: 'matches',
                element: <MatchListPage />
              },
              {
                path: 'payments',
                element: <PaymentRequestListPage />
              },
              {
                path: 'ap-aging',
                element: <ApAgingReportPage />
              }
            ]
          },
          {
            path: 'reports',
            children: [
              {
                path: 'dashboard',
                element: <ReportsDashboardPage />
              },
              {
                path: 'inventory',
                element: <InventoryReportPage />
              },
              {
                path: 'inbound-outbound',
                element: <InboundOutboundReportPage />
              },
              {
                path: 'kpi',
                element: <KpiReportPage />
              },
              {
                path: 'low-stock',
                element: <LowStockReportPage />
              },
              {
                path: 'expiry',
                element: <ExpiryReportPage />
              },
              {
                path: 'supplier-performance',
                element: <SupplierPerformancePage />
              },
              {
                path: 'cycle-count-variance',
                element: <CycleCountVarianceReportPage />
              },
              {
                path: 'abc-analysis',
                element: <AbcAnalysisReportPage />
              }
            ]
          },
          {
            path: 'system',
            children: [
              {
                path: 'users',
                element: <UserManagementPage />
              },
              {
                path: 'audit',
                element: <AuditLogPage />
              },
              {
                path: 'settings',
                element: <SettingsPage />
              },
              {
                path: 'notifications',
                element: <NotificationsPage />
              }
            ]
          }
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
