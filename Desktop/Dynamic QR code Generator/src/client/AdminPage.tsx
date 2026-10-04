import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '../components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import type {
  AdminCardSummary,
  AdminCardDetail,
  AdminDashboardStats,
  AdminBatchSummary,
  AdminAuditLogEntry,
  ProvisionedCard,
  CreateBatchResponse,
  PaginatedResult,
  ApiResponse,
  CardStatus,
} from '../shared/types';
import {
  generateBatchZipPackage,
  generateAdminMappingCsv,
  formatBatchZipFilename,
} from '../shared/fulfillment';
import { CANONICAL_PUBLIC_HOST } from '../shared/url';

type ActiveTab = 'inventory' | 'provisioning' | 'audit';

export const AdminPage: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  // Authentication & Identity
  const [adminEmail, setAdminEmail] = useState<string>(
    () => sessionStorage.getItem('qroute_admin_email') || ''
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Overview
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Batches
  const [batches, setBatches] = useState<AdminBatchSummary[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  // Card Inventory
  const [cards, setCards] = useState<AdminCardSummary[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCards, setTotalCards] = useState<number>(0);

  // Selected Card for Inspection / Detail Modal
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardDetail, setCardDetail] = useState<AdminCardDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Modals & Confirmation States
  const [actionTarget, setActionTarget] = useState<AdminCardSummary | null>(null);
  const [actionType, setActionType] = useState<'disable' | 'restore' | 'retire' | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Batch Provisioning Form State
  const [batchName, setBatchName] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(10);
  const [provisioningLoading, setProvisioningLoading] = useState<boolean>(false);
  const [provisionResult, setProvisionResult] = useState<CreateBatchResponse | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  // Export State
  const [isExportingBatch, setIsExportingBatch] = useState<boolean>(false);
  const [exportingBatchId, setExportingBatchId] = useState<string | null>(null);

  // Platform Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Global Notification / Toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper for authenticated admin fetch
  const adminFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      const activeEmail = adminEmail || sessionStorage.getItem('qroute_admin_email');
      if (activeEmail) {
        headers.set('x-admin-email', activeEmail);
        headers.set('cf-access-authenticated-user-email', activeEmail);
      }
      return fetch(url, { ...options, headers });
    },
    [adminEmail]
  );

  // Trigger browser file download
  const downloadFile = (bytes: Uint8Array | string, filename: string, mimeType: string) => {
    const blob =
      typeof bytes === 'string'
        ? new Blob([bytes], { type: mimeType })
        : new Blob([bytes as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Fetch Dashboard Stats & Batches
  const loadDashboard = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminFetch('/api/admin/dashboard');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError('Unauthorized: Cloudflare Access Identity header missing or rejected.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<
        AdminDashboardStats | { stats: AdminDashboardStats; recentBatches?: AdminBatchSummary[] }
      > = await res.json();
      if (data.success) {
        const rawData = data.data as Record<string, unknown>;
        const statsData = (
          'stats' in rawData && rawData.stats ? rawData.stats : rawData
        ) as AdminDashboardStats;
        setDashboardStats(statsData);
        if ('recentBatches' in rawData && Array.isArray(rawData.recentBatches)) {
          setBatches(rawData.recentBatches as AdminBatchSummary[]);
        }
        if (statsData.adminEmail) {
          setAdminEmail(statsData.adminEmail);
        }
        setIsAuthenticated(true);
        setAuthError(null);
      }

      // Also refresh full batch list
      const batchRes = await adminFetch('/api/admin/batches?limit=100');
      if (batchRes.ok) {
        const batchData: ApiResponse<PaginatedResult<AdminBatchSummary>> = await batchRes.json();
        if (batchData.success) {
          setBatches(batchData.data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [adminFetch]);

  // 2. Fetch Cards Inventory
  const loadCards = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '10');
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (selectedBatchId !== 'ALL') {
        params.set('batchId', selectedBatchId);
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }

      const res = await adminFetch(`/api/admin/cards?${params.toString()}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<PaginatedResult<AdminCardSummary>> = await res.json();
      if (data.success) {
        setCards(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCards(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      showToast('error', 'Failed to retrieve card inventory.');
    } finally {
      setInventoryLoading(false);
    }
  }, [adminFetch, currentPage, statusFilter, selectedBatchId, searchQuery]);

  // 3. Fetch Platform Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await adminFetch('/api/admin/audit?limit=50');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<PaginatedResult<AdminAuditLogEntry>> = await res.json();
      if (data.success) {
        setAuditLogs(data.data.items);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [adminFetch]);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Active tab effect
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadCards();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, loadCards, loadAuditLogs]);

  // Handle Card Detail Inspection
  const handleInspectCard = async (cardId: string) => {
    setSelectedCardId(cardId);
    setDetailLoading(true);
    try {
      const res = await adminFetch(`/api/admin/cards/${cardId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<AdminCardDetail> = await res.json();
      if (data.success) {
        setCardDetail(data.data);
      }
    } catch {
      showToast('error', 'Failed to fetch card details.');
      setSelectedCardId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Execute Card Lifecycle Action
  const handleExecuteAction = async () => {
    if (!actionTarget || !actionType) return;
    setActionSubmitting(true);
    setActionError(null);

    try {
      let endpoint = '';
      switch (actionType) {
        case 'disable':
          endpoint = `/api/admin/cards/${actionTarget.id}/disable`;
          break;
        case 'restore':
          endpoint = `/api/admin/cards/${actionTarget.id}/restore`;
          break;
        case 'retire':
          endpoint = `/api/admin/cards/${actionTarget.id}/retire`;
          break;
      }

      const res = await adminFetch(endpoint, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Operation failed');
      }

      showToast(
        'success',
        `Card ${actionTarget.publicId} successfully updated (${actionType.toUpperCase()}).`
      );
      setActionTarget(null);
      setActionType(null);
      loadCards();
      loadDashboard();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action execution failed');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Provision Batch
  const handleProvisionBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioningLoading(true);
    setProvisionError(null);

    try {
      const res = await adminFetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName,
          cardCount: batchCount,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to create batch`);
      }

      const data: ApiResponse<CreateBatchResponse> = await res.json();
      if (data.success) {
        setProvisionResult(data.data);
        showToast(
          'success',
          `Batch "${data.data.batch.name}" (${data.data.batch.cardCount} cards) created successfully.`
        );
        loadDashboard();
      }
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : 'Failed to provision batch');
    } finally {
      setProvisioningLoading(false);
    }
  };

  // Export newly provisioned batch
  const handleExportProvisionedBatch = async () => {
    if (!provisionResult) return;
    setIsExportingBatch(true);
    try {
      const zipBytes = await generateBatchZipPackage(
        provisionResult.cards,
        provisionResult.batch.name
      );
      const filename = formatBatchZipFilename(provisionResult.batch.name);
      downloadFile(zipBytes, filename, 'application/zip');
      showToast('success', `Supplier package "${filename}" exported successfully.`);
    } catch (err) {
      console.error('Batch export failed:', err);
      showToast('error', err instanceof Error ? err.message : 'Batch export failed');
    } finally {
      setIsExportingBatch(false);
    }
  };

  // Download Admin Key Mapping CSV (strictly separate from supplier package)
  const handleDownloadAdminMapping = () => {
    if (!provisionResult) return;
    try {
      const csv = generateAdminMappingCsv(provisionResult.cards, provisionResult.batch.name);
      const filename = `QRoute_Admin_Keys_${provisionResult.batch.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      showToast('success', 'Admin key mapping backup downloaded.');
    } catch (err) {
      console.error('Admin mapping download failed:', err);
      showToast('error', 'Failed to generate admin mapping');
    }
  };

  // Export existing batch from inventory
  const handleExportExistingBatch = async (batchId: string, bName: string) => {
    setExportingBatchId(batchId);
    try {
      // Fetch all cards belonging to this batch
      const res = await adminFetch(`/api/admin/cards?batchId=${batchId}&limit=500`);
      if (!res.ok) throw new Error('Failed to retrieve cards for batch export');
      const data: ApiResponse<PaginatedResult<AdminCardSummary>> = await res.json();
      if (!data.success || data.data.items.length === 0) {
        throw new Error('No cards found in this batch');
      }

      const zipBytes = await generateBatchZipPackage(data.data.items, bName);
      const filename = formatBatchZipFilename(bName);
      downloadFile(zipBytes, filename, 'application/zip');
      showToast('success', `Supplier package "${filename}" exported successfully.`);
    } catch (err) {
      console.error('Batch export error:', err);
      showToast('error', err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingBatchId(null);
    }
  };

  // Badge helper
  const getStatusBadge = (status: CardStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="active">Active</Badge>;
      case 'UNACTIVATED':
        return <Badge variant="unactivated">Unactivated</Badge>;
      case 'DISABLED':
        return <Badge variant="disabled">Disabled</Badge>;
      case 'RETIRED':
        return <Badge variant="retired">Retired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const selectedBatchObj = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  // Render Authentication Gate if 401
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6">
        <PageContainer size="narrow">
          <Card className="border-zinc-200 shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  QRoute Security Boundary
                </span>
                <Badge variant="disabled">Access Required</Badge>
              </div>
              <CardTitle className="text-2xl pt-2">Cloudflare Zero Trust Required</CardTitle>
              <CardDescription>
                This administrative console is restricted to authenticated operators via Cloudflare
                Access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {authError || 'Missing Cloudflare Access identity token or email header.'}
              </div>

              <div className="pt-2 border-t border-zinc-200 space-y-3">
                <p className="text-xs text-zinc-600">
                  <strong>Local / Dev Testing Bypass:</strong> Enter an authorized admin email to
                  simulate Cloudflare Access headers in test environments.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('qroute_admin_email', adminEmail);
                      setIsAuthenticated(true);
                      loadDashboard();
                    }}
                  >
                    Authenticate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col text-zinc-900">
      {/* Toast Notification */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-md border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{notification.message}</span>
        </aside>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5 text-zinc-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white font-mono font-bold text-sm">
                QR
              </div>
              <span className="font-semibold tracking-tight text-base">QRoute Admin</span>
            </a>
            <span className="hidden sm:inline-block h-4 w-px bg-zinc-200" />
            <span className="hidden sm:inline-block text-xs text-zinc-500 font-mono">
              Zero Trust &bull; Edge Operations
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 font-medium truncate max-w-[180px] sm:max-w-none">
                {adminEmail && adminEmail !== 'admin@qroute.local'
                  ? adminEmail
                  : 'Authenticated Admin'}
              </span>
            </div>
            <a
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Public Home &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1">
        <PageContainer size="wide" className="space-y-6">
          {/* Header & Metrics */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                Card Lifecycle & Routing Operations
              </h1>
              <p className="text-sm text-zinc-500">
                Self-hosted dynamic QR & NFC routing platform. Canonical host:{' '}
                <code className="text-xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                  {CANONICAL_PUBLIC_HOST}
                </code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadDashboard();
                  if (activeTab === 'inventory') loadCards();
                  if (activeTab === 'audit') loadAuditLogs();
                }}
                isLoading={statsLoading || inventoryLoading}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Metric KPI Summary */}
          <section
            aria-label="Platform KPI Summary"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Cards
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 font-mono-tabular">
                {dashboardStats?.totalCards ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Active
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700 font-mono-tabular">
                {dashboardStats?.activeCards ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Unactivated
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-amber-700 font-mono-tabular">
                {dashboardStats?.unactivatedCards ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                Disabled
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-red-700 font-mono-tabular">
                {dashboardStats?.disabledCards ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-100/50 p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Retired
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-700 font-mono-tabular">
                {dashboardStats?.retiredCards ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Batches
              </span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 font-mono-tabular">
                {dashboardStats?.totalBatches ?? '—'}
              </p>
            </div>
          </section>

          {/* Tab Navigation (Target: Inventory, Batch Provisioning, Audit Trail) */}
          <nav aria-label="Admin Navigation Tabs" className="border-b border-zinc-200">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}
              >
                Card Inventory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('provisioning')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'provisioning'
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}
              >
                Batch Provisioning
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}
              >
                Audit Trail
              </button>
            </div>
          </nav>

          {/* TAB 1: CARD INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search by Public ID or Business..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-xs h-9 text-sm"
                  />

                  {/* Status Filters */}
                  <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
                    {['ALL', 'ACTIVE', 'UNACTIVATED', 'DISABLED', 'RETIRED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setCurrentPage(1);
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          statusFilter === st
                            ? 'bg-zinc-950 text-white'
                            : 'text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Batch Selector Filter */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => {
                        setSelectedBatchId(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                      aria-label="Filter cards by batch"
                    >
                      <option value="ALL">All Batches</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.cardCount} cards)
                        </option>
                      ))}
                    </select>

                    {/* Batch-Level Export Batch Action */}
                    {selectedBatchId !== 'ALL' && selectedBatchObj && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() =>
                          handleExportExistingBatch(selectedBatchObj.id, selectedBatchObj.name)
                        }
                        isLoading={exportingBatchId === selectedBatchObj.id}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Export Batch ({selectedBatchObj.name})
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-zinc-500">
                  Found <strong className="text-zinc-900">{totalCards}</strong> cards
                </div>
              </div>

              {/* Cards Table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/75 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Public ID</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Business / Destination</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {inventoryLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          Loading inventory...
                        </td>
                      </tr>
                    ) : cards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          No cards found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      cards.map((card) => (
                        <tr key={card.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-zinc-900">
                              {card.publicId}
                            </span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(card.status)}</td>
                          <td className="px-4 py-3 max-w-[280px]">
                            {card.businessName ? (
                              <div className="font-medium text-zinc-900 truncate">
                                {card.businessName}
                              </div>
                            ) : (
                              <div className="text-zinc-400 italic text-xs">Unclaimed</div>
                            )}
                            {card.destinationUrl && (
                              <a
                                href={card.destinationUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="block truncate text-xs text-zinc-500 hover:text-zinc-800"
                              >
                                {card.destinationUrl}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {card.batchName || 'Default'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 font-mono-tabular">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleInspectCard(card.id)}
                                className="h-7 px-2 text-xs"
                              >
                                Inspect
                              </Button>

                              {card.status === 'ACTIVE' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActionTarget(card);
                                    setActionType('disable');
                                  }}
                                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Disable
                                </Button>
                              )}

                              {card.status === 'DISABLED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActionTarget(card);
                                    setActionType('restore');
                                  }}
                                  className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
                                >
                                  Restore
                                </Button>
                              )}

                              {card.status !== 'RETIRED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActionTarget(card);
                                    setActionType('retire');
                                  }}
                                  className="h-7 px-2 text-xs text-zinc-600 hover:bg-zinc-100"
                                >
                                  Retire
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-500">
                  Page <strong className="text-zinc-900">{currentPage}</strong> of{' '}
                  <strong className="text-zinc-900">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || inventoryLoading}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || inventoryLoading}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BATCH PROVISIONING (CREATE BATCH -> EXPORT QR ASSETS -> SEND TO SUPPLIER) */}
          {activeTab === 'provisioning' && (
            <div className="space-y-6">
              {/* Batch Creation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Provision New Card Batch</CardTitle>
                  <CardDescription>
                    Create a new production batch of dynamic review cards. Each card receives a
                    cryptographically random 16-character Crockford Base32 public ID and a secure
                    one-time activation code.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProvisionBatch} className="space-y-4 max-w-lg">
                    {provisionError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {provisionError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                        Batch Name / Description
                      </label>
                      <Input
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="e.g. Batch 2026-A (50 Cards)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                        Number of Cards (1 - 500)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={batchCount}
                        onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                        required
                      />
                    </div>
                    <Button type="submit" isLoading={provisioningLoading}>
                      Generate Batch
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Immediate Batch Success State */}
              {provisionResult && (
                <div className="space-y-5" data-testid="batch-success-state">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-base font-bold text-zinc-950">
                            Batch Created Successfully
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-zinc-700 font-mono-tabular">
                          <span>
                            Batch:{' '}
                            <strong className="text-zinc-950 font-sans">
                              {provisionResult.batch.name}
                            </strong>
                          </span>
                          <span className="text-zinc-300">&bull;</span>
                          <span>
                            Cards:{' '}
                            <strong className="text-zinc-950">
                              {provisionResult.batch.cardCount}
                            </strong>
                          </span>
                          <span className="text-zinc-300">&bull;</span>
                          <span className="flex items-center gap-1">
                            Status: <Badge variant="unactivated">UNACTIVATED</Badge>
                          </span>
                        </div>
                      </div>

                      {/* Primary and Secondary CTAs */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleExportProvisionedBatch}
                          isLoading={isExportingBatch}
                          data-testid="export-batch-cta"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Batch
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => {
                            setSelectedBatchId(provisionResult.batch.id);
                            setActiveTab('inventory');
                            loadCards();
                          }}
                        >
                          View in Inventory
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={handleDownloadAdminMapping}
                          title="Internal admin backup only. Never send to suppliers."
                          className="text-xs text-zinc-600"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1.5 text-zinc-500" />
                          Download Admin Keys (CSV)
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Summary of Cards in Batch */}
                  <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Generated Cards ({provisionResult.cards.length})
                      </span>
                      <span className="text-xs text-zinc-500">
                        Ready for supplier export (SVG + PNG + PDF)
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">Public ID</th>
                            <th className="px-4 py-2.5">One-Time Activation Code</th>
                            <th className="px-4 py-2.5">Routing URL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-mono text-xs">
                          {provisionResult.cards.map((c: ProvisionedCard, idx: number) => (
                            <tr key={c.publicId} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-2 text-zinc-400 font-mono-tabular">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2 font-bold text-zinc-900">{c.publicId}</td>
                              <td className="px-4 py-2 font-semibold text-emerald-700">
                                {c.activationCode}
                              </td>
                              <td className="px-4 py-2 text-zinc-500">
                                https://{CANONICAL_PUBLIC_HOST}/c/{c.publicId}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Public Card ID</th>
                      <th className="px-4 py-3">Admin / Actor</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          Loading audit trail...
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 text-xs text-zinc-500 font-mono-tabular">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-zinc-900">
                            {log.publicId || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 font-mono">
                            {log.actor || log.actorIdentifier}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">
                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </PageContainer>
      </main>

      {/* MODAL 1: CARD DETAIL & AUDIT TIMELINE INSPECTOR */}
      {selectedCardId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Card Detail & Audit Timeline</h3>
                <p className="text-xs text-zinc-500">System Record ID: {selectedCardId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCardId(null);
                  setCardDetail(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {detailLoading || !cardDetail ? (
              <div className="p-8 text-center text-zinc-500">Loading card metadata...</div>
            ) : (
              <div className="space-y-6">
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500">PUBLIC ID:</span>
                    <p className="font-bold text-zinc-900 text-sm">{cardDetail.publicId}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">STATUS:</span>
                    <div>{getStatusBadge(cardDetail.status)}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">BUSINESS NAME:</span>
                    <p className="font-sans font-medium text-zinc-900">
                      {cardDetail.businessName || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">BATCH NAME:</span>
                    <p className="font-sans text-zinc-700">{cardDetail.batchName || 'Default'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500">DESTINATION URL:</span>
                    <p className="font-sans text-xs break-all text-zinc-800">
                      {cardDetail.destinationUrl || 'None'}
                    </p>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-3">
                    Audit Log Timeline ({cardDetail.auditLogs.length} events)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cardDetail.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-zinc-200 p-3 text-xs space-y-1 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-zinc-900">{log.action}</span>
                          <span className="text-zinc-400 font-mono-tabular">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-zinc-600">
                          Actor: <strong>{log.actor || log.actorIdentifier}</strong>
                        </div>
                        {log.metadata && (
                          <div className="text-zinc-500 font-mono text-[11px] pt-1">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCardId(null);
                  setCardDetail(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION / ACTION MODAL (DISABLE, RESTORE, RETIRE, EDIT DEST) */}
      {actionTarget && actionType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-950">
              {actionType === 'disable' && `Disable Card ${actionTarget.publicId}`}
              {actionType === 'restore' && `Restore Card ${actionTarget.publicId}`}
              {actionType === 'retire' && `Permanently Retire Card ${actionTarget.publicId}`}
            </h3>

            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            {actionType === 'disable' && (
              <p className="text-sm text-zinc-600">
                Scans to this card will immediately display a <strong>Temporarily Inactive</strong>{' '}
                notice instead of redirecting. You may restore this card at any time.
              </p>
            )}

            {actionType === 'restore' && (
              <p className="text-sm text-zinc-600">
                This will transition the card back to <strong>ACTIVE</strong>. Customer scans will
                immediately resume redirecting to the configured Google Review destination.
              </p>
            )}

            {actionType === 'retire' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 space-y-1">
                <p className="font-bold">⚠️ IRREVERSIBLE TERMINAL STATE</p>
                <p>
                  Retiring a card permanently takes it out of service. Once retired, this card{' '}
                  <strong>CANNOT be restored or re-activated</strong>.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionTarget(null);
                  setActionType(null);
                  setActionError(null);
                }}
                disabled={actionSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'retire' ? 'destructive' : 'primary'}
                size="sm"
                onClick={handleExecuteAction}
                isLoading={actionSubmitting}
              >
                {actionType === 'disable' && 'Confirm Disable'}
                {actionType === 'restore' && 'Confirm Restore'}
                {actionType === 'retire' && 'Permanently Retire'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
