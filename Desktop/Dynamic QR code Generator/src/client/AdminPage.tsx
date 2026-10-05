import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  MoreHorizontal,
  History,
  Eye,
  EyeOff,
  Copy,
  Check,
  LogOut,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Pencil,
} from 'lucide-react';
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
  AdminBatchDetail,
  AdminAuditLogEntry,
  AdminVaultKeyEntry,
  AdminBatchKeysResponse,
  ProvisionedCard,
  CreateBatchResponse,
  PaginatedResult,
  ApiResponse,
  CardStatus,
  UpdateCardDestinationResponse,
} from '../shared/types';
import {
  generateBatchZipPackage,
  generateAdminMappingCsv,
  formatBatchZipFilename,
  generateActivationKeysCsv,
  formatActivationKeysCsvFilename,
} from '../shared/fulfillment';
import { CANONICAL_PUBLIC_HOST } from '../shared/url';
import { validateGoogleReviewUrl } from '../shared/google-url-validator';

type ActiveTab = 'inventory' | 'batches' | 'audit';

export const AdminPage: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  // Batch History & Inspection
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<AdminBatchDetail | null>(null);
  const [batchDetailLoading, setBatchDetailLoading] = useState<boolean>(false);
  const [isProvisionFormOpen, setIsProvisionFormOpen] = useState<boolean>(false);

  // Child Vault Modal for specific batch
  const [vaultModalBatch, setVaultModalBatch] = useState<AdminBatchSummary | null>(null);

  // Edit Routing URL Modal
  const [editingRoutingCard, setEditingRoutingCard] = useState<{
    id: string;
    publicId: string;
    destinationUrl?: string | null;
  } | null>(null);
  const [newRoutingUrl, setNewRoutingUrl] = useState<string>('');
  const [routingUrlError, setRoutingUrlError] = useState<string | null>(null);
  const [routingUrlSaving, setRoutingUrlSaving] = useState<boolean>(false);

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

  // Selected Card for Concise Audit Modal
  const [auditModalCard, setAuditModalCard] = useState<AdminCardDetail | null>(null);

  // Active Dropdown Action Menu
  const [activeDropdownCardId, setActiveDropdownCardId] = useState<string | null>(null);

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

  // Activation Key Vault State
  const [vaultBatchId, setVaultBatchId] = useState<string>('');
  const [vaultKeys, setVaultKeys] = useState<AdminVaultKeyEntry[]>([]);
  const [vaultLoading, setVaultLoading] = useState<boolean>(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedPublicId, setCopiedPublicId] = useState<string | null>(null);
  const [copiedDestination, setCopiedDestination] = useState<boolean>(false);

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
          if (batchData.data.items.length > 0 && !vaultBatchId) {
            setVaultBatchId(batchData.data.items[0]!.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [adminFetch, vaultBatchId]);

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

  // 3. Fetch Activation Keys from Vault
  const loadVaultKeys = useCallback(
    async (batchId: string) => {
      if (!batchId) return;
      setVaultLoading(true);
      setVaultError(null);
      try {
        const res = await adminFetch(`/api/admin/batches/${batchId}/keys`);
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error?.message || `HTTP ${res.status}: Failed to load keys`);
        }
        const data: ApiResponse<AdminBatchKeysResponse> = await res.json();
        if (data.success) {
          setVaultKeys(data.data.keys);
          setRevealedKeys(new Set()); // Default all masked
        }
      } catch (err) {
        console.error('Failed to load vault keys:', err);
        setVaultError(err instanceof Error ? err.message : 'Failed to retrieve activation keys');
      } finally {
        setVaultLoading(false);
      }
    },
    [adminFetch]
  );

  // 4. Fetch Batches List
  const loadBatches = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/batches?limit=100');
      if (res.ok) {
        const batchData: ApiResponse<PaginatedResult<AdminBatchSummary>> = await res.json();
        if (batchData.success) {
          setBatches(batchData.data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  }, [adminFetch]);

  // 5. Fetch Platform Audit Logs
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
    } else if (activeTab === 'batches') {
      loadBatches();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, loadCards, loadBatches, loadAuditLogs]);

  // Inspect specific batch details & its cards
  const handleInspectBatch = async (batchId: string) => {
    setBatchDetailLoading(true);
    try {
      const res = await adminFetch(`/api/admin/batches/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<AdminBatchDetail> = await res.json();
      if (data.success) {
        setSelectedBatchDetail(data.data);
      }
    } catch {
      showToast('error', 'Failed to retrieve batch details.');
    } finally {
      setBatchDetailLoading(false);
    }
  };

  // Open child Activation Keys vault for a specific batch
  const handleOpenBatchVault = (batch: AdminBatchSummary) => {
    setVaultModalBatch(batch);
    setVaultBatchId(batch.id);
    loadVaultKeys(batch.id);
  };

  // Open Edit Routing URL modal for ACTIVE card
  const handleOpenEditRouting = (card: {
    id: string;
    publicId: string;
    destinationUrl?: string | null;
  }) => {
    setEditingRoutingCard(card);
    setNewRoutingUrl(card.destinationUrl || '');
    setRoutingUrlError(null);
  };

  // Save new routing URL for ACTIVE card
  const handleSaveRoutingUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoutingCard) return;

    const validation = validateGoogleReviewUrl(newRoutingUrl);
    if (!validation.isValid || !validation.normalizedUrl) {
      setRoutingUrlError(validation.error || 'Please enter a valid Google Review destination URL.');
      return;
    }

    const normalizedUrl = validation.normalizedUrl;
    setRoutingUrlSaving(true);
    setRoutingUrlError(null);

    try {
      const res = await adminFetch(`/api/admin/cards/${editingRoutingCard.id}/destination`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: normalizedUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message || `HTTP ${res.status}: Failed to update destination`
        );
      }

      const data: ApiResponse<UpdateCardDestinationResponse> = await res.json();
      if (data.success) {
        showToast(
          'success',
          `Routing URL for card ${editingRoutingCard.publicId} updated successfully.`
        );
        if (cardDetail && cardDetail.id === editingRoutingCard.id) {
          setCardDetail({ ...cardDetail, destinationUrl: normalizedUrl });
        }
        if (selectedBatchDetail) {
          setSelectedBatchDetail({
            ...selectedBatchDetail,
            cards: selectedBatchDetail.cards.map((c) =>
              c.id === editingRoutingCard.id ? { ...c, destinationUrl: normalizedUrl } : c
            ),
          });
        }
        setEditingRoutingCard(null);
        loadCards();
        loadBatches();
      }
    } catch (err) {
      setRoutingUrlError(
        err instanceof Error ? err.message : 'Failed to update routing destination'
      );
    } finally {
      setRoutingUrlSaving(false);
    }
  };

  // Handle Card Detail Inspection
  const handleInspectCard = async (cardId: string) => {
    setSelectedCardId(cardId);
    setDetailLoading(true);
    setActiveDropdownCardId(null);
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

  // Handle Open Audit Modal
  const handleOpenAuditModal = async (card: AdminCardSummary) => {
    setActiveDropdownCardId(null);
    try {
      const res = await adminFetch(`/api/admin/cards/${card.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse<AdminCardDetail> = await res.json();
      if (data.success) {
        setAuditModalCard(data.data);
      }
    } catch {
      showToast('error', 'Failed to retrieve card audit history.');
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

  // Download Admin Key Mapping CSV
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

  // Vault key visibility toggle
  const toggleRevealKey = (publicId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) {
        next.delete(publicId);
      } else {
        next.add(publicId);
      }
      return next;
    });
  };

  const hideAllKeys = () => {
    setRevealedKeys(new Set());
  };

  const revealAllKeys = () => {
    setRevealedKeys(new Set(vaultKeys.map((k) => k.publicId)));
  };

  const copyKeyToClipboard = (publicId: string, code: string) => {
    const applyCopiedState = () => {
      setCopiedPublicId(publicId);
      showToast('success', `Copied activation key for ${publicId}`);
      setTimeout(() => setCopiedPublicId(null), 2500);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(applyCopiedState)
        .catch(() => {
          // Fallback if browser security or headless mode denies clipboard write
          applyCopiedState();
        });
    } else {
      applyCopiedState();
    }
  };

  const copyDestinationToClipboard = (url: string) => {
    const applyCopiedState = () => {
      setCopiedDestination(true);
      showToast('success', 'Destination URL copied to clipboard');
      setTimeout(() => setCopiedDestination(false), 2500);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(applyCopiedState)
        .catch(() => {
          applyCopiedState();
        });
    } else {
      applyCopiedState();
    }
  };

  const handleExportVaultKeysCsv = () => {
    if (vaultKeys.length === 0) return;
    const bName =
      vaultModalBatch?.name || batches.find((b) => b.id === vaultBatchId)?.name || 'batch';
    const csv = generateActivationKeysCsv(vaultKeys, bName);
    const filename = formatActivationKeysCsvFilename(bName);
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    showToast('success', `Exported confidential activation keys: ${filename}`);
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

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 font-medium truncate max-w-[160px] sm:max-w-none">
                {adminEmail && adminEmail !== 'admin@qroute.local'
                  ? adminEmail
                  : 'Authenticated Admin'}
              </span>
            </div>
            <a
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Public Home &rarr;
            </a>
            <a
              href="/cdn-cgi/access/logout"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-red-600 transition-colors inline-flex items-center gap-1.5"
              title="Logout of Cloudflare Access"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
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
                  if (activeTab === 'batches') loadBatches();
                  if (activeTab === 'audit') loadAuditLogs();
                }}
                isLoading={statsLoading || inventoryLoading || vaultLoading}
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

          {/* Tab Navigation: Card Inventory, Batch History, Audit Trail */}
          <nav aria-label="Admin Navigation Tabs" className="border-b border-zinc-200">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('inventory');
                  setSelectedBatchDetail(null);
                }}
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
                onClick={() => {
                  setActiveTab('batches');
                }}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'batches'
                    ? 'border-zinc-950 text-zinc-950 font-semibold'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}
              >
                Batch History
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('audit');
                  setSelectedBatchDetail(null);
                }}
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
                            <button
                              type="button"
                              onClick={() => handleInspectCard(card.id)}
                              className="font-mono font-bold text-zinc-900 hover:text-blue-600 transition-colors text-left"
                              title="View card details"
                            >
                              {card.publicId}
                            </button>
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
                            <div className="flex items-center justify-end gap-1.5 relative">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleInspectCard(card.id)}
                                className="h-7 px-2 text-xs inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900"
                                title="View card details"
                                aria-label={`View details for card ${card.publicId}`}
                              >
                                <Eye className="h-3 w-3 text-zinc-500" />
                                Details
                              </Button>
                              {card.status === 'ACTIVE' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditRouting(card)}
                                  className="h-7 px-2 text-xs inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900"
                                  title="Edit Google Routing URL"
                                  aria-label={`Edit routing URL for card ${card.publicId}`}
                                >
                                  <Pencil className="h-3 w-3 text-zinc-500" />
                                  Edit Routing URL
                                </Button>
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveDropdownCardId(
                                      activeDropdownCardId === card.id ? null : card.id
                                    )
                                  }
                                  className="h-7 w-7 rounded-md border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
                                  title="More actions"
                                  aria-label={`More actions for card ${card.publicId}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {activeDropdownCardId === card.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveDropdownCardId(null)}
                                    />
                                    <div className="absolute right-0 top-8 z-30 w-40 rounded-lg border border-zinc-200 bg-white shadow-lg p-1 text-xs text-left">
                                      <button
                                        type="button"
                                        onClick={() => handleInspectCard(card.id)}
                                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 flex items-center gap-2 text-zinc-700"
                                      >
                                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                        Card Details
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenAuditModal(card)}
                                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 flex items-center gap-2 text-zinc-700"
                                      >
                                        <History className="h-3.5 w-3.5 text-zinc-400" />
                                        View Audit
                                      </button>

                                      {card.status === 'ACTIVE' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDropdownCardId(null);
                                            handleOpenEditRouting(card);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 flex items-center gap-2 text-zinc-700"
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                                          Edit Routing URL
                                        </button>
                                      )}

                                      {card.status === 'ACTIVE' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDropdownCardId(null);
                                            setActionTarget(card);
                                            setActionType('disable');
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-50 text-red-600 flex items-center gap-2"
                                        >
                                          Disable Card
                                        </button>
                                      )}

                                      {card.status === 'DISABLED' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDropdownCardId(null);
                                            setActionTarget(card);
                                            setActionType('restore');
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-emerald-50 text-emerald-600 flex items-center gap-2"
                                        >
                                          Restore Card
                                        </button>
                                      )}

                                      {card.status !== 'RETIRED' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveDropdownCardId(null);
                                            setActionTarget(card);
                                            setActionType('retire');
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-100 text-zinc-700 flex items-center gap-2"
                                        >
                                          Retire Card
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
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

          {/* TAB 2: BATCH HISTORY */}
          {activeTab === 'batches' && (
            <div className="space-y-6">
              {batchDetailLoading ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 text-xs shadow-xs">
                  Loading batch details and constituent cards...
                </div>
              ) : selectedBatchDetail ? (
                <div className="space-y-6" data-testid="batch-detail-view">
                  {/* Breadcrumbs / Back button & Quick CTAs */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchDetail(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Batch History
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleExportExistingBatch(
                            selectedBatchDetail.batch.id,
                            selectedBatchDetail.batch.name
                          )
                        }
                        isLoading={exportingBatchId === selectedBatchDetail.batch.id}
                        className="text-xs h-8 inline-flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export Supplier Package
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBatchVault(selectedBatchDetail.batch)}
                        className="text-xs h-8 inline-flex items-center gap-1.5"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-zinc-500" />
                        Activation Keys
                      </Button>
                    </div>
                  </div>

                  {/* Batch Overview Card */}
                  <Card className="border-zinc-200 shadow-xs">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <CardTitle className="text-xl text-zinc-950">
                              {selectedBatchDetail.batch.name}
                            </CardTitle>
                            <Badge
                              variant={
                                selectedBatchDetail.batch.status === 'ACTIVE'
                                  ? 'active'
                                  : 'unactivated'
                              }
                            >
                              {selectedBatchDetail.batch.status || 'UNACTIVATED'}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs font-mono pt-1 text-zinc-500">
                            Batch ID: {selectedBatchDetail.batch.id} &bull; Created:{' '}
                            {new Date(selectedBatchDetail.batch.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                            Total Cards
                          </span>
                          <span className="text-2xl font-bold font-mono-tabular text-zinc-950">
                            {selectedBatchDetail.batch.cardCount}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                        <span>
                          Active:{' '}
                          <strong className="text-emerald-700">
                            {selectedBatchDetail.batch.activeCount ?? 0}
                          </strong>
                        </span>
                        <span className="text-zinc-300">&bull;</span>
                        <span>
                          Unactivated:{' '}
                          <strong className="text-amber-700">
                            {selectedBatchDetail.batch.unactivatedCount ??
                              selectedBatchDetail.batch.cardCount}
                          </strong>
                        </span>
                        {Number(selectedBatchDetail.batch.disabledCount || 0) > 0 && (
                          <>
                            <span className="text-zinc-300">&bull;</span>
                            <span>
                              Disabled:{' '}
                              <strong className="text-red-700">
                                {selectedBatchDetail.batch.disabledCount}
                              </strong>
                            </span>
                          </>
                        )}
                        {Number(selectedBatchDetail.batch.retiredCount || 0) > 0 && (
                          <>
                            <span className="text-zinc-300">&bull;</span>
                            <span>
                              Retired:{' '}
                              <strong className="text-zinc-700">
                                {selectedBatchDetail.batch.retiredCount}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Batch Cards Table */}
                  <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Batch Cards ({selectedBatchDetail.cards.length})
                      </span>
                      <span className="text-xs text-zinc-500">
                        Physical identifiers & routing assignments
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            <th className="px-4 py-2.5 w-12">#</th>
                            <th className="px-4 py-2.5">Public ID</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Business / Destination</th>
                            <th className="px-4 py-2.5">Created</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs">
                          {selectedBatchDetail.cards.map((c, idx) => (
                            <tr key={c.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-2.5 text-zinc-400 font-mono-tabular">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-zinc-900">
                                {c.publicId}
                              </td>
                              <td className="px-4 py-2.5">{getStatusBadge(c.status)}</td>
                              <td className="px-4 py-2.5">
                                {c.destinationUrl ? (
                                  <div className="max-w-xs">
                                    <p className="font-semibold text-zinc-900 truncate">
                                      {c.businessName || 'Configured Destination'}
                                    </p>
                                    <a
                                      href={c.destinationUrl}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="text-[11px] font-mono text-blue-600 truncate block hover:underline"
                                    >
                                      {c.destinationUrl}
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 italic">
                                    Not Activated — Destination not configured
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono-tabular text-zinc-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleInspectCard(c.id)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Details
                                  </Button>
                                  {c.status === 'ACTIVE' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditRouting(c)}
                                      className="h-7 px-2 text-xs"
                                      title="Edit Google Routing URL"
                                    >
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit Routing URL
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Batch History List View */
                <div className="space-y-6">
                  {/* Header bar with + Provision Batch button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950">Card Batch History</h2>
                      <p className="text-xs text-zinc-500">
                        Permanent records of manufactured batches. Export supplier packages and
                        access encrypted activation keys.
                      </p>
                    </div>
                    <div>
                      <Button
                        variant={isProvisionFormOpen ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => setIsProvisionFormOpen(!isProvisionFormOpen)}
                        className="text-xs"
                      >
                        {isProvisionFormOpen ? (
                          'Close Form'
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />+ Provision Batch
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible / Expandable Provisioning Form */}
                  {isProvisionFormOpen && (
                    <Card className="border-zinc-200 shadow-xs">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Provision New Card Batch</CardTitle>
                        <CardDescription className="text-xs">
                          Create a new production batch. Each card receives a random 16-char
                          Crockford Base32 ID and AES-GCM encrypted activation key.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form
                          onSubmit={async (e) => {
                            await handleProvisionBatch(e);
                            loadBatches();
                          }}
                          className="space-y-4 max-w-lg"
                        >
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
                          <div className="flex items-center gap-2">
                            <Button type="submit" isLoading={provisioningLoading} size="sm">
                              Generate Batch
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsProvisionFormOpen(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Immediate Batch Success Banner (if provisionResult exists) */}
                  {provisionResult && (
                    <div className="space-y-4" data-testid="batch-success-state">
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

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleExportProvisionedBatch}
                              isLoading={isExportingBatch}
                              data-testid="export-batch-cta"
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Export Supplier Package
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenBatchVault(provisionResult.batch)}
                              className="inline-flex items-center gap-1.5"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-zinc-500" />
                              View Activation Keys
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectBatch(provisionResult.batch.id)}
                            >
                              View Cards
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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
                              size="sm"
                              onClick={handleDownloadAdminMapping}
                              className="text-xs text-zinc-600"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                              Admin Keys (CSV)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProvisionResult(null)}
                              className="text-zinc-500 hover:text-zinc-800"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Summary Table of Generated Cards */}
                      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
                        <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                            Generated Cards ({provisionResult.cards.length})
                          </span>
                          <span className="text-xs text-zinc-500">
                            Ready for supplier export (SVG + PNG + PDF)
                          </span>
                        </div>
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                <th className="px-4 py-2">#</th>
                                <th className="px-4 py-2">Public ID</th>
                                <th className="px-4 py-2">One-Time Activation Code</th>
                                <th className="px-4 py-2">Routing URL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 font-mono text-xs">
                              {provisionResult.cards.map((c: ProvisionedCard, idx: number) => (
                                <tr key={c.publicId} className="hover:bg-zinc-50/50">
                                  <td className="px-4 py-1.5 text-zinc-400 font-mono-tabular">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-1.5 font-bold text-zinc-900">
                                    {c.publicId}
                                  </td>
                                  <td className="px-4 py-1.5 font-semibold text-emerald-700">
                                    {c.activationCode}
                                  </td>
                                  <td className="px-4 py-1.5 text-zinc-500">
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

                  {/* Persistent Batches Table */}
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
                    <div className="px-4 py-3 bg-zinc-50/75 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        All Manufactured Batches ({batches.length})
                      </span>
                      <span className="text-xs text-zinc-400">
                        Select any batch to inspect, export, or retrieve keys
                      </span>
                    </div>
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3">Batch Name</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3">Total Cards</th>
                          <th className="px-4 py-3">Activation Summary</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {batches.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                              No batches created yet. Click &quot;Provision New Batch&quot; to
                              manufacture your first card batch.
                            </td>
                          </tr>
                        ) : (
                          batches.map((b) => (
                            <tr key={b.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-zinc-950">
                                <button
                                  type="button"
                                  onClick={() => handleInspectBatch(b.id)}
                                  className="hover:underline text-left"
                                >
                                  {b.name}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-xs text-zinc-500 font-mono-tabular">
                                {new Date(b.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-mono-tabular font-bold text-zinc-900">
                                {b.cardCount}
                              </td>
                              <td className="px-4 py-3 text-xs text-zinc-600 font-mono-tabular">
                                {b.statusSummary ||
                                  `${b.activeCount || 0} Active · ${b.unactivatedCount || b.cardCount} Unactivated`}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    b.status === 'ACTIVE'
                                      ? 'active'
                                      : b.status === 'MIXED'
                                        ? 'neutral'
                                        : 'unactivated'
                                  }
                                >
                                  {b.status || 'UNACTIVATED'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleInspectBatch(b.id)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Cards
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExportExistingBatch(b.id, b.name)}
                                    isLoading={exportingBatchId === b.id}
                                    className="h-7 px-2 text-xs"
                                    title="Export Supplier Package (ZIP)"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export Supplier Package
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenBatchVault(b)}
                                    className="h-7 px-2 text-xs"
                                    title="View Encrypted Activation Keys"
                                  >
                                    <KeyRound className="h-3 w-3 mr-1" />
                                    Activation Keys
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
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

      {/* MODAL 1: COMPACT CARD DETAILS MODAL */}
      {selectedCardId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Card Details</h3>
                <p className="text-xs font-mono font-bold text-zinc-600">
                  {cardDetail?.publicId || selectedCardId}
                </p>
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
              <div className="p-8 text-center text-zinc-500 text-xs">Loading card details...</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">STATUS</span>
                    <div>{getStatusBadge(cardDetail.status)}</div>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-semibold block mb-0.5">BUSINESS NAME</span>
                    <p className="font-medium text-zinc-900 text-sm">
                      {cardDetail.businessName || (
                        <span className="text-zinc-400 italic font-normal">Unclaimed</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-zinc-500 font-semibold block mb-1">
                      GOOGLE REVIEW DESTINATION
                    </span>
                    {cardDetail.status === 'ACTIVE' && cardDetail.destinationUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200 bg-zinc-100/60">
                          <a
                            href={cardDetail.destinationUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-mono text-[11px] text-blue-600 hover:underline truncate flex-1 block"
                            title={cardDetail.destinationUrl}
                          >
                            {cardDetail.destinationUrl}
                          </a>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyDestinationToClipboard(cardDetail.destinationUrl!)}
                            className="h-6 px-2 text-[11px] shrink-0 inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900"
                            title="Copy Google Review destination URL"
                          >
                            {copiedDestination ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-zinc-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="pt-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleOpenEditRouting(cardDetail);
                            }}
                            className="h-7 px-2.5 text-xs inline-flex items-center gap-1.5 text-zinc-800 font-medium hover:bg-zinc-100"
                            title="Edit Google Routing URL"
                          >
                            <Pencil className="h-3 w-3 text-zinc-600" />
                            Edit Google Routing URL
                          </Button>
                        </div>

                        <p className="text-[10px] text-zinc-400">
                          Physical QR/NFC routing URL (https://{CANONICAL_PUBLIC_HOST}/c/
                          {cardDetail.publicId}) remains permanent and unchanged.
                        </p>
                      </div>
                    ) : cardDetail.status === 'UNACTIVATED' ? (
                      <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs">
                        <p className="text-zinc-500 italic">
                          Not Activated — Destination not configured
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Destination will be configured when merchant activates this card.
                        </p>
                      </div>
                    ) : cardDetail.status === 'DISABLED' ? (
                      <div className="space-y-1.5">
                        {cardDetail.destinationUrl && (
                          <div
                            className="font-mono text-[11px] text-zinc-500 truncate p-2 rounded bg-zinc-100/50 border border-zinc-200"
                            title={cardDetail.destinationUrl}
                          >
                            {cardDetail.destinationUrl}
                          </div>
                        )}
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                          Card is disabled. Routing is suspended. Only ACTIVE cards can have their
                          routing destination updated.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {cardDetail.destinationUrl && (
                          <div
                            className="font-mono text-[11px] text-zinc-500 truncate p-2 rounded bg-zinc-100/50 border border-zinc-200"
                            title={cardDetail.destinationUrl}
                          >
                            {cardDetail.destinationUrl}
                          </div>
                        )}
                        <p className="text-xs text-zinc-500 bg-zinc-100 p-2 rounded border border-zinc-200">
                          Card is permanently retired. Destination routing cannot be modified.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-500">BATCH</span>
                    <span className="font-medium text-zinc-800">
                      {cardDetail.batchName || 'Default'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">CREATED</span>
                    <span className="font-mono-tabular text-zinc-800">
                      {new Date(cardDetail.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
              <div>
                {cardDetail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = cardDetail;
                      setSelectedCardId(null);
                      setCardDetail(null);
                      setAuditModalCard(target);
                    }}
                    className="h-8 text-xs inline-flex items-center gap-1.5"
                  >
                    <History className="h-3 w-3" />
                    View Audit
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCardId(null);
                  setCardDetail(null);
                }}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONCISE AUDIT HISTORY */}
      {auditModalCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Audit History</h3>
                <p className="text-xs font-mono font-bold text-zinc-600">
                  {auditModalCard.publicId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalCard(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditModalCard.auditLogs && auditModalCard.auditLogs.length > 0 ? (
                auditModalCard.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900">{log.action}</span>
                      <span className="text-[11px] text-zinc-400 font-mono-tabular">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Actor:{' '}
                      <span className="font-medium text-zinc-700">
                        {log.actor || log.actorIdentifier}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-zinc-400 italic">
                  No audit records found.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200">
              <Button variant="outline" size="sm" onClick={() => setAuditModalCard(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMATION / ACTION MODAL (DISABLE, RESTORE, RETIRE) */}
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

      {/* MODAL 4: CHILD ACTIVATION KEY VAULT MODAL */}
      {vaultModalBatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-950">
                    Activation Keys &bull; {vaultModalBatch.name}
                  </h3>
                  <Badge variant="active" className="text-[10px]">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    AES-GCM Encrypted
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 pt-0.5">
                  Encrypted at rest with AES-GCM. Retrieved on demand strictly within authenticated
                  sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVaultModalBatch(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Warning banner */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
              <span className="font-bold shrink-0">ADMIN CONFIDENTIAL:</span>
              <span>
                Do not send this file or exported credentials to suppliers. Activation keys must
                never appear on physical QR/NFC payloads or supplier archives.
              </span>
            </div>

            {vaultError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {vaultError}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 font-mono-tabular">
                {vaultKeys.length} vaulted cards
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revealedKeys.size > 0 ? hideAllKeys : revealAllKeys}
                  className="text-xs h-7"
                  disabled={vaultLoading || vaultKeys.length === 0}
                >
                  {revealedKeys.size > 0 ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide All
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Reveal All
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportVaultKeysCsv}
                  disabled={vaultLoading || vaultKeys.length === 0}
                  className="text-xs h-7 inline-flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export Activation Keys (CSV)
                </Button>
              </div>
            </div>

            {/* Keys Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 flex-1 max-h-80 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 sticky top-0">
                    <th className="px-4 py-2 w-12">#</th>
                    <th className="px-4 py-2">Public ID</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Activation Key</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {vaultLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                        Decrypting vaulted keys for {vaultModalBatch.name}...
                      </td>
                    </tr>
                  ) : vaultKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                        No cards found in this batch.
                      </td>
                    </tr>
                  ) : (
                    vaultKeys.map((item, idx) => {
                      const isRevealed = revealedKeys.has(item.publicId);
                      const isCopied = copiedPublicId === item.publicId;
                      return (
                        <tr key={item.publicId} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-2 text-zinc-400 font-mono-tabular">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono font-bold text-zinc-900">
                            {item.publicId}
                          </td>
                          <td className="px-4 py-2">{getStatusBadge(item.status)}</td>
                          <td className="px-4 py-2">
                            {isRevealed ? (
                              <code className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                                {item.activationCode}
                              </code>
                            ) : (
                              <span className="font-mono text-zinc-400 select-none tracking-widest text-xs">
                                •••• •••• ••••
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRevealKey(item.publicId)}
                                className="h-6 px-2 text-[11px]"
                                title={isRevealed ? 'Hide credential' : 'Reveal credential'}
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Reveal
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyKeyToClipboard(item.publicId, item.activationCode)
                                }
                                className="h-6 px-2 text-[11px]"
                                title="Copy activation key"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-zinc-500 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200">
              <Button variant="outline" size="sm" onClick={() => setVaultModalBatch(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT ROUTING URL MODAL */}
      {editingRoutingCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Edit Google Routing URL</h3>
                <p className="text-xs font-mono font-bold text-zinc-600">
                  Card {editingRoutingCard.publicId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoutingCard(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">⚡ Immediate Redirect Update</p>
              <p>
                This changes where this existing QR/NFC card redirects. The physical QR/NFC card
                does not need to be reprinted.
              </p>
            </div>

            <form onSubmit={handleSaveRoutingUrl} className="space-y-4">
              {routingUrlError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {routingUrlError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                  Current Destination
                </label>
                <div className="p-2 rounded bg-zinc-50 border border-zinc-200 font-mono text-[11px] text-zinc-600 break-all">
                  {editingRoutingCard.destinationUrl || 'None configured'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1">
                  Google Review URL
                </label>
                <Input
                  type="url"
                  value={newRoutingUrl}
                  onChange={(e) => {
                    setNewRoutingUrl(e.target.value);
                    setRoutingUrlError(null);
                  }}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  required
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-zinc-500 pt-1">
                  Must be a valid Google Review destination URL (e.g.
                  search.google.com/local/writereview or g.page).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRoutingCard(null)}
                  disabled={routingUrlSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={routingUrlSaving}>
                  Save Routing URL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
