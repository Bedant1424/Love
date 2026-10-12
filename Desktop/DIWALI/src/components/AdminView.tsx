import React, { useState, useEffect } from 'react';
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

  const notificationTimeoutRef = React.useRef<any>(null);

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

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
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
    // Probe for existing authenticated session (via HttpOnly session cookie)
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

  const handleUpdateOrderStatus = async (orderId: string, status: OperationalStatus) => {
    try {
      const updated = await apiClient.updateOrderStatus(orderId, status, operatorId);
      showNotification(`Order status updated to ${status}`);
      setSelectedOrder(updated);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Status transition failed', 'error');
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
      showNotification('Please enter a valid price in Rupees.', 'error');
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
      showNotification(`Price for "${updated.name}" updated to ₹${priceNum.toFixed(2)}`);
      setEditingVariant(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update price', 'error');
    }
  };

  // Inventory Stock Adjustment
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
      showNotification('Stock level must be a non-negative number.', 'error');
      return;
    }

    try {
      await apiClient.adjustInventoryStock(
        adjustingItem.variant_id,
        stockNum,
        operatorId,
        adjustReason
      );
      showNotification(`Stock for variant adjusted to ${stockNum} units.`);
      setAdjustingItem(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to adjust stock', 'error');
    }
  };

  // QR Version Management
  const handleQrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadQrError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/png') && !file.type.startsWith('image/jpeg')) {
      setUploadQrError('Only PNG and JPEG raster image formats are allowed (SVG rejected).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const result = uploadEvt.target?.result as string;
      if (result) {
        setUploadQrImageDataUri(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadNewQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadQrError('');

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

  // If not authenticated, render clean branded Owner Administration portal card
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-festive-marigold/10 border border-festive-marigold/30 flex items-center justify-center text-festive-marigold shadow-inner">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40 mb-3 tracking-wide">
            NAGARJUNA TRADERS • OWNER HUB
          </span>
          <h1 className="text-xl font-bold font-display text-content-primary mb-2">
            Owner Administration Portal
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed mb-6">
            Secure administrative console for order management, catalogue verification, inventory adjustments, and sales reports.
          </p>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 text-left space-y-1">
              <strong className="block font-semibold text-red-300">Authentication Error:</strong>
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
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
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
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
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-touch bg-festive-marigold hover:bg-festive-amber disabled:opacity-50 text-black font-semibold rounded-xl text-xs py-3 transition-transform active:scale-[0.98] shadow-md shadow-festive-marigold/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {loading ? 'Authenticating...' : 'Sign In to Owner Portal'}
            </button>
          </form>

          <div className="pt-4 mt-4 text-center border-t border-white/5">
            <button
              type="button"
              onClick={onBackToCustomerSite}
              className="text-xs text-content-muted hover:text-content-primary underline"
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
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-bg-surface border border-amber-600/30 rounded-2xl p-6 md:p-8 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/50 mb-3 tracking-wide">
            SECURITY ACTION REQUIRED
          </span>
          <h1 className="text-xl font-bold font-display text-content-primary mb-2">
            Change Initial Password
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed mb-6">
            For security, you must replace the temporary password with a new personal password (minimum 8 characters) before accessing the owner dashboard.
          </p>

          {passwordChangeError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 text-left space-y-1">
              <strong className="block font-semibold text-red-300">Password Update Error:</strong>
              <p className="leading-relaxed">{passwordChangeError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
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
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
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
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
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
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-touch bg-festive-marigold hover:bg-festive-amber disabled:opacity-50 text-black font-semibold rounded-xl text-xs py-3 transition-transform active:scale-[0.98] shadow-md shadow-festive-marigold/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? 'Updating Password...' : 'Save Password & Enter Dashboard'}
            </button>
          </form>

          <div className="pt-4 mt-4 text-center border-t border-white/5">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-content-muted hover:text-content-primary underline"
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
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : 'bg-red-950/90 text-red-200 border-red-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-display text-content-primary">
              Nagarjuna Traders Admin Panel
            </span>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            Operator: <span className="text-content-secondary font-mono">{operatorId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-surface hover:bg-white/10 border border-white/10 text-content-secondary transition-colors"
          >
            {loading ? 'Refreshing...' : '↻ Refresh Data'}
          </button>
          <button
            onClick={onBackToCustomerSite}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-surface hover:bg-white/10 border border-white/10 text-content-primary transition-colors"
          >
            Customer Site →
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 border-b border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Overview &amp; KPIs
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>Orders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40 text-current">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>Inventory &amp; Stock</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-900/80 text-rose-200 border border-rose-700/60">
              {lowStockCount} LOW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'qr'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>QR Versions</span>
          {(() => {
            const activeVer = qrVersions.find((q) => q.is_active === 1);
            return activeVer ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                Active v{activeVer.version_number}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/40">
                No Active QR
              </span>
            );
          })()}
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'support'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>Payment Issues</span>
          {openIssuesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-900/80 text-amber-200">
              {openIssuesCount} OPEN
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'customers'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'reports'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Sales Reports
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'catalogue'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Catalogue &amp; Pricing ({variants.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'bg-festive-marigold text-black font-bold'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          System Settings
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & KPIS ─────────────────────────────────── */}
      {activeTab === 'dashboard' && kpis && (
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-medium text-content-muted">Total Orders</p>
              <p className="text-2xl font-bold font-mono text-content-primary mt-1">
                {kpis.totalOrders}
              </p>
              <p className="text-[11px] text-content-muted mt-1">Total reservations</p>
            </div>

            <div className="bg-bg-surface border border-amber-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-400">UTR Submitted (Unverified)</p>
              <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {kpis.utrSubmittedCount}
              </p>
              <button
                onClick={() => {
                  setOrderStatusFilter('all');
                  setActiveTab('orders');
                }}
                className="text-[11px] text-amber-400 hover:underline mt-1 block"
              >
                View queue →
              </button>
            </div>

            <div className="bg-bg-surface border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-emerald-400">Verified Bank Funds</p>
              <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">₹0.00</p>
              <p className="text-[11px] text-emerald-400/80 mt-1">Zero Hallucinated Revenue</p>
            </div>

            <div className="bg-bg-surface border border-rose-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-rose-400">Low Stock Alerts</p>
              <p className="text-2xl font-bold font-mono text-rose-300 mt-1">{lowStockCount}</p>
              <button
                onClick={() => {
                  setInventoryLowStockOnly(true);
                  setActiveTab('inventory');
                }}
                className="text-[11px] text-rose-400 hover:underline mt-1 block"
              >
                Manage stock →
              </button>
            </div>

            <div className="bg-bg-surface border border-amber-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-300">Open Support Issues</p>
              <p className="text-2xl font-bold font-mono text-amber-200 mt-1">
                {openIssuesCount}
              </p>
              <button
                onClick={() => setActiveTab('support')}
                className="text-[11px] text-amber-300 hover:underline mt-1 block"
              >
                Support queue →
              </button>
            </div>

            <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-medium text-content-muted">Ready for Pickup</p>
              <p className="text-2xl font-bold font-mono text-festive-marigold mt-1">
                {kpis.ordersReadyForPickupCount}
              </p>
              <p className="text-[11px] text-content-muted mt-1">Campus & Hostel Pickup</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-content-primary">Catalogue Pricing Health</h3>
              <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="text-content-muted">Total Extracted Variants</span>
                <span className="font-mono text-content-primary">{kpis.totalVariantsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="text-content-muted">Unresolved Price Ranges</span>
                <span className="font-mono text-amber-300">{kpis.unresolvedVariantsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-content-muted">Completed Orders</span>
                <span className="font-mono text-emerald-300">
                  {kpis.completedOrdersCount}
                </span>
              </div>
            </div>

            <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-content-primary">Campus & Hostel Operations Checklist</h3>
              <ul className="text-xs space-y-2 text-content-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Inspect order reference and customer mobile number upon pickup.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Ensure age verification (&ge;18) before handing over fireworks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Collect any remaining balance payable upon pickup handover.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDERS MANAGEMENT ───────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="py-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-bg-surface p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs text-content-muted whitespace-nowrap">Status:</span>
              {(['all', 'SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      orderStatusFilter === st
                        ? 'bg-festive-marigold text-black font-semibold'
                        : 'text-content-muted hover:text-content-primary bg-bg-elevated'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                )
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search reference or mobile..."
                className="w-full sm:w-64 bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-8 text-center text-content-muted text-xs">
              No orders found matching your filters.
            </div>
          ) : (
            <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Subtotal</th>
                      <th className="p-3.5">Advance Token</th>
                      <th className="p-3.5">Remaining</th>
                      <th className="p-3.5">UTR Reference</th>
                      <th className="p-3.5">UTR Status</th>
                      <th className="p-3.5">Order Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono font-semibold text-festive-marigold">
                          {ord.order_reference}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-content-primary">{ord.customer_name}</p>
                          <p className="text-content-muted font-mono">{ord.customer_mobile}</p>
                        </td>
                        <td className="p-3.5 text-content-secondary">
                          {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="p-3.5 font-mono text-content-primary font-medium">
                          {formatPaiseToRupees(ord.subtotal_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-amber-400 font-semibold">
                          {formatPaiseToRupees(ord.token_amount_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-content-secondary">
                          {formatPaiseToRupees(ord.remaining_balance_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-festive-amber">
                          {ord.payment_reference || '—'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              ord.payment_reference || ord.payment_status === 'RECORDED_UNVERIFIED'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                                : 'bg-white/5 text-content-muted'
                            }`}
                          >
                            {ord.payment_reference ? 'RECORDED_UNVERIFIED' : 'NOT_SUBMITTED'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                              ord.operational_status === 'COMPLETED'
                                ? 'bg-emerald-950/40 text-emerald-400'
                                : ord.operational_status === 'READY_FOR_PICKUP'
                                ? 'bg-blue-950/40 text-blue-300'
                                : ord.operational_status === 'CONFIRMED'
                                ? 'bg-amber-950/40 text-amber-300'
                                : 'bg-white/5 text-content-secondary'
                            }`}
                          >
                            {ord.operational_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-elevated hover:bg-white/10 text-content-primary border border-white/10"
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
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-content-primary text-sm">
                Variant Inventory &amp; Stock Levels
              </p>
              <p className="text-content-muted mt-0.5">
                Tracks physical on-hand stock, active reservations, and automated low-stock warnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-content-muted">
                Items: {inventoryItems.length}
              </span>
              {lowStockCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                  {lowStockCount} Low Stock
                </span>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-bg-surface p-3 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInventoryLowStockOnly(false)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  !inventoryLowStockOnly
                    ? 'bg-festive-marigold text-black'
                    : 'bg-bg-elevated text-content-muted hover:text-content-primary'
                }`}
              >
                All Variants ({inventoryItems.length})
              </button>
              <button
                onClick={() => setInventoryLowStockOnly(true)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  inventoryLowStockOnly
                    ? 'bg-rose-700 text-white'
                    : 'bg-bg-elevated text-rose-300 hover:text-rose-100'
                }`}
              >
                <span>Low Stock Alerts</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950">
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
                className="w-full sm:w-64 bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
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
                <tbody className="divide-y divide-white/5">
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.variant_id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        item.is_low_stock ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-content-muted text-[11px]">
                        {item.variant_id}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-content-primary">{item.variant_name}</p>
                        <p className="text-content-muted text-[11px]">{item.product_name}</p>
                      </td>
                      <td className="p-3.5 text-content-secondary">{item.variant_name}</td>
                      <td className="p-3.5 font-mono font-bold text-content-primary">
                        {item.current_stock}
                      </td>
                      <td className="p-3.5 font-mono text-amber-400">{item.reserved_stock}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {item.available_stock}
                      </td>
                      <td className="p-3.5 font-mono text-content-muted">
                        &le; {item.low_stock_threshold}
                      </td>
                      <td className="p-3.5">
                        {item.is_low_stock ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openStockAdjustModal(item)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-elevated hover:bg-festive-marigold hover:text-black text-content-primary border border-white/10 transition-colors"
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

          {/* Inventory Audit Logs Stream */}
          <div className="mt-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Inventory Movement Audit Log ({inventoryAuditLogs.length})
            </h4>
            <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider text-[11px]">
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
                  <tbody className="divide-y divide-white/5 text-[11px]">
                    {inventoryAuditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-content-muted font-sans">
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-content-secondary">{log.variant_id}</td>
                        <td className="p-3 text-festive-marigold font-bold">{log.action}</td>
                        <td className="p-3 font-bold text-content-primary">
                          {log.quantity_delta > 0 ? `+${log.quantity_delta}` : log.quantity_delta}
                        </td>
                        <td className="p-3 text-content-muted">
                          {log.stock_before} &rarr; {log.stock_after}
                        </td>
                        <td className="p-3 text-content-primary font-semibold">{log.operator_id}</td>
                        <td className="p-3 font-sans text-content-secondary max-w-xs truncate">
                          {log.reason || '—'}
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
        <div className="py-6 space-y-6">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-content-primary text-sm">
                UPI QR Code Management &amp; Version Rotation
              </p>
              <p className="text-content-muted mt-0.5">
                Manage payment QR fixtures. Version history is tracked with activation notes and timestamps.
              </p>
            </div>
            <button
              onClick={() => setShowQrUploadModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black transition-transform active:scale-95"
            >
              + Upload New QR Version
            </button>
          </div>

          {/* Active QR Spotlight */}
          {!qrVersions.some((q) => q.is_active === 1) && (
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-4 text-xs text-rose-300 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-rose-200">No Active Payment QR</p>
                <p className="text-stone-400">
                  Customer checkout advance payments are disabled until an approved QR version is activated below.
                </p>
              </div>
            </div>
          )}
          {qrVersions.find((q) => q.is_active === 1) && (() => {
            const active = qrVersions.find((q) => q.is_active === 1)!;
            return (
              <div className="bg-gradient-to-br from-amber-950/40 via-bg-surface to-bg-surface border border-amber-600/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center gap-6">
                <div className="w-36 h-36 bg-white p-2.5 rounded-xl flex items-center justify-center shrink-0 border-2 border-festive-marigold">
                  <img
                    src={active.image_url}
                    alt={active.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      CURRENTLY ACTIVE
                    </span>
                    <span className="font-mono text-content-muted">
                      Version #{active.version_number}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-content-primary">{active.label}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-content-secondary">
                    <p>
                      VPA:{' '}
                      <span className="font-bold text-festive-marigold">{active.vpa}</span>
                    </p>
                    <p>
                      Account: <span className="font-bold">{active.account_name}</span>
                    </p>
                    <p className="text-content-muted">
                      Activated:{' '}
                      {active.activated_at
                        ? new Date(active.activated_at).toLocaleString('en-IN')
                        : '—'}
                    </p>
                    <p className="text-content-muted">
                      Notes: {active.activation_notes || 'Initial active fixture'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All QR Versions List */}
          <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
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
                <tbody className="divide-y divide-white/5">
                  {qrVersions.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-festive-marigold">
                        v{v.version_number}
                      </td>
                      <td className="p-3.5 font-semibold text-content-primary">{v.label}</td>
                      <td className="p-3.5 font-mono text-festive-amber">{v.vpa}</td>
                      <td className="p-3.5 text-content-secondary">{v.account_name}</td>
                      <td className="p-3.5">
                        {v.is_active === 1 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-content-muted">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-content-muted font-mono text-[11px]">
                        {v.activated_at ? new Date(v.activated_at).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {v.is_active === 0 && (
                          <button
                            onClick={() => handleActivateQrVersion(v.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                          >
                            Activate
                          </button>
                        )}
                        {v.is_active === 1 && (
                          <button
                            onClick={() => handleDeactivateQrVersion(v.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800"
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
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-content-primary text-sm">
                Customer Payment Support Tickets
              </p>
              <p className="text-content-muted mt-0.5">
                Issues reported via the customer "Facing an issue?" flow during token payment.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-content-muted">Filter:</span>
              {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setIssueStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    issueStatusFilter === st
                      ? 'bg-festive-marigold text-black font-semibold'
                      : 'bg-bg-elevated text-content-muted hover:text-content-primary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-8 text-center text-content-muted text-xs">
              No payment issues found.
            </div>
          ) : (
            <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
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
                  <tbody className="divide-y divide-white/5">
                    {filteredIssues.map((iss) => (
                      <tr key={iss.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-festive-amber">
                          {iss.issue_reference}
                        </td>
                        <td className="p-3.5 text-content-muted font-mono text-[11px]">
                          {new Date(iss.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-content-primary">{iss.customer_name}</p>
                          <p className="font-mono text-content-muted text-[11px]">
                            {iss.customer_mobile}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-content-secondary">
                            {iss.issue_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-festive-marigold font-semibold">
                          {iss.order_reference || '—'}
                        </td>
                        <td className="p-3.5 text-content-secondary max-w-xs truncate">
                          {iss.description}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              iss.status === 'OPEN'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : iss.status === 'IN_PROGRESS'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : iss.status === 'RESOLVED'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : 'bg-white/5 text-content-muted'
                            }`}
                          >
                            {iss.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-content-muted text-[11px] max-w-xs truncate">
                          {iss.staff_notes || '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openManageIssueModal(iss)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-elevated hover:bg-festive-marigold hover:text-black text-content-primary border border-white/10 transition-colors"
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
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-content-primary text-sm">
                Customer Directory &amp; Purchase History
              </p>
              <p className="text-content-muted mt-0.5">
                Directory of customers with lifetime spend, booking counts, and order histories.
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search customer name or mobile..."
                className="w-full sm:w-64 bg-bg-elevated border border-white/10 rounded-lg px-3 py-1.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:ring-1 focus:ring-festive-marigold"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-8 text-center text-content-muted text-xs">
              No customers found.
            </div>
          ) : (
            <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
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
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-semibold text-content-primary">{c.full_name}</td>
                        <td className="p-3.5 font-mono text-content-secondary">
                          {c.mobile_number}
                        </td>
                        <td className="p-3.5 text-content-muted">
                          {c.notes || 'Direct Customer'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-content-primary">
                          {c.total_orders}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-festive-marigold">
                          {formatPaiseToRupees(c.lifetime_spent_paise)}
                        </td>
                        <td className="p-3.5 text-content-muted font-mono text-[11px]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-3.5 text-content-muted font-mono text-[11px]">
                          {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openCustomerDetail(c.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-elevated hover:bg-festive-marigold hover:text-black text-content-primary border border-white/10 transition-colors"
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
        <div className="py-6 space-y-6">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="font-semibold text-content-primary text-sm">
                Sales Analytics &amp; RFC 4180 CSV Export
              </p>
              <p className="text-content-muted mt-0.5">
                Audited sales performance distinguishing Gross Booked Value from Verified Funds.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-bg-elevated p-1 rounded-xl border border-white/5">
                {(['today', '7d', '30d', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setReportRange(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      reportRange === r
                        ? 'bg-festive-marigold text-black'
                        : 'text-content-muted hover:text-content-primary'
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>⬇ Download CSV</span>
              </button>
            </div>
          </div>

          {salesReport && (
            <div className="space-y-6">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
                  <p className="text-xs font-medium text-content-muted">Total Orders</p>
                  <p className="text-2xl font-bold font-mono text-content-primary mt-1">
                    {salesReport.summary.totalOrders}
                  </p>
                  <p className="text-[11px] text-content-muted mt-1">Booked orders in period</p>
                </div>

                <div className="bg-bg-surface border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-xs font-medium text-amber-400">Gross Order Value</p>
                  <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    {formatPaiseToRupees(salesReport.summary.totalGrossOrderPaise)}
                  </p>
                  <p className="text-[11px] text-amber-400/70 mt-1">Booked customer total</p>
                </div>

                <div className="bg-bg-surface border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-xs font-medium text-emerald-400">Verified Bank Funds</p>
                  <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {formatPaiseToRupees(salesReport.summary.totalVerifiedFundsPaise)}
                  </p>
                  <p className="text-[11px] text-emerald-400/80 mt-1">Zero Hallucinated Revenue</p>
                </div>

                <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
                  <p className="text-xs font-medium text-content-muted">Average Order Value</p>
                  <p className="text-2xl font-bold font-mono text-festive-marigold mt-1">
                    {formatPaiseToRupees(salesReport.summary.averageOrderValuePaise)}
                  </p>
                  <p className="text-[11px] text-content-muted mt-1">Per transaction</p>
                </div>
              </div>

              {/* Zero Hallucinated Revenue Invariant Callout */}
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 text-xs text-emerald-200 flex items-start gap-3">
                <span className="text-lg">🛡</span>
                <div>
                  <p className="font-bold">Strict Accounting Invariant: Zero Hallucinated Revenue</p>
                  <p className="text-emerald-300/80 mt-0.5 leading-relaxed">
                    Unverified 12-digit customer UTR references are strictly segregated from verified bank receipts.
                    Verified funds remain ₹0.00 until authenticated against bank statement records.
                  </p>
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Daily Sales Trend
                </h4>
                <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Orders Placed</th>
                          <th className="p-3.5">Gross Order Value</th>
                          <th className="p-3.5">Verified Bank Funds</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {salesReport.dailyTrends.map((trend) => (
                          <tr key={trend.date} className="hover:bg-white/[0.02]">
                            <td className="p-3.5 font-bold text-content-primary">{trend.date}</td>
                            <td className="p-3.5 text-content-secondary">{trend.orderCount}</td>
                            <td className="p-3.5 font-bold text-amber-300">
                              {formatPaiseToRupees(trend.grossPaise)}
                            </td>
                            <td className="p-3.5 font-bold text-emerald-400">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Top Product Breakdown
                </h4>
                <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="p-3.5">Product Name</th>
                          <th className="p-3.5">Units Ordered</th>
                          <th className="p-3.5">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {salesReport.productBreakdown.map((prod) => (
                          <tr key={prod.productName} className="hover:bg-white/[0.02]">
                            <td className="p-3.5 font-semibold text-content-primary">
                              {prod.productName}
                            </td>
                            <td className="p-3.5 font-mono text-content-secondary">
                              {prod.quantitySold}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-festive-marigold">
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
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="font-semibold text-content-primary">Diwali Poster Inventory &amp; Pricing</p>
              <p className="text-content-muted mt-0.5">
                Printed prices remain immutable. Admin may configure prices within printed bounds.
              </p>
            </div>
            <span className="text-festive-marigold font-mono">
              Total Variants: {variants.length}
            </span>
          </div>

          <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
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
                <tbody className="divide-y divide-white/5">
                  {variants.map((v) => {
                    const activePrice = v.demoPricePaise ?? v.pricePaise;
                    return (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono text-content-muted text-[10px] block">{v.sku || v.id}</span>
                          <span className="font-semibold text-content-primary">{v.name}</span>
                        </td>
                        <td className="p-3.5 text-content-secondary">{v.packInfo}</td>
                        <td className="p-3.5 text-content-primary font-medium">{v.printedPriceText}</td>
                        <td className="p-3.5 font-mono text-content-muted">
                          {v.printedMinPaise !== null && v.printedMinPaise !== undefined
                            ? `₹${v.printedMinPaise / 100} – ₹${(v.printedMaxPaise || v.printedMinPaise) / 100}`
                            : 'N/A'}
                        </td>
                        <td className="p-3.5 font-mono">
                          {activePrice !== null ? (
                            <span className="text-festive-marigold font-bold">
                              ₹{(activePrice / 100).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-amber-400 italic">Unresolved Range</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                              v.priceStatus === 'CONFIRMED'
                                ? 'bg-emerald-950/60 text-emerald-300'
                                : v.priceStatus === 'PRICE_ON_ENQUIRY'
                                ? 'bg-amber-950/60 text-amber-300'
                                : 'bg-white/5 text-content-secondary'
                            }`}
                          >
                            {v.priceStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openPriceEditModal(v)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-elevated hover:bg-festive-marigold hover:text-black text-content-primary border border-white/10 transition-colors"
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
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary">
            <p className="font-semibold text-content-primary">Immutable Audit Stream</p>
            <p className="text-content-muted mt-0.5">
              Tracks all pricing updates, overrides, status changes, and order events.
            </p>
          </div>

          <div className="bg-bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-elevated border-b border-white/10 text-content-muted uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Operator</th>
                    <th className="p-3.5">Reason / Details</th>
                    <th className="p-3.5">Override?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-3.5 text-content-muted">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-festive-marigold font-bold">{log.action}</td>
                      <td className="p-3.5 text-content-secondary">{log.entity_id}</td>
                      <td className="p-3.5 text-content-primary font-semibold">{log.operator_id}</td>
                      <td className="p-3.5 font-sans text-content-secondary max-w-xs truncate">
                        {log.reason || log.new_value_json}
                      </td>
                      <td className="p-3.5">
                        {log.is_override ? (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold">
                            OVERRIDE
                          </span>
                        ) : (
                          <span className="text-content-muted">Normal</span>
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
        <div className="py-6 max-w-2xl space-y-4">
          <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-content-primary">System Parameters</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Payment Collection State</p>
                  <p className="text-content-muted">Public payment collection and live merchant QR.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  DISABLED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Tiered Token Policy</p>
                  <p className="text-content-muted">Advance token calculated strictly based on subtotal threshold.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  ₹50 (&lt; ₹200) / ₹100 (&ge; ₹200)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Database Persistence</p>
                  <p className="text-content-muted">Cloudflare D1 with parallel In-Memory test fallback.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  D1 COMPATIBLE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ──────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs text-content-muted font-mono block">Order Reference</span>
                <span className="text-lg font-bold font-mono text-festive-marigold">
                  {selectedOrder.order_reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="bg-bg-elevated p-3.5 rounded-xl border border-white/5 text-xs space-y-1">
              <p className="font-semibold text-content-primary">
                Customer: <span className="font-normal">{selectedOrder.customer_name}</span>
              </p>
              <p className="text-content-muted">
                Mobile: <span className="font-mono text-content-secondary">{selectedOrder.customer_mobile}</span> • Fulfilment: {selectedOrder.fulfilment_preference === 'HOSTEL_PICKUP' ? 'Hostel Pickup' : 'Campus Pickup'}
              </p>
              {selectedOrder.customer_notes && (
                <p className="text-content-muted italic">Notes: "{selectedOrder.customer_notes}"</p>
              )}
            </div>

            {/* Itemized Snapshot */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Order Items Snapshot ({selectedOrder.items.length})
              </p>
              <div className="divide-y divide-white/5 bg-bg-elevated rounded-xl border border-white/5 overflow-hidden text-xs">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-content-primary">{it.product_name_snapshot}</p>
                      <p className="text-content-muted text-[11px]">{it.variant_name_snapshot}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-content-primary font-medium">
                        {it.quantity} × {formatPaiseToRupees(it.unit_price_paise)}
                      </p>
                      <p className="text-festive-marigold font-bold">
                        {formatPaiseToRupees(it.line_subtotal_paise)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-bg-elevated p-3.5 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-content-muted">Order Subtotal:</span>
                <span className="font-mono font-semibold text-content-primary">
                  {formatPaiseToRupees(selectedOrder.subtotal_paise)}
                </span>
              </div>
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>Advance Token Required:</span>
                <span className="font-mono">{formatPaiseToRupees(selectedOrder.token_amount_paise)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-content-muted">Remaining Balance Due upon Pickup:</span>
                <span className="font-mono font-bold text-festive-marigold">
                  {formatPaiseToRupees(selectedOrder.remaining_balance_paise)}
                </span>
              </div>
            </div>

            {/* UTR Information Card */}
            <div className="border border-white/10 bg-bg-elevated rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-content-secondary">
                  Customer 12-Digit UTR
                </span>
                <span className="font-mono font-bold text-festive-amber">
                  {selectedOrder.payment_reference || 'NOT SUBMITTED'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-muted">Submission Timestamp:</span>
                <span className="font-mono text-content-secondary">
                  {selectedOrder.payment_submitted_at
                    ? new Date(selectedOrder.payment_submitted_at).toLocaleString('en-IN')
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-muted">Recorded Status:</span>
                <span className="font-mono font-bold text-amber-300">
                  {selectedOrder.payment_reference ? 'RECORDED_UNVERIFIED' : 'UNPAID'}
                </span>
              </div>
              <p className="text-[11px] text-content-muted pt-1 leading-relaxed">
                Status is recorded as unverified. Live payment verification is not enabled.
              </p>
            </div>

            {/* Operational Status Progression */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
                Operational Status Progression
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                    disabled={selectedOrder.operational_status === st}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedOrder.operational_status === st
                        ? 'bg-festive-marigold text-black cursor-default'
                        : 'bg-bg-elevated hover:bg-white/10 text-content-secondary border border-white/5'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">Edit Price</h3>
                <p className="text-xs text-content-muted">{editingVariant.name}</p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDemoPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Printed Range / Bounds
                </label>
                <p className="text-xs font-mono text-content-muted bg-bg-elevated p-2 rounded-lg border border-white/5">
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
                <label htmlFor="variant-price" className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Active Price (₹)
                </label>
                <input
                  id="variant-price"
                  type="number"
                  step="1"
                  min="1"
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
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
                  className="w-4 h-4 rounded text-festive-marigold focus:ring-festive-marigold"
                />
                <label htmlFor="allow-override" className="text-xs text-content-muted cursor-pointer">
                  Allow price outside printed boundaries (requires reason)
                </label>
              </div>

              {allowOverride && (
                <div>
                  <label htmlFor="override-reason" className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                    Override Justification <span className="text-festive-crimson">*</span>
                  </label>
                  <textarea
                    id="override-reason"
                    rows={2}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter audit reason for overriding printed bounds..."
                    className="w-full bg-bg-elevated border border-white/10 rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated text-content-secondary hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">Adjust Stock Level</h3>
                <p className="text-xs text-content-muted">{adjustingItem.variant_name}</p>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-bg-elevated p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-content-muted block">Current Stock:</span>
                  <span className="font-mono font-bold text-content-primary text-sm">
                    {adjustingItem.current_stock}
                  </span>
                </div>
                <div>
                  <span className="text-content-muted block">Reserved:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {adjustingItem.reserved_stock}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-stock-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1"
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
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="adjust-reason-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1"
                >
                  Adjustment Audit Reason
                </label>
                <input
                  id="adjust-reason-input"
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory verification, Restock delivery"
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated text-content-secondary hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">Upload New QR Version</h3>
                <p className="text-xs text-content-muted">Draft version until activated</p>
              </div>
              <button
                onClick={() => setShowQrUploadModal(false)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewQr} className="space-y-3.5">
              {uploadQrError && (
                <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800 p-2.5 rounded-xl">
                  {uploadQrError}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={uploadQrLabel}
                  onChange={(e) => setUploadQrLabel(e.target.value)}
                  placeholder="e.g. Campus Terminal 2, Diwali Special QR"
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  value={uploadQrVpa}
                  onChange={(e) => setUploadQrVpa(e.target.value)}
                  placeholder="e.g. nagarjunatraders@okaxis"
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={uploadQrAccountName}
                  onChange={(e) => setUploadQrAccountName(e.target.value)}
                  placeholder="e.g. NAGARJUNA TRADERS"
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  QR Image File (PNG / JPEG only)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleQrImageSelect}
                  className="w-full text-xs text-content-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-bg-elevated file:text-content-primary hover:file:bg-white/10 cursor-pointer"
                  required
                />
              </div>

              {uploadQrImageDataUri && (
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-white/5">
                  <img
                    src={uploadQrImageDataUri}
                    alt="Preview"
                    className="w-16 h-16 object-contain rounded bg-white p-1"
                  />
                  <div className="text-xs text-content-muted">
                    <p className="font-semibold text-content-primary">Raster Image Selected</p>
                    <p className="text-[11px]">Ready for base64 storage.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrUploadModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated text-content-secondary hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">
                  Manage Support Ticket
                </h3>
                <p className="text-xs font-mono text-festive-amber">
                  {managingIssue.issue_reference}
                </p>
              </div>
              <button
                onClick={() => setManagingIssue(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentIssue} className="space-y-3.5 text-xs">
              <div className="bg-bg-elevated p-3 rounded-xl border border-white/5 space-y-1">
                <p className="font-semibold text-content-primary">
                  {managingIssue.customer_name} ({managingIssue.customer_mobile})
                </p>
                <p className="text-content-muted">
                  Type: <span className="text-content-secondary">{managingIssue.issue_type}</span>
                </p>
                {managingIssue.order_reference && (
                  <p className="text-content-muted font-mono">
                    Order Ref: {managingIssue.order_reference}
                  </p>
                )}
                <p className="text-content-secondary italic pt-1">
                  "{managingIssue.description}"
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Ticket Status
                </label>
                <select
                  value={issueNewStatus}
                  onChange={(e) => setIssueNewStatus(e.target.value as PaymentIssueStatus)}
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                >
                  <option value="OPEN">OPEN (Awaiting response)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Customer contacted)</option>
                  <option value="RESOLVED">RESOLVED (Resolved / Assisted)</option>
                  <option value="DISMISSED">DISMISSED (Invalid / Spurious)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Staff Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={issueStaffNotes}
                  onChange={(e) => setIssueStaffNotes(e.target.value)}
                  placeholder="Record customer contact notes, cash collected upon pickup, etc."
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagingIssue(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated text-content-secondary hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-content-primary">Customer Profile</h3>
                <p className="text-xs text-content-muted">
                  {selectedCustomerDetail.customer.full_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 gap-3 bg-bg-elevated p-3.5 rounded-xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-content-muted block font-sans">Mobile Number:</span>
                <span className="font-bold text-content-primary">
                  {selectedCustomerDetail.customer.mobile_number}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-sans">Customer Notes:</span>
                <span className="text-content-secondary">
                  {selectedCustomerDetail.customer.notes || 'Campus Customer'}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-sans">Total Orders:</span>
                <span className="font-bold text-content-primary">
                  {selectedCustomerDetail.customer.total_orders}
                </span>
              </div>
              <div>
                <span className="text-content-muted block font-sans">Lifetime Spend:</span>
                <span className="font-bold text-festive-marigold">
                  {formatPaiseToRupees(selectedCustomerDetail.customer.lifetime_spent_paise)}
                </span>
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
                Order History ({selectedCustomerDetail.orders.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCustomerDetail.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-bg-elevated rounded-xl border border-white/5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-bold text-festive-marigold">
                        {ord.order_reference}
                      </p>
                      <p className="text-content-muted text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-IN')} • Status:{' '}
                        {ord.operational_status}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-content-primary">
                        {formatPaiseToRupees(ord.subtotal_paise)}
                      </p>
                      <p className="text-amber-300 text-[11px]">
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
