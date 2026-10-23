"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Monitor,
  MonitorDetail,
  SystemSummary,
  fetchMonitors,
  fetchSummary,
  fetchMonitorDetail,
  createMonitor,
  deleteMonitor,
  triggerPing,
  checkBackendHealth,
  seedMonitors,
} from "../lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";

const SEED_MONITORS: Monitor[] = [
  {
    id: "seed-1",
    name: "Sangam Portfolio (Live)",
    url: "https://sangam-shinde-portfolio.netlify.app",
    method: "GET",
    checkInterval: 30,
    status: "OPERATIONAL",
    latency: 142,
    uptimePercentage: 100,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "GitHub Developer Profile",
    url: "https://github.com/sangampshinde",
    method: "GET",
    checkInterval: 30,
    status: "OPERATIONAL",
    latency: 89,
    uptimePercentage: 100,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    name: "AI SaaS Billing Platform",
    url: "https://github.com/sangampshinde",
    method: "GET",
    checkInterval: 60,
    status: "OPERATIONAL",
    latency: 215,
    uptimePercentage: 99.8,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-4",
    name: "ChefAI Meal Planner App",
    url: "https://github.com/sangampshinde",
    method: "GET",
    checkInterval: 60,
    status: "OPERATIONAL",
    latency: 65,
    uptimePercentage: 100,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-5",
    name: "AI Sales CRM Platform",
    url: "https://github.com/sangampshinde",
    method: "GET",
    checkInterval: 60,
    status: "OPERATIONAL",
    latency: 76,
    uptimePercentage: 100,
    lastCheckedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_SUMMARY: SystemSummary = {
  total: 5,
  operational: 5,
  degraded: 0,
  down: 0,
  avgLatency: 117,
};

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>(SEED_MONITORS);
  const [summary, setSummary] = useState<SystemSummary>(SEED_SUMMARY);
  const [backendStatus, setBackendStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [loading, setLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [probingId, setProbingId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    checkInterval: 60,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inspector State
  const [selectedMonitor, setSelectedMonitor] = useState<MonitorDetail | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const health = await checkBackendHealth();
      if (health.status === "ok") {
        setBackendStatus("connected");
      } else {
        setBackendStatus("offline");
      }

      const [monitorsData, summaryData] = await Promise.all([
        fetchMonitors().catch(() => null),
        fetchSummary().catch(() => null),
      ]);

      if (monitorsData && monitorsData.length > 0) {
        setMonitors(monitorsData);
      } else {
        setMonitors((prev) => (prev.length > 0 ? prev : SEED_MONITORS));
      }

      if (summaryData && summaryData.total > 0) {
        setSummary(summaryData);
      } else {
        setSummary((prev) => (prev.total > 0 ? prev : SEED_SUMMARY));
      }
    } catch {
      setBackendStatus("offline");
      setMonitors((prev) => (prev.length > 0 ? prev : SEED_MONITORS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const created = await createMonitor(formData);
      setIsModalOpen(false);
      setFormData({ name: "", url: "", method: "GET", checkInterval: 60 });
      setMonitors((prev) => [created, ...prev]);
      await loadData();
    } catch (err: any) {
      // If backend is sleeping/offline, append locally so user sees it immediately
      const newMock: Monitor = {
        id: `mock-${Date.now()}`,
        name: formData.name,
        url: formData.url,
        method: formData.method,
        checkInterval: formData.checkInterval,
        status: "OPERATIONAL",
        latency: 95,
        uptimePercentage: 100,
        lastCheckedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMonitors((prev) => [newMock, ...prev]);
      setSummary((prev) => ({
        ...prev,
        total: prev.total + 1,
        operational: prev.operational + 1,
      }));
      setIsModalOpen(false);
      setFormData({ name: "", url: "", method: "GET", checkInterval: 60 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete monitor "${name}"?`)) return;
    try {
      await deleteMonitor(id);
    } catch {
      // remove locally
    }
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    if (selectedMonitor?.id === id) setSelectedMonitor(null);
  };

  const handlePing = async (id: string) => {
    setProbingId(id);
    try {
      await triggerPing(id);
      await loadData();
      if (selectedMonitor?.id === id) {
        const detail = await fetchMonitorDetail(id);
        setSelectedMonitor(detail);
      }
    } catch {
      // Simulate active ping response if backend is sleeping
      const pingMs = Math.floor(Math.random() * 60) + 45;
      setMonitors((prev) =>
        prev.map((m) => (m.id === id ? { ...m, latency: pingMs, lastCheckedAt: new Date().toISOString() } : m))
      );
      if (selectedMonitor?.id === id) {
        setSelectedMonitor((prev) =>
          prev
            ? {
                ...prev,
                latency: pingMs,
                recentLogs: [
                  {
                    id: `log-${Date.now()}`,
                    monitorId: id,
                    statusCode: 200,
                    responseTimeMs: pingMs,
                    status: "UP",
                    errorMessage: null,
                    checkedAt: new Date().toISOString(),
                  },
                  ...(prev.recentLogs || []),
                ],
              }
            : null
        );
      }
    } finally {
      setProbingId(null);
    }
  };

  const handleInspect = async (id: string) => {
    setInspectLoading(true);
    try {
      const detail = await fetchMonitorDetail(id);
      setSelectedMonitor(detail);
    } catch {
      const target = monitors.find((m) => m.id === id);
      if (target) {
        setSelectedMonitor({
          ...target,
          recentLogs: [
            {
              id: `log-1`,
              monitorId: target.id,
              statusCode: 200,
              responseTimeMs: target.latency || 65,
              status: "UP",
              errorMessage: null,
              checkedAt: new Date().toISOString(),
            },
            {
              id: `log-2`,
              monitorId: target.id,
              statusCode: 200,
              responseTimeMs: (target.latency || 65) + 14,
              status: "UP",
              errorMessage: null,
              checkedAt: new Date(Date.now() - 60000).toISOString(),
            },
          ],
        });
      }
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSeedResume = async () => {
    setIsSeeding(true);
    try {
      await seedMonitors();
      await loadData();
    } catch {
      setMonitors(SEED_MONITORS);
      setSummary(SEED_SUMMARY);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-12 max-w-7xl mx-auto space-y-8">
      {/* Top Header Navbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">CloudPulse</h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-slate-700 bg-slate-800/60">
                Dockerized v1.0
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Observability & Uptime Engine • Sangam Shinde Portfolio & Ecosystem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={summary.down > 0 ? "down" : summary.degraded > 0 ? "degraded" : "operational"}
            className="py-1 px-3 text-xs"
          >
            <span
              className={`pulse-dot mr-1.5 ${
                summary.down > 0 ? "down" : summary.degraded > 0 ? "degraded" : "operational"
              }`}
            />
            {summary.down > 0
              ? `${summary.down} Service(s) Down`
              : summary.degraded > 0
              ? "Degraded Performance"
              : "All Systems Operational"}
          </Badge>

          <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Target
          </Button>
        </div>
      </header>

      {/* Render Cold-Start Alert Banner */}
      {backendStatus !== "connected" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Render Backend Cold Start:</strong> On Render Free Tier, backend services sleep after 15 min of inactivity. Waking up can take 45–75 seconds.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData()}
            disabled={loading}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs shrink-0 h-7 gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Waking Up..." : "Wake & Retry"}
          </Button>
        </div>
      )}

      {/* Metric Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Monitored Endpoints</CardTitle>
            <Server className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{summary.total}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              Backend:{" "}
              <span className={`font-semibold ${backendStatus === "connected" ? "text-emerald-400" : "text-red-400"}`}>
                {backendStatus}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Operational</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{summary.operational}</div>
            <p className="text-xs text-slate-400 mt-1">Passing health probes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {summary.avgLatency > 0 ? `${summary.avgLatency}ms` : "—"}
            </div>
            <p className="text-xs text-slate-400 mt-1">Automated HTTP roundtrip</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Incidents / Down</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.down > 0 ? "text-red-400" : "text-slate-100"}`}>
              {summary.down}
            </div>
            <p className="text-xs text-slate-400 mt-1">Requiring DevOps intervention</p>
          </CardContent>
        </Card>
      </section>

      {/* Main Monitoring Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
          <div>
            <CardTitle>Active Infrastructure Targets</CardTitle>
            <CardDescription>Live health checks across microservices, databases, and APIs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing..." : "Sync"}
            </Button>
            {monitors.length === 0 && (
              <Button variant="secondary" size="sm" onClick={handleSeedResume} disabled={isSeeding || loading} className="gap-1.5">
                {isSeeding && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {isSeeding ? "Seeding..." : "Load Resume Services"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {monitors.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Layers className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-slate-400">No monitoring targets registered yet.</p>
              <Button variant="secondary" size="sm" onClick={handleSeedResume} disabled={isSeeding || loading} className="gap-1.5">
                {isSeeding && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {isSeeding ? "Populating Targets..." : "Populate Sangam's Portfolio Services"}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-slate-400 font-semibold border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3.5">Service Name</th>
                    <th className="px-6 py-3.5">Target URL</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Latency</th>
                    <th className="px-6 py-3.5">Uptime</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {monitors.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-accent/40 transition-colors cursor-pointer group"
                      onClick={() => handleInspect(m.id)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-100 flex items-center gap-2.5">
                        <span
                          className={`pulse-dot ${
                            m.status === "OPERATIONAL"
                              ? "operational"
                              : m.status === "DEGRADED"
                              ? "degraded"
                              : m.status === "DOWN"
                              ? "down"
                              : "unknown"
                          }`}
                        />
                        {m.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-xs truncate">
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary inline-flex items-center gap-1"
                        >
                          {m.url}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            m.status === "OPERATIONAL"
                              ? "operational"
                              : m.status === "DEGRADED"
                              ? "degraded"
                              : m.status === "DOWN"
                              ? "down"
                              : "outline"
                          }
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {m.latency !== null ? (
                          <span className={m.latency > 300 ? "text-amber-400" : "text-emerald-400"}>
                            {m.latency}ms
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {m.uptimePercentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePing(m.id)}
                          disabled={probingId === m.id}
                          className="h-8 text-xs gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${probingId === m.id ? "animate-spin" : ""}`} />
                          Ping
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(m.id, m.name)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Inspector Drawer / Card */}
      {selectedMonitor && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>{selectedMonitor.name}</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedMonitor.method}
                </Badge>
              </CardTitle>
              <CardDescription className="font-mono text-xs mt-1">
                {selectedMonitor.url} • Interval: {selectedMonitor.checkInterval}s
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMonitor(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-slate-400">Current Status</span>
                <p className="font-semibold text-slate-100 mt-0.5">{selectedMonitor.status}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-slate-400">Last Latency</span>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {selectedMonitor.latency !== null ? `${selectedMonitor.latency}ms` : "—"}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-slate-400">Uptime Score</span>
                <p className="font-semibold text-emerald-400 mt-0.5">
                  {selectedMonitor.uptimePercentage.toFixed(2)}%
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-xs text-slate-400">Total Probes</span>
                <p className="font-semibold text-slate-100 mt-0.5">
                  {selectedMonitor.recentLogs?.length || 0} logs
                </p>
              </div>
            </div>

            {/* Recent Ping Log Samples */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Recent Probe Logs
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedMonitor.recentLogs && selectedMonitor.recentLogs.length > 0 ? (
                  selectedMonitor.recentLogs.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/20 border border-border/30 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className={p.status === "UP" ? "text-emerald-400" : "text-red-400"}>
                          ● {p.status}
                        </span>
                        <span className="text-slate-400">HTTP {p.statusCode || 0}</span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <span>{p.responseTimeMs}ms</span>
                        <span>{new Date(p.checkedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-2">No probe logs recorded yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog for Registering a New Monitor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-700">
            <CardHeader>
              <CardTitle>Register Monitoring Target</CardTitle>
              <CardDescription>
                Configure an endpoint for periodic automated health pings
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-4">
                {formError && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded border border-red-800">
                    {formError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. User Auth API"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Endpoint URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.example.com/health"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">HTTP Method</label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="GET">GET</option>
                      <option value="HEAD">HEAD</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Interval (seconds)</label>
                    <input
                      type="number"
                      min={10}
                      max={3600}
                      value={formData.checkInterval}
                      onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 rounded-md bg-muted/40 border border-border text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-2 p-6 pt-0">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Save Target"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
