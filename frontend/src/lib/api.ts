export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  checkInterval: number;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  latency: number | null;
  uptimePercentage: number;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PingLog {
  id: string;
  monitorId: string;
  statusCode: number | null;
  responseTimeMs: number;
  status: 'UP' | 'DOWN';
  errorMessage: string | null;
  checkedAt: string;
}

export interface MonitorDetail extends Monitor {
  recentLogs: PingLog[];
}

export interface SystemSummary {
  total: number;
  operational: number;
  degraded: number;
  down: number;
  avgLatency: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchSummary(): Promise<SystemSummary> {
  const res = await fetch(`${API_BASE}/monitors/summary`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchMonitors(): Promise<Monitor[]> {
  const res = await fetch(`${API_BASE}/monitors`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch monitors');
  return res.json();
}

export async function fetchMonitorDetail(id: string): Promise<MonitorDetail> {
  const res = await fetch(`${API_BASE}/monitors/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch monitor details');
  return res.json();
}

export async function createMonitor(data: {
  name: string;
  url: string;
  method?: string;
  checkInterval?: number;
}): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/monitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message
        ? Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message
        : 'Failed to create monitor',
    );
  }
  return res.json();
}

export async function deleteMonitor(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitors/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete monitor');
}

export async function triggerPing(id: string): Promise<PingLog> {
  const res = await fetch(`${API_BASE}/monitors/${id}/ping`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger probe');
  return res.json();
}

export async function checkBackendHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/health/liveness`, { cache: 'no-store' });
    if (!res.ok) return { status: 'down' };
    return res.json();
  } catch {
    return { status: 'down' };
  }
}
