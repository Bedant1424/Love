import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { HealthResponse } from '../shared/types';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/healthz');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach health endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 flex flex-col justify-center">
      <PageContainer size="narrow">
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                QRoute Platform
              </span>
              <Badge variant={health?.status === 'ok' ? 'active' : 'neutral'}>
                {health?.status === 'ok' ? 'Edge Online' : 'Checking'}
              </Badge>
            </div>
            <CardTitle className="text-2xl pt-2">Foundation Shell</CardTitle>
            <CardDescription>
              Runtime, static assets, and D1 database bindings verified. Milestone 1 operational
              shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Edge Health Status
              </div>
              {loading ? (
                <p className="text-sm text-zinc-600 animate-pulse">Querying /healthz endpoint...</p>
              ) : error ? (
                <p className="text-sm text-red-600 font-medium">Error: {error}</p>
              ) : (
                <div className="space-y-1 text-sm font-mono-tabular">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status:</span>
                    <span className="font-semibold text-emerald-700">{health?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Environment:</span>
                    <span className="text-zinc-900">{health?.environment}</span>
                  </div>
                  {health?.timestamp && (
                    <div className="flex justify-between text-xs text-zinc-500 pt-1">
                      <span>Verified At:</span>
                      <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={fetchHealth}
              isLoading={loading}
            >
              Re-check Edge Liveness
            </Button>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-xs text-zinc-400">
          QRoute Dynamic QR Platform &bull; $0 Infrastructure Target
        </footer>
      </PageContainer>
    </main>
  );
};
