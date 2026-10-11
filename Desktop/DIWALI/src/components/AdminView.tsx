import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  AdminDashboardKPIs,
  DemoOrderRecordWithItems,
  OperationalStatus,
  PriceAuditLog,
} from '../server/types';
import { ProductVariant } from '../types/catalogue';
import { formatPaiseToRupees } from '../utils/formatters';

interface AdminViewProps {
  onBackToCustomerSite: () => void;
}

type AdminTab = 'dashboard' | 'orders' | 'catalogue' | 'audit' | 'settings';

export const AdminView: React.FC<AdminViewProps> = ({ onBackToCustomerSite }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passphrase, setPassphrase] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('OP-NAGARJUNA');

  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Data State
  const [kpis, setKpis] = useState<AdminDashboardKPIs | null>(null);
  const [orders, setOrders] = useState<DemoOrderRecordWithItems[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [auditLogs, setAuditLogs] = useState<PriceAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Filters State
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<DemoOrderRecordWithItems | null>(null);

  // Price Editing Modal State
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [newPriceRupees, setNewPriceRupees] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [allowOverride, setAllowOverride] = useState<boolean>(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [kpisData, ordersData, variantsData, auditData] = await Promise.all([
        apiClient.getDashboardKPIs(),
        apiClient.getAdminOrders(),
        apiClient.getAdminVariants(),
        apiClient.getAuditLogs(),
      ]);
      setKpis(kpisData);
      setOrders(ordersData);
      setVariants(variantsData);
      setAuditLogs(auditData);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to refresh admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiClient.adminLogin(passphrase);
      setOperatorId(res.operatorId);
      setIsAuthenticated(true);
      showNotification('Administrator console unlocked.');
    } catch (err: any) {
      setAuthError(err?.message || 'Incorrect passphrase. Use: nagarjuna-demo-2026');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassphrase('');
    showNotification('Logged out from admin console.');
  };

  // Order Actions
  const handleVerifyPayment = async (orderId: string, action: 'APPROVE_TOKEN' | 'REJECT_INVALID_UTR') => {
    try {
      const updated = await apiClient.verifyPayment(
        orderId,
        action,
        operatorId,
        action === 'APPROVE_TOKEN'
          ? 'Reconciled simulated ₹100 token credit'
          : 'Mismatched or invalid 12-digit UTR'
      );
      showNotification(
        action === 'APPROVE_TOKEN'
          ? `Order ${updated.order_reference} payment verified! Status moved to CONFIRMED.`
          : `Order ${updated.order_reference} UTR rejected.`
      );
      setSelectedOrder(updated);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Verification failed', 'error');
    }
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
      showNotification(`Demo price for "${updated.name}" updated to ₹${priceNum.toFixed(2)}`);
      setEditingVariant(null);
      loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update price', 'error');
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

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40 mb-3">
              Store Operations Console
            </span>
            <h1 className="text-2xl font-bold font-display text-content-primary">
              Nagarjuna Traders Admin
            </h1>
            <p className="text-xs text-content-muted mt-1">
              Portfolio Demo Administration & Order Management
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-passphrase"
                className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1.5"
              >
                Authorized Staff Passphrase
              </label>
              <input
                id="admin-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase (hint: nagarjuna-demo-2026)"
                className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2.5 text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2.5 rounded-lg">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-touch bg-festive-marigold hover:bg-festive-amber text-black font-semibold rounded-xl text-sm transition-transform active:scale-[0.98] shadow-lg shadow-festive-marigold/10"
            >
              Unlock Admin Console
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToCustomerSite}
                className="text-xs text-content-muted hover:text-content-primary underline"
              >
                ← Return to Customer Website
              </button>
            </div>
          </form>
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
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-festive-marigold/20 text-festive-marigold border border-festive-marigold/30">
              Demo Mode
            </span>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            Operator: <span className="text-content-secondary font-mono">{operatorId}</span> • Session: 12h Active
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 border-b border-white/10">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-festive-marigold text-black'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Overview & KPIs
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-festive-marigold text-black'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          <span>Demo Orders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40 text-current">
            {orders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'catalogue'
              ? 'bg-festive-marigold text-black'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Catalogue & Demo Pricing ({variants.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-festive-marigold text-black'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'bg-festive-marigold text-black'
              : 'text-content-muted hover:text-content-primary bg-bg-surface border border-white/5'
          }`}
        >
          Simulation Settings
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & KPIS ─────────────────────────────────── */}
      {activeTab === 'dashboard' && kpis && (
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-medium text-content-muted">Total Demo Orders</p>
              <p className="text-2xl font-bold font-mono text-content-primary mt-1">
                {kpis.totalDemoOrders}
              </p>
              <p className="text-[11px] text-content-muted mt-1">Simulated bookings</p>
            </div>

            <div className="bg-bg-surface border border-amber-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-amber-400">Pending UTR Verification</p>
              <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {kpis.pendingPaymentVerificationCount}
              </p>
              <button
                onClick={() => {
                  setOrderStatusFilter('all');
                  setActiveTab('orders');
                }}
                className="text-[11px] text-amber-400 hover:underline mt-1 block"
              >
                Review queue →
              </button>
            </div>

            <div className="bg-bg-surface border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-xs font-medium text-emerald-400">Fixed ₹100 Tokens Verified</p>
              <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                {formatPaiseToRupees(kpis.totalTokenCollectedPaise)}
              </p>
              <p className="text-[11px] text-content-muted mt-1">₹100 token per order</p>
            </div>

            <div className="bg-bg-surface border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-medium text-content-muted">Ready for Pickup</p>
              <p className="text-2xl font-bold font-mono text-festive-marigold mt-1">
                {kpis.ordersReadyForPickupCount}
              </p>
              <p className="text-[11px] text-content-muted mt-1">At Sivakasi counter</p>
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
                <span className="text-content-muted">Completed Orders Counter Balance</span>
                <span className="font-mono text-emerald-300">
                  {formatPaiseToRupees(kpis.totalBalanceCollectedPaise)}
                </span>
              </div>
            </div>

            <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-content-primary">Festival Operations Checklist</h3>
              <p className="text-xs text-content-muted">
                Guidelines from <code>docs/admin-runbook.md</code>:
              </p>
              <ul className="text-xs space-y-2 text-content-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Match customer-submitted 12-digit UTR with bank smartphone notification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Check age attestation (&ge;18) before handing over crackers at counter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-festive-marigold">•</span>
                  <span>Verify exact remaining balance collection prior to marking order completed.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEMO ORDERS MANAGEMENT ─────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="py-6 space-y-4">
          {/* Filters Bar */}
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

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="bg-bg-surface border border-white/10 rounded-2xl p-8 text-center text-content-muted text-xs">
              No simulated demo orders found matching your filters.
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
                      <th className="p-3.5">₹100 Token</th>
                      <th className="p-3.5">Remaining</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Status</th>
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
                        <td className="p-3.5 font-mono text-emerald-400 font-semibold">
                          {formatPaiseToRupees(ord.token_amount_paise)}
                        </td>
                        <td className="p-3.5 font-mono text-content-secondary">
                          {formatPaiseToRupees(ord.remaining_balance_paise)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                              ord.payment_status === 'VERIFIED_TOKEN'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : ord.payment_status === 'PENDING_VERIFICATION'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40 animate-pulse'
                                : 'bg-white/5 text-content-muted'
                            }`}
                          >
                            {ord.payment_status}
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

      {/* ── TAB 3: CATALOGUE & DEMO PRICING ───────────────────────── */}
      {activeTab === 'catalogue' && (
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="font-semibold text-content-primary">Diwali Poster Inventory & Demo Pricing Rules</p>
              <p className="text-content-muted mt-0.5">
                Original printed prices remain immutable. Admin may configure demo simulation prices within printed bounds.
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
                    <th className="p-3.5">SKU & Item</th>
                    <th className="p-3.5">Pack Info</th>
                    <th className="p-3.5">Printed Price Text</th>
                    <th className="p-3.5">Printed Bounds</th>
                    <th className="p-3.5">Current Demo Price</th>
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
                            Edit Demo Price
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

      {/* ── TAB 4: AUDIT LOGS ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="py-6 space-y-4">
          <div className="bg-bg-surface p-4 rounded-2xl border border-white/10 text-xs text-content-secondary">
            <p className="font-semibold text-content-primary">Immutable Audit Stream</p>
            <p className="text-content-muted mt-0.5">
              Tracks all pricing updates, overrides, status changes, and payment verification events.
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

      {/* ── TAB 5: SIMULATION SETTINGS ───────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="py-6 max-w-2xl space-y-4">
          <div className="bg-bg-surface border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-content-primary">Master Simulation Parameters</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Master Commerce Checkout</p>
                  <p className="text-content-muted">When false, real payment gateway is completely blocked.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  DISABLED (DEMO ONLY)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Fixed Token Amount</p>
                  <p className="text-content-muted">Strictly fixed at ₹100.00 for all qualifying orders.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  ₹100.00 (10,000 paise)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-white/5">
                <div>
                  <p className="font-semibold text-content-primary">Subtotal Minimum Threshold</p>
                  <p className="text-content-muted">Enforces that cart subtotal meets or exceeds the ₹100 token.</p>
                </div>
                <span className="px-3 py-1 rounded-full font-mono font-bold bg-white/10 text-content-primary">
                  &ge; ₹100.00
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAILS & VERIFICATION MODAL ───────────────────── */}
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
                Mobile: <span className="font-mono text-content-secondary">{selectedOrder.customer_mobile}</span> • Fulfilment: {selectedOrder.fulfilment_preference}
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
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Fixed ₹100 Demo Token:</span>
                <span className="font-mono">{formatPaiseToRupees(selectedOrder.token_amount_paise)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-content-muted">Remaining Balance Due:</span>
                <span className="font-mono font-bold text-festive-marigold">
                  {formatPaiseToRupees(selectedOrder.remaining_balance_paise)}
                </span>
              </div>
            </div>

            {/* UTR Verification Section */}
            <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">
                  Simulated Payment UTR Verification
                </span>
                <span className="text-xs font-mono font-bold text-content-primary">
                  {selectedOrder.payment_reference || 'NO UTR SUBMITTED'}
                </span>
              </div>

              {selectedOrder.payment_status === 'PENDING_VERIFICATION' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder.id, 'APPROVE_TOKEN')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors"
                  >
                    Approve ₹100 Token
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder.id, 'REJECT_INVALID_UTR')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition-colors"
                  >
                    Flag / Reject UTR
                  </button>
                </div>
              )}

              {selectedOrder.payment_status === 'VERIFIED_TOKEN' && (
                <p className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                  ✓ Token payment of ₹100 has been verified.
                </p>
              )}
            </div>

            {/* Operational Status Transitions */}
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
                <h3 className="text-base font-bold text-content-primary">Edit Demo Price</h3>
                <p className="text-xs text-content-muted">{editingVariant.name}</p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-content-muted hover:text-content-primary text-xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-bg-elevated p-3 rounded-xl border border-white/5 text-xs space-y-1">
              <p className="text-content-muted">
                Original Printed Text: <span className="font-semibold text-content-primary">{editingVariant.printedPriceText}</span>
              </p>
              {editingVariant.printedMinPaise !== null && editingVariant.printedMinPaise !== undefined && (
                <p className="text-content-muted font-mono">
                  Printed Range: ₹{editingVariant.printedMinPaise / 100} to ₹
                  {(editingVariant.printedMaxPaise || editingVariant.printedMinPaise) / 100}
                </p>
              )}
            </div>

            <form onSubmit={handleSaveDemoPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-secondary mb-1">
                  Demo Price in Rupees (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPriceRupees}
                  onChange={(e) => setNewPriceRupees(e.target.value)}
                  placeholder="e.g. 220.00"
                  className="w-full bg-bg-elevated border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-content-primary focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                  required
                />
              </div>

              {/* Explicit Override Accordion if price is outside printed boundaries */}
              {(() => {
                const valPaise = Math.round((parseFloat(newPriceRupees) || 0) * 100);
                const min = editingVariant.printedMinPaise;
                const max = editingVariant.printedMaxPaise;
                const isOut =
                  (min !== null && min !== undefined && valPaise < min) ||
                  (max !== null && max !== undefined && valPaise > max);

                if (!isOut) return null;

                return (
                  <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-xl space-y-2 text-xs">
                    <p className="text-red-300 font-semibold">
                      ⚠️ Entered price is outside the printed range!
                    </p>
                    <p className="text-content-muted">
                      An administrator override justification is strictly required to save this price.
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-red-200 mb-1">
                        Override Reason / Audit Justification
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Owner verified wholesale supplier increase"
                        className="w-full bg-bg-base border border-red-700/50 rounded-lg px-3 py-1.5 text-xs text-content-primary focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                        className="rounded border-red-700 text-festive-marigold"
                      />
                      <span className="text-content-secondary text-[11px]">
                        Confirm administrative override outside printed range
                      </span>
                    </label>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-bg-elevated hover:bg-white/10 text-content-secondary border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-festive-marigold hover:bg-festive-amber text-black"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
