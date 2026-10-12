import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import {
  AdminDashboardKPIs,
  DbCustomerDirectoryItem,
  DbInventoryAuditLog,
  DbInventoryItem,
  DbPaymentIssue,
  DbQrVersion,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PaymentIssueStatus,
  PriceAuditLog,
  SalesReportResponse,
} from '../server/types';
import { ProductVariant } from '../types/catalogue';
import { formatPaiseToRupees } from '../utils/formatters';

interface AdminViewProps {
  onBackToCustomerSite: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'qr'
  | 'support'
  | 'customers'
  | 'reports'
  | 'catalogue'
  | 'audit'
  | 'settings';

export const AdminView: React.FC<AdminViewProps> = ({ onBackToCustomerSite }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('astar0017@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [passwordChangeError, setPasswordChangeError] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('astar0017@gmail.com');

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Core Data State
  const [kpis, setKpis] = useState<AdminDashboardKPIs | null>(null);
  const [orders, setOrders] = useState<DemoOrderRecordWithItems[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [auditLogs, setAuditLogs] = useState<PriceAuditLog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<DbInventoryItem[]>([]);
  const [inventoryAuditLogs, setInventoryAuditLogs] = useState<DbInventoryAuditLog[]>([]);
  const [qrVersions, setQrVersions] = useState<DbQrVersion[]>([]);
  const [paymentIssues, setPaymentIssues] = useState<DbPaymentIssue[]>([]);
  const [customers, setCustomers] = useState<DbCustomerDirectoryItem[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filters State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState<boolean>(false);
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [reportRange, setReportRange] = useState<'today' | '7d' | '30d' | 'all'>('today');

  // Modals & Selected Items
  const [selectedOrder, setSelectedOrder] = useState<DemoOrderRecordWithItems | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [newPriceRupees, setNewPriceRupees] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  // Inventory Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<DbInventoryItem | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Physical count verification');

  // QR Upload Form
  const [showQrUploadModal, setShowQrUploadModal] = useState<boolean>(false);
  const [uploadQrLabel, setUploadQrLabel] = useState<string>('');
  const [uploadQrVpa, setUploadQrVpa] = useState<string>('');
  const [uploadQrAccountName, setUploadQrAccountName] = useState<string>('');
  const [uploadQrImageDataUri, setUploadQrImageDataUri] = useState<string>('');
  const [uploadQrError, setUploadQrError] = useState<string>('');

  // Payment Issue Manage Modal
  const [managingIssue, setManagingIssue] = useState<DbPaymentIssue | null>(null);
  const [issueNewStatus, setIssueNewStatus] = useState<PaymentIssueStatus>('IN_PROGRESS');
  const [issueStaffNotes, setIssueStaffNotes] = useState<string>('');

  // Customer Detail Drawer
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<{
    customer: DbCustomerDirectoryItem;
    orders: DemoOrderRecordWithItems[];
  } | null>(null);

  const notificationTimeoutRef = useRef<any>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      try {
        setNotification(null);
      } catch {}
    }, 4000);
  };

  // Click outside to close More dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check existing session
  useEffect(() => {
    apiClient
      .checkAdminAuthSession()
      .then((session) => {
        if (session.authenticated) {
          if (session.operatorId || session.email) {
            setOperatorId(session.operatorId || session.email || 'astar0017@gmail.com');
          }
          setIsAuthenticated(true);
          setMustChangePassword(Boolean(session.mustChangePassword));
        } else {
          setIsAuthenticated(false);
          setMustChangePassword(false);
          setAuthError('');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setMustChangePassword(false);
      });
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        kpisData,
        ordersData,
        variantsData,
        auditData,
        invData,
        invLogsData,
        qrData,
        issuesData,
        custData,
        reportData,
      ] = await Promise.all([
        apiClient.getDashboardKPIs(),
        apiClient.getAdminOrders(),
        apiClient.getAdminVariants(),
        apiClient.getAuditLogs(),
        apiClient.getAdminInventory().catch(() => []),
        apiClient.getInventoryAuditLogs().catch(() => []),
        apiClient.getAdminQrVersions().catch(() => []),
        apiClient.getAdminPaymentIssues().catch(() => []),
        apiClient.getAdminCustomers().catch(() => []),
        apiClient.getAdminSalesReport(reportRange).catch(() => null),
      ]);

      setKpis(kpisData);
      setOrders(ordersData);
      setVariants(variantsData);
      setAuditLogs(auditData);
      setInventoryItems(invData);
      setInventoryAuditLogs(invLogsData);
      setQrVersions(qrData);
      setPaymentIssues(issuesData);
      setCustomers(custData);
      setSalesReport(reportData);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to refresh admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      loadAllData();
    }
  }, [isAuthenticated, mustChangePassword, reportRange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await apiClient.adminLogin(email, password);
      if (res.operatorId || res.email) {
        setOperatorId(res.operatorId || res.email);
      }
      setIsAuthenticated(true);
      if (res.mustChangePassword) {
        setMustChangePassword(true);
        setCurrentPassword(password);
        showNotification('Login successful. Password change is required.', 'error');
      } else {
        setMustChangePassword(false);
        showNotification('Administrator console unlocked.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    if (newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordChangeError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.adminChangePassword(currentPassword, newPassword);
      setMustChangePassword(false);
      setPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showNotification('Password updated successfully. Console unlocked.');
      loadAllData();
    } catch (err: any) {
      setPasswordChangeError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.adminLogout();
    } catch {}
    setIsAuthenticated(false);
    setMustChangePassword(false);
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    showNotification('Logged out from admin console.');
  };

  // Order Operational Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OperationalStatus) => {
    try {
      const updated = await apiClient.updateOrderStatus(orderId, newStatus, operatorId);
      showNotification(`Order status updated to ${newStatus}.`);
      setSelectedOrder(updated);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update order status', 'error');
    }
  };

  // Price Editing Actions
  const openPriceEditModal = (v: ProductVariant) => {
    setEditingVariant(v);
    const currPrice = v.demoPricePaise ?? v.pricePaise;
    setNewPriceRupees(currPrice ? (currPrice / 100).toString() : '');
    setOverrideReason('');
    setAllowOverride(false);
  };

  const handleSaveDemoPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    const priceNum = parseFloat(newPriceRupees);
    if (isNaN(priceNum) || priceNum <= 0) {
      showNotification('Please enter a valid price in Rupees', 'error');
      return;
    }

    const pricePaise = Math.round(priceNum * 100);

    try {
      const updated = await apiClient.updateVariantDemoPrice(
        editingVariant.id,
        pricePaise,
        operatorId,
        overrideReason,
        allowOverride
      );
      showNotification(`Price for "${updated.name}" updated to ₹${priceNum.toFixed(2)}.`);
      setEditingVariant(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update price', 'error');
    }
  };

  // Stock Adjustment Actions
  const openStockAdjustModal = (item: DbInventoryItem) => {
    setAdjustingItem(item);
    setAdjustNewStock(item.current_stock.toString());
    setAdjustReason('Physical count verification');
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const stockNum = parseInt(adjustNewStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      showNotification('Please enter a valid non-negative physical stock count', 'error');
      return;
    }

    try {
      await apiClient.adjustInventoryStock(
        adjustingItem.variant_id,
        stockNum,
        operatorId,
        adjustReason
      );
      showNotification(`Stock for ${adjustingItem.variant_name} updated to ${stockNum}.`);
      setAdjustingItem(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to adjust stock', 'error');
    }
  };

  // QR Code Upload Actions
  const handleQrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadQrError('Image size exceeds 2 MB limit.');
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setUploadQrError('Only PNG and JPEG formats are supported.');
      return;
    }

    setUploadQrError('');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadQrImageDataUri(reader.result as string);
    };
    reader.onerror = () => {
      setUploadQrError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadNewQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadQrLabel.trim() || !uploadQrVpa.trim() || !uploadQrAccountName.trim()) {
      setUploadQrError('Please fill in all QR metadata fields.');
      return;
    }

    if (!uploadQrImageDataUri) {
      setUploadQrError('Please choose a valid PNG or JPEG image file.');
      return;
    }

    try {
      await apiClient.uploadAdminQr({
        label: uploadQrLabel.trim(),
        vpa: uploadQrVpa.trim(),
        accountName: uploadQrAccountName.trim(),
        imageDataUri: uploadQrImageDataUri,
        operatorId,
      });

      showNotification('New draft QR version uploaded successfully.');
      setShowQrUploadModal(false);
      setUploadQrLabel('');
      setUploadQrVpa('');
      setUploadQrAccountName('');
      setUploadQrImageDataUri('');
      loadAllData();
    } catch (err: any) {
      setUploadQrError(err?.message || 'Upload failed.');
    }
  };

  const handleActivateQrVersion = async (qrId: string) => {
    const notes = window.prompt('Enter optional activation notes / change reason:') || undefined;
    try {
      await apiClient.activateAdminQr(qrId, notes);
      showNotification('QR version activated successfully.');
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to activate QR version', 'error');
    }
  };

  const handleDeactivateQrVersion = async (qrId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this QR version?')) return;
    try {
      await apiClient.deactivateAdminQr(qrId);
      showNotification('QR version deactivated.');
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to deactivate QR version', 'error');
    }
  };

  // Payment Support Issue Actions
  const openManageIssueModal = (issue: DbPaymentIssue) => {
    setManagingIssue(issue);
    setIssueNewStatus(issue.status);
    setIssueStaffNotes(issue.staff_notes || '');
  };

  const handleSavePaymentIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingIssue) return;

    try {
      await apiClient.updatePaymentIssueStatus(
        managingIssue.id,
        issueNewStatus,
        issueStaffNotes.trim() || undefined
      );
      showNotification(`Ticket ${managingIssue.issue_reference} marked as ${issueNewStatus}.`);
      setManagingIssue(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update issue status', 'error');
    }
  };

  // Customer Detail Drawer
  const openCustomerDetail = async (custId: string) => {
    try {
      const details = await apiClient.getAdminCustomerDetails(custId);
      setSelectedCustomerDetail(details);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to load customer profile', 'error');
    }
  };

  // Export Sales Report CSV
  const handleExportCsv = async () => {
    try {
      const csvText = await apiClient.exportAdminSalesReportCsv(reportRange);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `nagarjuna-sales-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Sales report exported to CSV successfully.');
    } catch (err: any) {
      showNotification(err?.message || 'Failed to export CSV', 'error');
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.operational_status !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchRef = o.order_reference.toLowerCase().includes(q);
      const matchName = o.customer_name.toLowerCase().includes(q);
      const matchMobile = o.customer_mobile.includes(q);
      return matchRef || matchName || matchMobile;
    }
    return true;
  });

  // Filtered inventory list
  const filteredInventory = inventoryItems.filter((it) => {
    if (inventoryLowStockOnly && !it.is_low_stock) {
      return false;
    }
    if (inventorySearchQuery.trim()) {
      const q = inventorySearchQuery.toLowerCase();
      const matchId = it.variant_id.toLowerCase().includes(q);
      const matchName = it.variant_name.toLowerCase().includes(q);
      const matchProd = it.product_name.toLowerCase().includes(q);
      return matchId || matchName || matchProd;
    }
    return true;
  });

  // Filtered payment issues
  const filteredIssues = paymentIssues.filter((iss) => {
    if (issueStatusFilter !== 'all' && iss.status !== issueStatusFilter) {
      return false;
    }
    return true;
  });

  // Filtered customers list
  const filteredCustomers = customers.filter((c) => {
    if (customerSearchQuery.trim()) {
      const q = customerSearchQuery.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.mobile_number.includes(q)
      );
    }
    return true;
  });

  const lowStockCount = inventoryItems.filter((i) => i.is_low_stock).length;
  const openIssuesCount = paymentIssues.filter(
    (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'
  ).length;

  // Active sub-tab under More (if active)
  const isMoreActive = ['support', 'customers', 'reports', 'audit', 'settings'].includes(activeTab);
  const getMoreActiveLabel = () => {
    switch (activeTab) {
      case 'support':
        return 'Payment Issues';
      case 'customers':
        return 'Customers';
      case 'reports':
        return 'Sales Reports';
      case 'audit':
        return 'Audit Logs';
      case 'settings':
        return 'Settings';
      default:
        return 'More';
    }
  };

  // Orders needing attention: unverified UTR or status submitted/confirmed/preparing
  const ordersRequiringAttention = orders.filter(
    (o) =>
      o.operational_status === 'SUBMITTED' ||
      o.operational_status === 'CONFIRMED' ||
      o.operational_status === 'PREPARING' ||
      Boolean(o.payment_reference)
  );

  const lowStockItems = inventoryItems.filter((i) => i.is_low_stock);
  const openPaymentIssues = paymentIssues.filter(
    (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'
  );

  // If not authenticated, render clean branded Owner Administration portal card
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200 mb-3 tracking-wide">
            NAGARJUNA TRADERS • OWNER HUB
          </span>
          <h1 className="text-xl font-bold font-display text-stone-900 mb-2">
            Owner Administration Portal
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed mb-6">
            Secure administrative console for order management, catalogue verification, inventory adjustments, and sales reports.
          </p>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 text-left space-y-1">
              <strong className="block font-semibold text-red-900">Authentication Error:</strong>
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Owner Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-touch bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs py-3 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {loading ? 'Authenticating...' : 'Sign In to Owner Portal'}
            </button>
          </form>

          <div className="pt-4 mt-4 text-center border-t border-stone-200">
            <button
              type="button"
              onClick={onBackToCustomerSite}
              className="text-xs text-stone-600 hover:text-stone-900 underline"
            >
              ← Return to Customer Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory password change screen when mustChangePassword is true
  if (mustChangePassword) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white border border-amber-300 rounded-2xl p-6 md:p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 mb-3 tracking-wide">
            SECURITY ACTION REQUIRED
          </span>
          <h1 className="text-xl font-bold font-display text-stone-900 mb-2">
            Change Initial Password
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed mb-6">
            For security, you must replace the temporary password with a new personal password (minimum 8 characters) before accessing the owner dashboard.
          </p>

          {passwordChangeError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 text-left space-y-1">
              <strong className="block font-semibold text-red-900">Password Update Error:</strong>
              <p className="leading-relaxed">{passwordChangeError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                New Password (min 8 chars)
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-touch bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs py-3 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? 'Updating Password...' : 'Save Password & Enter Dashboard'}
            </button>
          </form>

          <div className="pt-4 mt-4 text-center border-t border-stone-200">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-stone-600 hover:text-stone-900 underline"
            >
              Cancel and Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Admin Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold font-display text-stone-900">
              Nagarjuna Traders Admin Panel
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Operator: <span className="text-stone-700 font-mono font-medium">{operatorId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 transition-colors shadow-sm"
          >
            {loading ? 'Refreshing...' : '↻ Refresh Data'}
          </button>
          <button
            onClick={onBackToCustomerSite}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 transition-colors shadow-sm"
          >
            Customer Site →
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Simplified Navigation Bar: 5 Primary Destinations + More Dropdown */}
      <div className="bg-white border border-stone-200 rounded-xl p-1.5 shadow-sm mb-6">
        {/* Mobile Nav Toggle */}
        <div className="sm:hidden flex items-center justify-between p-1">
          <span className="text-xs font-bold text-stone-800">
            Navigation: <span className="text-orange-700">{isMoreActive ? getMoreActiveLabel() : activeTab.toUpperCase()}</span>
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="px-2.5 py-1 text-xs font-medium bg-stone-100 border border-stone-300 rounded-lg text-stone-700"
          >
            {isMobileMenuOpen ? 'Close Menu ✕' : 'Menu ☰'}
          </button>
        </div>

        {/* Navigation Destinations */}
        <div className={`sm:flex flex-wrap items-center justify-between gap-1.5 ${isMobileMenuOpen ? 'flex flex-col pt-2 border-t border-stone-100 sm:border-t-0' : 'hidden sm:flex'}`}>
          {/* 5 Primary Destinations */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {/* 1. Overview */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                activeTab === 'dashboard'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>Overview &amp; KPIs</span>
            </button>

            {/* 2. Orders */}
            <button
              onClick={() => {
                setActiveTab('orders');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                activeTab === 'orders'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>Orders</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'orders' ? 'bg-orange-800 text-white' : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {orders.length}
              </span>
            </button>

            {/* 3. Catalogue & Pricing */}
            <button
              onClick={() => {
                setActiveTab('catalogue');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                activeTab === 'catalogue'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>Catalogue &amp; Pricing</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'catalogue' ? 'bg-orange-800 text-white' : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}>
                {variants.length}
              </span>
            </button>

            {/* 4. Inventory */}
            <button
              onClick={() => {
                setActiveTab('inventory');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                activeTab === 'inventory'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>Inventory &amp; Stock</span>
              {lowStockCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'inventory' ? 'bg-red-800 text-white' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {lowStockCount} LOW
                </span>
              )}
            </button>

            {/* 5. Payments & QR */}
            <button
              onClick={() => {
                setActiveTab('qr');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                activeTab === 'qr'
                  ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-200'
              }`}
            >
              <span>Payments &amp; QR</span>
              <span className="sr-only">Versions</span>
              {(() => {
                const activeVer = qrVersions.find((q) => q.is_active === 1);
                return activeVer ? (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                    activeTab === 'qr' ? 'bg-orange-800 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    v{activeVer.version_number}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-50 text-red-700 border border-red-200">
                    None
                  </span>
                );
              })()}
            </button>
          </div>

          {/* More Dropdown Menu */}
          <div className="relative w-full sm:w-auto" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center justify-between sm:justify-start gap-1.5 shadow-sm border ${
                isMoreActive
                  ? 'bg-stone-900 text-white border-stone-950 font-bold'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-stone-300'
              }`}
            >
              <span>{isMoreActive ? `More (${getMoreActiveLabel()})` : 'More'}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Options */}
            <div
              className={`absolute right-0 top-full mt-1.5 w-full sm:w-56 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 z-30 transition-all ${
                isMoreOpen
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <button
                onClick={() => {
                  setActiveTab('support');
                  setIsMoreOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  activeTab === 'support'
                    ? 'bg-orange-50 text-orange-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>Payment Issues</span>
                {openIssuesCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300">
                    {openIssuesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('customers');
                  setIsMoreOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'customers'
                    ? 'bg-orange-50 text-orange-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>Customers</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsMoreOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-orange-50 text-orange-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>Sales Reports</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  setIsMoreOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-orange-50 text-orange-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>Audit Logs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMoreOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-orange-50 text-orange-900 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & KPIS ─────────────────────────────────── */}
      {activeTab === 'dashboard' && kpis && (
        <div className="space-y-6">
          {/* Key Figures in a Clean 6-KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* KPI 1: Total Orders */}
            <div
              onClick={() => {
                setOrderStatusFilter('all');
                setActiveTab('orders');
              }}
              className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-stone-600">Total Orders</p>
              <p className="text-2xl font-bold font-mono text-stone-900 mt-1">
                {kpis.totalOrders}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">All customer bookings</p>
            </div>

            {/* KPI 2: Orders Awaiting Confirmation or Preparation */}
            <div
              onClick={() => {
                setOrderStatusFilter('SUBMITTED');
                setActiveTab('orders');
              }}
              className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-amber-800">Needs Preparation</p>
              <p className="text-2xl font-bold font-mono text-amber-800 mt-1">
                {orders.filter(
                  (o) =>
                    o.operational_status === 'SUBMITTED' ||
                    o.operational_status === 'CONFIRMED' ||
                    o.operational_status === 'PREPARING'
                ).length}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Awaiting packing or prep</p>
            </div>

            {/* KPI 3: UTR Submissions Awaiting Verification */}
            <div
              onClick={() => {
                setOrderStatusFilter('all');
                setActiveTab('orders');
              }}
              className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-amber-800">UTR Submitted (Unverified)</p>
              <p className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {kpis.utrSubmittedCount}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Awaiting bank verification</p>
            </div>

            {/* KPI 4: Payments Verified */}
            <div
              onClick={() => {
                setOrderStatusFilter('all');
                setActiveTab('orders');
              }}
              className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-emerald-800">Verified Payments</p>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {salesReport ? formatPaiseToRupees(salesReport.summary.totalVerifiedFundsPaise) : '₹0.00'}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Authenticated bank funds</p>
            </div>

            {/* KPI 5: Items Needing Stock Attention */}
            <div
              onClick={() => {
                setInventoryLowStockOnly(true);
                setActiveTab('inventory');
              }}
              className="bg-white border border-red-200 rounded-xl p-4 shadow-sm hover:border-red-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-red-700">Low Stock Items</p>
              <p className="text-2xl font-bold font-mono text-red-700 mt-1">
                {lowStockCount}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Below minimum threshold</p>
            </div>

            {/* KPI 6: Orders Ready for Pickup */}
            <div
              onClick={() => {
                setOrderStatusFilter('READY_FOR_PICKUP');
                setActiveTab('orders');
              }}
              className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-stone-700">Ready for Pickup</p>
              <p className="text-2xl font-bold font-mono text-orange-600 mt-1">
                {kpis.ordersReadyForPickupCount}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Packed and awaiting collection</p>
            </div>
          </div>

          {/* Section 1: Recent Orders Requiring Attention */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Recent Orders Requiring Attention
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Orders awaiting confirmation, packing, or manual UTR payment verification.
                </p>
              </div>
              <button
                onClick={() => {
                  setOrderStatusFilter('all');
                  setActiveTab('orders');
                }}
                className="text-xs font-medium text-orange-700 hover:text-orange-900 underline"
              >
                View All Orders →
              </button>
            </div>

            {ordersRequiringAttention.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-600">
                No orders currently require attention. All orders are completed or up to date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Order Total</th>
                      <th className="p-3.5">Token Due</th>
                      <th className="p-3.5">Payment State</th>
                      <th className="p-3.5">Order State</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {ordersRequiringAttention.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-stone-900">
                          {ord.order_reference}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-stone-900">{ord.customer_name}</p>
                          <p className="text-stone-600 font-mono text-[11px]">{ord.customer_mobile}</p>
                        </td>
                        <td className="p-3.5 text-stone-700">
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-stone-900">
                          {formatPaiseToRupees(ord.subtotal_paise)}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-800">
                          {formatPaiseToRupees(ord.token_amount_paise)}
                        </td>
                        <td className="p-3.5">
                          {ord.payment_reference ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              UTR Submitted, Awaiting Verification
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                              Not Submitted
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              ord.operational_status === 'CONFIRMED'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : ord.operational_status === 'PREPARING'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}
                          >
                            {ord.operational_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Concise Low-Stock List */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Concise Low Stock List
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Products currently at or below minimum reorder thresholds.
                </p>
              </div>
              <button
                onClick={() => {
                  setInventoryLowStockOnly(true);
                  setActiveTab('inventory');
                }}
                className="text-xs font-medium text-orange-700 hover:text-orange-900 underline"
              >
                View Full Inventory →
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-600">
                All items adequately stocked. No variants are below warning thresholds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">SKU / ID</th>
                      <th className="p-3.5">Product &amp; Variant</th>
                      <th className="p-3.5">Current Stock</th>
                      <th className="p-3.5">Reserved</th>
                      <th className="p-3.5">Available</th>
                      <th className="p-3.5">Threshold</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <tr key={item.variant_id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono text-stone-600 text-[11px]">
                          {item.variant_id}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-stone-900">{item.variant_name}</p>
                          <p className="text-stone-600 text-[11px]">{item.product_name}</p>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-red-700">
                          {item.current_stock}
                        </td>
                        <td className="p-3.5 font-mono text-stone-700">{item.reserved_stock}</td>
                        <td className="p-3.5 font-mono font-bold text-stone-900">
                          {item.available_stock}
                        </td>
                        <td className="p-3.5 font-mono text-stone-600">&le; {item.low_stock_threshold}</td>
                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            LOW STOCK
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openStockAdjustModal(item)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Open Payment Issues (when any exist) */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Open Payment Issues
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Customer payment assistance tickets reported during online checkout.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('support')}
                className="text-xs font-medium text-orange-700 hover:text-orange-900 underline"
              >
                View Support Queue →
              </button>
            </div>

            {openPaymentIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-600">
                No Open Payment Issues. All reported customer payment tickets have been resolved.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">Ticket Ref</th>
                      <th className="p-3.5">Reported At</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Issue Type</th>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {openPaymentIssues.map((iss) => (
                      <tr key={iss.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-900">
                          {iss.issue_reference}
                        </td>
                        <td className="p-3.5 text-stone-600 font-mono text-[11px]">
                          {new Date(iss.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-stone-900">{iss.customer_name}</p>
                          <p className="font-mono text-stone-600 text-[11px]">{iss.customer_mobile}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                            {iss.issue_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-stone-900">
                          {iss.order_reference || '-'}
                        </td>
                        <td className="p-3.5 text-stone-700 max-w-xs truncate">
                          {iss.description}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {iss.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openManageIssueModal(iss)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDERS MANAGEMENT ───────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <span className="text-xs text-stone-600 font-semibold mr-1">Status:</span>
              {(['all', 'SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm border ${
                      orderStatusFilter === st
                        ? 'bg-orange-600 text-white border-orange-700'
                        : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search order reference or mobile..."
                className="w-full sm:w-64 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-600 text-xs shadow-sm">
              No orders found matching your filters.
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Subtotal</th>
                      <th className="p-3.5">Advance Token</th>
                      <th className="p-3.5">Remaining</th>
                      <th className="p-3.5">UTR Reference</th>
                      <th className="p-3.5">Payment State</th>
                      <th className="p-3.5">Order State</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-stone-900">
                          {ord.order_reference}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-stone-900">{ord.customer_name}</p>
                          <p className="text-stone-600 font-mono text-[11px]">{ord.customer_mobile}</p>
                        </td>
                        <td className="p-3.5 text-stone-700">
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="p-3.5 font-mono text-stone-900 font-semibold">
                          {formatPaiseToRupees(ord.subtotal_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-amber-800 font-bold">
                          {formatPaiseToRupees(ord.token_amount_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-stone-600">
                          {formatPaiseToRupees(ord.remaining_balance_paise)}
                        </td>
                        <td className="p-3.5 font-mono font-medium text-stone-800">
                          {ord.payment_reference || '-'}
                        </td>
                        <td className="p-3.5">
                          {ord.payment_reference ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              UTR Submitted, Awaiting Verification
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                              Not Submitted
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              ord.operational_status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ord.operational_status === 'READY_FOR_PICKUP'
                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                : ord.operational_status === 'CONFIRMED'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : ord.operational_status === 'PREPARING'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}
                          >
                            {ord.operational_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: INVENTORY & STOCK MANAGEMENT ────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                Variant Inventory &amp; Stock Levels
              </h2>
              <p className="text-stone-600 mt-0.5">
                Tracks physical on-hand stock, active reservations, and automated low-stock warnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-stone-600 font-medium">
                Total Items: {inventoryItems.length}
              </span>
              {lowStockCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  {lowStockCount} Low Stock
                </span>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInventoryLowStockOnly(false)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm border ${
                  !inventoryLowStockOnly
                    ? 'bg-orange-600 text-white border-orange-700'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                }`}
              >
                All Variants ({inventoryItems.length})
              </button>
              <button
                onClick={() => setInventoryLowStockOnly(true)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm border flex items-center gap-1.5 ${
                  inventoryLowStockOnly
                    ? 'bg-red-700 text-white border-red-800'
                    : 'bg-white text-red-700 hover:bg-red-50 border-red-200'
                }`}
              >
                <span>Low Stock Alerts</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  inventoryLowStockOnly ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
                }`}>
                  {lowStockCount}
                </span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                placeholder="Search variant name or SKU..."
                className="w-full sm:w-64 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                  <tr>
                    <th className="p-3.5">SKU / ID</th>
                    <th className="p-3.5">Product &amp; Variant</th>
                    <th className="p-3.5">Pack Info</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5">Reserved</th>
                    <th className="p-3.5">Available</th>
                    <th className="p-3.5">Threshold</th>
                    <th className="p-3.5">Stock Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.variant_id}
                      className={`hover:bg-stone-50 transition-colors ${
                        item.is_low_stock ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-stone-600 text-[11px]">
                        {item.variant_id}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-stone-900">{item.variant_name}</p>
                        <p className="text-stone-600 text-[11px]">{item.product_name}</p>
                      </td>
                      <td className="p-3.5 text-stone-700">{item.variant_name}</td>
                      <td className="p-3.5 font-mono font-bold text-stone-900">
                        {item.current_stock}
                      </td>
                      <td className="p-3.5 font-mono text-amber-800">{item.reserved_stock}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        {item.available_stock}
                      </td>
                      <td className="p-3.5 font-mono text-stone-600">
                        &le; {item.low_stock_threshold}
                      </td>
                      <td className="p-3.5">
                        {item.is_low_stock ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openStockAdjustModal(item)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Movement Audit Log */}
          <div className="mt-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Inventory Movement Audit Log ({inventoryAuditLogs.length})
            </h4>
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Variant ID</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Change</th>
                      <th className="p-3">Before / After</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-[11px]">
                    {inventoryAuditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="p-3 text-stone-600 font-sans">
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-stone-700">{log.variant_id}</td>
                        <td className="p-3 text-orange-700 font-bold">{log.action}</td>
                        <td className="p-3 font-bold text-stone-900">
                          {log.quantity_delta > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                        </td>
                        <td className="p-3 text-stone-600">
                          {log.stock_before} &rarr; {log.stock_after}
                        </td>
                        <td className="p-3 text-stone-900 font-semibold">{log.operator_id}</td>
                        <td className="p-3 font-sans text-stone-700 max-w-xs truncate">
                          {log.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: QR VERSIONS & ROTATION ──────────────────────────── */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                UPI QR Code Management &amp; Version Rotation
              </h2>
              <p className="text-stone-600 mt-0.5">
                Manage payment QR fixtures. Version history is tracked with activation notes and timestamps.
              </p>
            </div>
            <button
              onClick={() => setShowQrUploadModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm"
            >
              + Upload New QR Version
            </button>
          </div>

          {/* Active QR Spotlight */}
          {!qrVersions.some((q) => q.is_active === 1) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 flex items-center gap-3 shadow-sm">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-red-900">No Active Payment QR</p>
                <p className="text-stone-600">
                  Customer checkout advance payments are disabled until an approved QR version is activated below.
                </p>
              </div>
            </div>
          )}
          {qrVersions.find((q) => q.is_active === 1) && (() => {
            const active = qrVersions.find((q) => q.is_active === 1)!;
            return (
              <div className="bg-white border-2 border-orange-500 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-36 h-36 bg-stone-50 p-2.5 rounded-xl flex items-center justify-center shrink-0 border border-stone-200 shadow-inner">
                  <img
                    src={active.image_url}
                    alt={active.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      CURRENTLY ACTIVE
                    </span>
                    <span className="font-mono text-stone-600 font-medium">
                      Version #{active.version_number}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900">{active.label}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-stone-700">
                    <p>
                      VPA:{' '}
                      <span className="font-bold text-orange-700">{active.vpa}</span>
                    </p>
                    <p>
                      Account: <span className="font-bold text-stone-900">{active.account_name}</span>
                    </p>
                    <p className="text-stone-600">
                      Activated:{' '}
                      {active.activated_at
                        ? new Date(active.activated_at).toLocaleString('en-IN')
                        : '-'}
                    </p>
                    <p className="text-stone-600">
                      Notes: {active.activation_notes || 'Initial active fixture'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All QR Versions List */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                  <tr>
                    <th className="p-3.5">Version</th>
                    <th className="p-3.5">Label</th>
                    <th className="p-3.5">UPI VPA</th>
                    <th className="p-3.5">Account Name</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Activated At</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {qrVersions.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-stone-900">
                        v{v.version_number}
                      </td>
                      <td className="p-3.5 font-semibold text-stone-900">{v.label}</td>
                      <td className="p-3.5 font-mono text-stone-800 font-medium">{v.vpa}</td>
                      <td className="p-3.5 text-stone-700">{v.account_name}</td>
                      <td className="p-3.5">
                        {v.is_active === 1 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600 font-mono text-[11px]">
                        {v.activated_at ? new Date(v.activated_at).toLocaleString('en-IN') : '-'}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {v.is_active === 0 && (
                          <button
                            onClick={() => handleActivateQrVersion(v.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"
                          >
                            Activate
                          </button>
                        )}
                        {v.is_active === 1 && (
                          <button
                            onClick={() => handleDeactivateQrVersion(v.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-sm"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PAYMENT SUPPORT ISSUES ──────────────────────────── */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                Customer Payment Support Tickets
              </h2>
              <p className="text-stone-600 mt-0.5">
                Issues reported via the customer "Facing an issue?" flow during token payment.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-600 font-semibold mr-1">Filter:</span>
              {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setIssueStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-sm border ${
                    issueStatusFilter === st
                      ? 'bg-orange-600 text-white border-orange-700'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-600 text-xs shadow-sm">
              No payment issues found.
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">Ticket Ref</th>
                      <th className="p-3.5">Reported At</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Issue Type</th>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Staff Notes</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredIssues.map((iss) => (
                      <tr key={iss.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-amber-900">
                          {iss.issue_reference}
                        </td>
                        <td className="p-3.5 text-stone-600 font-mono text-[11px]">
                          {new Date(iss.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-stone-900">{iss.customer_name}</p>
                          <p className="font-mono text-stone-600 text-[11px]">
                            {iss.customer_mobile}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                            {iss.issue_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-stone-900 font-semibold">
                          {iss.order_reference || '-'}
                        </td>
                        <td className="p-3.5 text-stone-700 max-w-xs truncate">
                          {iss.description}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              iss.status === 'OPEN'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : iss.status === 'IN_PROGRESS'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : iss.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                            }`}
                          >
                            {iss.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-600 text-[11px] max-w-xs truncate">
                          {iss.staff_notes || '-'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openManageIssueModal(iss)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: CUSTOMER DIRECTORY ──────────────────────────────── */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                Customer Directory &amp; Purchase History
              </h2>
              <p className="text-stone-600 mt-0.5">
                Directory of customers with lifetime spend, booking counts, and order histories.
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search customer name or mobile..."
                className="w-full sm:w-64 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-600 text-xs shadow-sm">
              No customers found.
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Mobile</th>
                      <th className="p-3.5">Fulfilment Pref</th>
                      <th className="p-3.5">Total Orders</th>
                      <th className="p-3.5">Lifetime Spend</th>
                      <th className="p-3.5">First Order</th>
                      <th className="p-3.5">Last Order</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-semibold text-stone-900">{c.full_name}</td>
                        <td className="p-3.5 font-mono text-stone-700">
                          {c.mobile_number}
                        </td>
                        <td className="p-3.5 text-stone-600">
                          {c.notes || 'Direct Customer'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-stone-900">
                          {c.total_orders}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-orange-700">
                          {formatPaiseToRupees(c.lifetime_spent_paise)}
                        </td>
                        <td className="p-3.5 text-stone-600 font-mono text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="p-3.5 text-stone-600 font-mono text-[11px]">
                          {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openCustomerDetail(c.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 7: SALES REPORTS & ANALYTICS ───────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                Sales Analytics &amp; RFC 4180 CSV Export
              </h2>
              <p className="text-stone-600 mt-0.5">
                Audited sales performance distinguishing Gross Booked Value from Verified Funds.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                {(['today', '7d', '30d', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setReportRange(r)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      reportRange === r
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {r === 'today'
                      ? 'Today'
                      : r === '7d'
                      ? '7 Days'
                      : r === '30d'
                      ? '30 Days'
                      : 'All Time'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>⬇ Download CSV</span>
              </button>
            </div>
          </div>

          {salesReport && (
            <div className="space-y-6">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-600">Total Orders</p>
                  <p className="text-2xl font-bold font-mono text-stone-900 mt-1">
                    {salesReport.summary.totalOrders}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Booked orders in period</p>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-amber-800">Gross Order Value</p>
                  <p className="text-2xl font-bold font-mono text-amber-800 mt-1">
                    {formatPaiseToRupees(salesReport.summary.totalGrossOrderPaise)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Booked customer total</p>
                </div>

                <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-emerald-800">Verified Bank Funds</p>
                  <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    {formatPaiseToRupees(salesReport.summary.totalVerifiedFundsPaise)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Zero Hallucinated Revenue</p>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-stone-600">Average Order Value</p>
                  <p className="text-2xl font-bold font-mono text-orange-600 mt-1">
                    {formatPaiseToRupees(salesReport.summary.averageOrderValuePaise)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">Per transaction</p>
                </div>
              </div>

              {/* Zero Hallucinated Revenue Invariant Callout */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3 shadow-sm">
                <span className="text-lg">🛡</span>
                <div>
                  <p className="font-bold">Strict Accounting Invariant: Zero Hallucinated Revenue</p>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    Unverified 12-digit customer UTR references are strictly segregated from verified bank receipts.
                    Verified funds remain ₹0.00 until authenticated against bank statement records.
                  </p>
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Daily Sales Trend
                </h4>
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                        <tr>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Orders Placed</th>
                          <th className="p-3.5">Gross Order Value</th>
                          <th className="p-3.5">Verified Bank Funds</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono">
                        {salesReport.dailyTrends.map((trend) => (
                          <tr key={trend.date} className="hover:bg-stone-50">
                            <td className="p-3.5 font-bold text-stone-900">{trend.date}</td>
                            <td className="p-3.5 text-stone-700">{trend.orderCount}</td>
                            <td className="p-3.5 font-bold text-amber-800">
                              {formatPaiseToRupees(trend.grossPaise)}
                            </td>
                            <td className="p-3.5 font-bold text-emerald-700">
                              {formatPaiseToRupees(trend.verifiedPaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Product Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Top Product Breakdown
                </h4>
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                        <tr>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">Units Ordered</th>
                          <th className="p-3.5">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {salesReport.productBreakdown.map((prod) => (
                          <tr key={prod.productName} className="hover:bg-stone-50">
                            <td className="p-3.5 font-semibold text-stone-900">
                              {prod.productName}
                            </td>
                            <td className="p-3.5 font-mono text-stone-700">
                              {prod.quantitySold}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-orange-700">
                              {formatPaiseToRupees(prod.totalRevenuePaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 8: CATALOGUE & PRICING ─────────────────────────────── */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Diwali Poster Inventory &amp; Pricing</h2>
              <p className="text-stone-600 mt-0.5">
                Printed prices remain immutable. Admin may configure prices within printed bounds.
              </p>
            </div>
            <span className="text-orange-700 font-mono font-semibold">
              Total Variants: {variants.length}
            </span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                  <tr>
                    <th className="p-3.5">SKU &amp; Item</th>
                    <th className="p-3.5">Pack Info</th>
                    <th className="p-3.5">Printed Price Text</th>
                    <th className="p-3.5">Printed Bounds</th>
                    <th className="p-3.5">Active Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {variants.map((v) => {
                    const activePrice = v.demoPricePaise ?? v.pricePaise;
                    return (
                      <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono text-stone-600 text-[10px] block">{v.sku || v.id}</span>
                          <span className="font-semibold text-stone-900">{v.name}</span>
                        </td>
                        <td className="p-3.5 text-stone-700">{v.packInfo}</td>
                        <td className="p-3.5 text-stone-900 font-medium">{v.printedPriceText}</td>
                        <td className="p-3.5 font-mono text-stone-600">
                          {v.printedMinPaise !== null && v.printedMinPaise !== undefined
                            ? `₹${v.printedMinPaise / 100} - ₹${(v.printedMaxPaise || v.printedMinPaise) / 100}`
                            : 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono">
                          {activePrice !== null ? (
                            <span className="text-orange-700 font-bold">
                              ₹{(activePrice / 100).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-amber-700 italic">Unresolved Range</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                              v.priceStatus === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : v.priceStatus === 'PRICE_ON_ENQUIRY'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {v.priceStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openPriceEditModal(v)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-sm transition-colors"
                          >
                            Edit Price
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: AUDIT LOGS ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm text-xs text-stone-700">
            <h2 className="font-bold text-stone-900 text-sm">Immutable Audit Stream</h2>
            <p className="text-stone-600 mt-0.5">
              Tracks all pricing updates, overrides, status changes, and order events.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Operator</th>
                    <th className="p-3.5">Reason / Details</th>
                    <th className="p-3.5">Override?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50">
                      <td className="p-3.5 text-stone-600 font-sans">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-orange-700 font-bold">{log.action}</td>
                      <td className="p-3.5 text-stone-700">{log.entity_id}</td>
                      <td className="p-3.5 text-stone-900 font-semibold">{log.operator_id}</td>
                      <td className="p-3.5 font-sans text-stone-700 max-w-xs truncate">
                        {log.reason || log.new_value_json}
                      </td>
                      <td className="p-3.5">
                        {log.is_override ? (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                            OVERRIDE
                          </span>
                        ) : (
                          <span className="text-stone-600">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: SYSTEM SETTINGS ──────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900">System Parameters</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-semibold text-stone-900">Payment Collection State</p>
                  <p className="text-stone-600">Public payment collection and live merchant QR.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  DISABLED
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-semibold text-stone-900">Tiered Token Policy</p>
                  <p className="text-stone-600">Advance token calculated strictly based on subtotal threshold.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ₹50 (&lt; ₹200) / ₹100 (&ge; ₹200)
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <p className="font-semibold text-stone-900">Database Persistence</p>
                  <p className="text-stone-600">Cloudflare D1 with parallel In-Memory test fallback.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  D1 COMPATIBLE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ──────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-xs text-stone-500 font-mono block">Order Reference</span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {selectedOrder.order_reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1">
              <p className="font-semibold text-stone-900">
                Customer: <span className="font-normal text-stone-800">{selectedOrder.customer_name}</span>
              </p>
              <p className="text-stone-600">
                Mobile: <span className="font-mono text-stone-900">{selectedOrder.customer_mobile}</span> • Fulfilment: {selectedOrder.fulfilment_preference === 'HOSTEL_PICKUP' ? 'Hostel Pickup' : 'Campus Pickup'}
              </p>
              {selectedOrder.customer_notes && (
                <p className="text-stone-600 italic">Notes: "{selectedOrder.customer_notes}"</p>
              )}
            </div>

            {/* Itemized Snapshot with Complete Items List */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Order Items Snapshot ({selectedOrder.items.length})
              </p>
              <div className="divide-y divide-stone-100 bg-stone-50 rounded-xl border border-stone-200 overflow-hidden text-xs">
                {selectedOrder.items.map((it) => {
                  const fallbackProduct =
                    variants.find((v) => v.id === it.variant_id)?.name || 'Firework Item';
                  const fallbackVariant =
                    variants.find((v) => v.id === it.variant_id)?.packInfo || 'Standard';
                  const prodName = it.product_name_snapshot || fallbackProduct;
                  const varName = it.variant_name_snapshot || fallbackVariant;

                  return (
                    <div key={it.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900">{prodName}</p>
                        <p className="text-stone-600 text-[11px] mt-0.5">{varName}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="text-stone-700 text-[11px]">
                          {it.quantity} × {formatPaiseToRupees(it.unit_price_paise)}
                        </p>
                        <p className="text-orange-700 font-bold text-xs mt-0.5">
                          {formatPaiseToRupees(it.line_subtotal_paise)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Order Subtotal:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatPaiseToRupees(selectedOrder.subtotal_paise)}
                </span>
              </div>
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Advance Token Required:</span>
                <span className="font-mono">{formatPaiseToRupees(selectedOrder.token_amount_paise)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-stone-200">
                <span className="text-stone-600">Remaining Balance Due upon Pickup:</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatPaiseToRupees(selectedOrder.remaining_balance_paise)}
                </span>
              </div>
            </div>

            {/* UTR Information Card */}
            <div className="border border-stone-200 bg-stone-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">
                  Customer 12-Digit UTR
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {selectedOrder.payment_reference || 'NOT SUBMITTED'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Submission Timestamp:</span>
                <span className="font-mono text-stone-700">
                  {selectedOrder.payment_submitted_at
                    ? new Date(selectedOrder.payment_submitted_at).toLocaleString('en-IN')
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Recorded Status:</span>
                <span className="font-mono font-bold text-amber-800">
                  {selectedOrder.payment_reference ? 'UTR Submitted, Awaiting Verification' : 'UNPAID'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 pt-1 leading-relaxed">
                Status is recorded as unverified. Live payment verification is not enabled.
              </p>
            </div>

            {/* Operational Status Progression */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Operational Status Progression
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                    disabled={selectedOrder.operational_status === st}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors shadow-sm border ${
                      selectedOrder.operational_status === st
                        ? 'bg-orange-600 text-white border-orange-700 cursor-default'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRICE EDITING MODAL ───────────────────────────────────── */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Edit Price</h3>
                <p className="text-xs text-stone-600">{editingVariant.name}</p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDemoPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Printed Range / Bounds
                </label>
                <p className="text-xs font-mono text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  {editingVariant.printedPriceText} (
                  {editingVariant.printedMinPaise !== null && editingVariant.printedMinPaise !== undefined
                    ? `Min: ₹${editingVariant.printedMinPaise / 100}, Max: ₹${
                        (editingVariant.printedMaxPaise || editingVariant.printedMinPaise) / 100
                      }`
                    : 'Discrete price'}
                  )
                </p>
              </div>

              <div>
                <label htmlFor="variant-price" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Active Price (₹)
                </label>
                <input
                  id="variant-price"
                  type="number"
                  step="1"
                  min="1"
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. 180"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="allow-override"
                  type="checkbox"
                  checked={allowOverride}
                  onChange={(e) => setAllowOverride(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
                />
                <label htmlFor="allow-override" className="text-xs text-stone-700 cursor-pointer">
                  Allow price outside printed boundaries (requires reason)
                </label>
              </div>

              {allowOverride && (
                <div>
                  <label htmlFor="override-reason" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Override Justification <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="override-reason"
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter audit reason for overriding printed bounds..."
                    className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STOCK ADJUSTMENT MODAL ─────────────────────────────────── */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Adjust Stock Level</h3>
                <p className="text-xs text-stone-600">{adjustingItem.variant_name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-600 block">Current Stock:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {adjustingItem.current_stock}
                  </span>
                </div>
                <div>
                  <span className="text-stone-600 block">Reserved:</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {adjustingItem.reserved_stock}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-stock-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1"
                >
                  New Physical Stock Count
                </label>
                <input
                  id="new-stock-input"
                  type="number"
                  min="0"
                  max="100000"
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="adjust-reason-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1"
                >
                  Adjustment Audit Reason
                </label>
                <input
                  id="adjust-reason-input"
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory verification, Restock delivery"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPLOAD NEW QR MODAL ────────────────────────────────────── */}
      {showQrUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Upload New QR Version</h3>
                <p className="text-xs text-stone-600">Draft version until activated</p>
              </div>
              <button
                onClick={() => setShowQrUploadModal(false)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewQr} className="space-y-3.5">
              {uploadQrError && (
                <p className="text-xs text-red-800 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                  {uploadQrError}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={uploadQrLabel}
                  onChange={(e) => setUploadQrLabel(e.target.value)}
                  placeholder="e.g. Campus Terminal 2, Diwali Special QR"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  value={uploadQrVpa}
                  onChange={(e) => setUploadQrVpa(e.target.value)}
                  placeholder="e.g. nagarjunatraders@okaxis"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={uploadQrAccountName}
                  onChange={(e) => setUploadQrAccountName(e.target.value)}
                  placeholder="e.g. NAGARJUNA TRADERS"
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  QR Image File (PNG / JPEG only)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleQrImageSelect}
                  className="w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
                  required
                />
              </div>

              {uploadQrImageDataUri && (
                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <img
                    src={uploadQrImageDataUri}
                    alt="Preview"
                    className="w-16 h-16 object-contain rounded bg-white p-1 border border-stone-200"
                  />
                  <div className="text-xs text-stone-600">
                    <p className="font-semibold text-stone-900">Raster Image Selected</p>
                    <p className="text-[11px]">Ready for base64 storage.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrUploadModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  Upload Draft QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE PAYMENT ISSUE MODAL ─────────────────────────────── */}
      {managingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Manage Support Ticket
                </h3>
                <p className="text-xs font-mono text-amber-800">
                  {managingIssue.issue_reference}
                </p>
              </div>
              <button
                onClick={() => setManagingIssue(null)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentIssue} className="space-y-3.5 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                <p className="font-semibold text-stone-900">
                  {managingIssue.customer_name} ({managingIssue.customer_mobile})
                </p>
                <p className="text-stone-600">
                  Type: <span className="text-stone-800">{managingIssue.issue_type}</span>
                </p>
                {managingIssue.order_reference && (
                  <p className="text-stone-600 font-mono">
                    Order Ref: {managingIssue.order_reference}
                  </p>
                )}
                <p className="text-stone-700 italic pt-1">
                  "{managingIssue.description}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Ticket Status
                </label>
                <select
                  value={issueNewStatus}
                  onChange={(e) => setIssueNewStatus(e.target.value as PaymentIssueStatus)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="OPEN">OPEN (Awaiting response)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Customer contacted)</option>
                  <option value="RESOLVED">RESOLVED (Resolved / Assisted)</option>
                  <option value="DISMISSED">DISMISSED (Invalid / Spurious)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Staff Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={issueStaffNotes}
                  onChange={(e) => setIssueStaffNotes(e.target.value)}
                  placeholder="Record customer contact notes, cash collected upon pickup, etc."
                  className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagingIssue(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
                >
                  Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOMER PROFILE & ORDER HISTORY DRAWER ────────────────── */}
      {selectedCustomerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Customer Profile</h3>
                <p className="text-xs text-stone-600">
                  {selectedCustomerDetail.customer.full_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="text-stone-400 hover:text-stone-800 text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs font-mono">
              <div>
                <span className="text-stone-600 block font-sans">Mobile Number:</span>
                <span className="font-bold text-stone-900">
                  {selectedCustomerDetail.customer.mobile_number}
                </span>
              </div>
              <div>
                <span className="text-stone-600 block font-sans">Customer Notes:</span>
                <span className="text-stone-800">
                  {selectedCustomerDetail.customer.notes || 'Campus Customer'}
                </span>
              </div>
              <div>
                <span className="text-stone-600 block font-sans">Total Orders:</span>
                <span className="font-bold text-stone-900">
                  {selectedCustomerDetail.customer.total_orders}
                </span>
              </div>
              <div>
                <span className="text-stone-600 block font-sans">Lifetime Spend:</span>
                <span className="font-bold text-orange-700">
                  {formatPaiseToRupees(selectedCustomerDetail.customer.lifetime_spent_paise)}
                </span>
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Order History ({selectedCustomerDetail.orders.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCustomerDetail.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-bold text-stone-900">
                        {ord.order_reference}
                      </p>
                      <p className="text-stone-600 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-IN')} • Status:{' '}
                        {ord.operational_status}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-stone-900">
                        {formatPaiseToRupees(ord.subtotal_paise)}
                      </p>
                      <p className="text-amber-800 text-[11px]">
                        Token: {formatPaiseToRupees(ord.token_amount_paise)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
