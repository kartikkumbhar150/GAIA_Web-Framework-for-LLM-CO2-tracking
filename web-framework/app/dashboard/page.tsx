"use client";
// ─────────────────────────────────────────────────────────────
// GAIA Dashboard — Enhanced with AWS Carbon Analytics
// Color theme: white & emerald green
// ─────────────────────────────────────────────────────────────

import {
  Leaf, LayoutDashboard, FileText, Settings, TrendingUp, Zap,
  TrendingDown, Target, LogOut, Sparkles, Cloud, AlertTriangle,
  Lightbulb, ArrowRight, Server, Activity, Flame, ChevronRight,
  BarChart2, RefreshCw, CheckCircle, XCircle, Info, Cpu, Droplets,
  Globe, MapPin, Box, Layers, Loader2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart
} from "recharts";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface User { name: string; email: string }

interface Summary {
  total_prompts: number;
  total_tokens: number;
  total_co2_kg: number;
  total_co2_grams: number;
  total_energy_kwh: number;
  total_water_liters: number;
  tokens_saved: number;
  efficiency_score: number;
  cache_efficiency: number;
  avg_co2_per_prompt: number;
  avg_tokens_per_prompt: number;
  unique_models_used: number;
  pending_calculations: number;
}

interface TSSPoint {
  date: string;
  prompts: number;
  co2_grams: number;
  co2_kg: number;
  energy_kwh: number;
  tokens: number;
}

interface ModelRow {
  model: string; llm: string;
  usage_count: number;
  total_co2_grams: number;
  avg_co2_per_prompt: number;
  efficiency_score: number;
}

interface HourlyPoint { hour: number; prompts: number; avg_co2: number }

interface Recommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  impact: string;
  action: string;
  saving_pct: number;
}

interface AnalyticsData {
  summary: Summary;
  timeSeries: TSSPoint[];
  modelBreakdown: ModelRow[];
  hourlyPattern: HourlyPoint[];
  cloudBreakdown: { provider: string; region: string; usage_count: number; total_co2_grams: number }[];
}

// AWS Types
interface AWSMetrics {
  total_months: number;
  total_emissions: number;
  avg_monthly_emissions: number;
  peak_emissions: number;
  lowest_emissions: number;
}

interface AWSMonthlyTrend {
  metric_month: string;
  total_mbm_emissions: number;
  total_lbm_emissions: number;
  mom_change_percentage: number | null;
  total_records: number;
}

interface AWSService {
  product_code: string;
  total_emissions: number;
  record_count: number;
  avg_emissions: number;
}

interface AWSRegion {
  location: string;
  total_emissions: number;
  record_count: number;
  avg_emissions: number;
}

interface AWSRecommendation {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  potential_co2_reduction: number;
  action_items: string[];
  related_service: string | null;
  related_region: string | null;
  generated_at: string;
}

interface AWSAnalytics {
  metrics: AWSMetrics;
  trends: AWSMonthlyTrend[];
  topServices: AWSService[];
  topRegions: AWSRegion[];
  recommendations: AWSRecommendation[];
}

// ─── Constants ────────────────────────────────────────────────

const PALETTE = ["#10b981","#3b82f6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"];
const REFRESH_MS = 30_000;

// ─── Helpers ──────────────────────────────────────────────────

const fmt = (n: number, d = 0) => n.toLocaleString("en-IN", { maximumFractionDigits: d });
const fmtCO2 = (g: number) => g >= 1000 ? `${(g/1000).toFixed(2)}kg` : `${g.toFixed(2)}g`;
const fmtMT = (mt: any) => {
  const value = Number(mt);
  if (isNaN(value)) return "0.000 MT";
  return `${value.toFixed(3)} MT`;
};

const pct = (n: number) => `${n.toFixed(1)}%`;

// Derive recommendations from analytics data
function deriveRecommendations(data: AnalyticsData): Recommendation[] {
  const recs: Recommendation[] = [];
  const s = data.summary;

  if (s.cache_efficiency < 20) {
    recs.push({
      id: "rec-cache",
      priority: "high",
      category: "Prompt Caching",
      title: "Enable Prompt Caching",
      description: `Your cache hit rate is only ${pct(s.cache_efficiency)}. Caching repeated system prompts reduces CO₂ by up to 80%.`,
      impact: `~${fmtCO2(s.total_co2_grams * 0.3)} potential savings`,
      action: "Use the 'cache_control' parameter on static system prompts.",
      saving_pct: 30,
    });
  }

  const sorted = [...data.modelBreakdown].sort((a, b) => b.avg_co2_per_prompt - a.avg_co2_per_prompt);
  const heaviest = sorted[0];
  if (heaviest && heaviest.avg_co2_per_prompt > 0.5) {
    recs.push({
      id: "rec-model",
      priority: "high",
      category: "Model Selection",
      title: `Replace ${heaviest.model} with a lighter model`,
      description: `${heaviest.model} averages ${fmtCO2(heaviest.avg_co2_per_prompt)} per prompt. Switching to a smaller model for simple tasks can cut emissions significantly.`,
      impact: `Up to ${fmtCO2(heaviest.total_co2_grams * 0.5)} savings`,
      action: "Route classification/summarisation tasks to GPT-4o-mini or Haiku.",
      saving_pct: 50,
    });
  }

  const peakHour = data.hourlyPattern.reduce(
    (a, b) => (b.avg_co2 > a.avg_co2 ? b : a),
    data.hourlyPattern[0] ?? { hour: 0, avg_co2: 0, prompts: 0 }
  );
  if (peakHour.avg_co2 > s.avg_co2_per_prompt * 1.3) {
    recs.push({
      id: "rec-timing",
      priority: "medium",
      category: "Scheduling",
      title: `Shift batch jobs away from peak hour (${peakHour.hour}:00)`,
      description: `Grid carbon intensity is highest around ${peakHour.hour}:00. Running non-urgent batch workloads at night (22:00–06:00) reduces lifecycle emissions.`,
      impact: "10–20% lower effective CO₂ per token",
      action: "Use a job scheduler (cron / BullMQ) to defer batch inference.",
      saving_pct: 15,
    });
  }

  if (s.avg_tokens_per_prompt > 2000) {
    recs.push({
      id: "rec-tokens",
      priority: "medium",
      category: "Prompt Engineering",
      title: "Reduce average token count per prompt",
      description: `Your average prompt uses ${fmt(s.avg_tokens_per_prompt)} tokens. Trimming verbose system prompts and few-shot examples directly lowers energy per call.`,
      impact: `~${fmtCO2(s.total_co2_grams * 0.15)} potential savings`,
      action: "Audit system prompts > 500 tokens. Use dynamic context injection.",
      saving_pct: 15,
    });
  }

  const highCarbonRegions = data.cloudBreakdown.filter(c => c.total_co2_grams > 0);
  if (highCarbonRegions.length > 0) {
    recs.push({
      id: "rec-region",
      priority: "low",
      category: "Infrastructure",
      title: "Migrate to a lower-carbon cloud region",
      description: "Running inference in EU/US-West regions (solar/wind heavy) can halve grid carbon intensity compared to coal-heavy regions.",
      impact: "30–60% CO₂ reduction with zero code change",
      action: "Evaluate latency vs. carbon tradeoff; consider eu-west-1 or us-west-2.",
      saving_pct: 40,
    });
  }

  if (s.total_water_liters > 10) {
    recs.push({
      id: "rec-water",
      priority: "low",
      category: "Water Footprint",
      title: "Reduce data-centre water consumption",
      description: `Your workloads have consumed ~${s.total_water_liters.toFixed(1)}L of water for cooling. Providers with high Water Usage Effectiveness (WUE) like Google Cloud (0.7 WUE) outperform average.`,
      impact: "Choose providers with published low-WUE data centres",
      action: "Prefer Google Cloud us-central1 or Azure westus3 for sustainability.",
      saving_pct: 20,
    });
  }

  return recs.slice(0, 5);
}

// ─── Custom Tooltip ───────────────────────────────────────────

const GreenTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-emerald-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-1">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [awsData, setAwsData] = useState<AWSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [awsLoading, setAwsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [awsTimeRange, setAwsTimeRange] = useState("6");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [recOpen, setRecOpen] = useState<string | null>(null);
  const [showAWS, setShowAWS] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch(`/api/analytics?timeRange=${timeRange}&groupBy=day`),
      ]);
      if (uRes.ok) { const u = await uRes.json(); if (!u.error) setUser(u); }
      if (aRes.ok) {
        const a = await aRes.json();
        if (a.success && a.data) setData(a.data);
      }
    } catch (e) {
      console.error("fetch error", e);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [timeRange]);

  const fetchAWSData = useCallback(async () => {
    setAwsLoading(true);
    try {
      const res = await fetch(`/api/aws-tracker?type=overview&timeRange=${awsTimeRange}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setAwsData(result.data);
        }
      }
    } catch (e) {
      console.error("AWS fetch error", e);
    } finally {
      setAwsLoading(false);
    }
  }, [awsTimeRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchAWSData(); }, [fetchAWSData]);
  useEffect(() => {
    const t = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  };

  const s = data?.summary;
  const recs = data ? deriveRecommendations(data) : [];

  const priorityColor = (p: string) =>
    p === "high" ? "text-red-600 bg-red-50 border-red-200"
    : p === "medium" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-blue-600 bg-blue-50 border-blue-200";

  const priorityDot = (p: string) =>
    p === "high" ? "bg-red-500" : p === "medium" ? "bg-amber-500" : "bg-blue-500";

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 font-medium">Loading GAIA...</p>
      </div>
    </div>
  );

  // Has AWS data?
  const hasAWSData = awsData && awsData.metrics && awsData.metrics.total_emissions > 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="size-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Leaf className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">GAIA</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 ml-0.5">AI Carbon Intelligence</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", active: true },
            { href: "#", icon: FileText, label: "Reports" },
            { href: "/aws-tracker", icon: Cloud, label: "AWS Analyzer" },
            { href: "/suggestions", icon: Sparkles, label: "AI Suggestions" },
            { href: "#", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label, active }) => (
            <a key={label} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              <Icon className="size-4" />
              {label}
            </a>
          ))}
        </nav>

        {s && (
          <div className="mx-3 mb-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-xs">
              {s.pending_calculations > 0 ? (
                <>
                  <div className="size-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-amber-600 font-medium">{s.pending_calculations} rows queued</span>
                </>
              ) : (
                <>
                  <CheckCircle className="size-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">CO₂ worker active</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? "..."}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <LogOut className="size-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        <div className="p-7 max-w-[1340px] mx-auto space-y-7">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Track and optimise your AI sustainability impact
                {lastRefresh && (
                  <span className="ml-2 text-xs text-gray-400">
                    · refreshed {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                <RefreshCw className="size-4" />
              </button>
              {["7d","30d","90d"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timeRange === r
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {!s || s.total_prompts === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-16 text-center">
              <Activity className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No data yet</h3>
              <p className="text-sm text-gray-400 mt-1">
                Insert rows into <code className="bg-gray-100 px-1 rounded">llmprompts</code> — the background worker will calculate CO₂ automatically.
              </p>
            </div>
          ) : (
            <>
              {/* ── LLM Analytics Section ── */}
              <div className="space-y-7">
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Cpu className="size-4 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">LLM Usage Analytics</h2>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: Activity,     color: "blue",   label: "Total Prompts",       value: fmt(s.total_prompts),              badge: "All time" },
                    { icon: Zap,          color: "emerald", label: "Tokens Saved",         value: `${(s.tokens_saved/1000).toFixed(1)}K`, badge: `${pct(s.cache_efficiency)} cached` },
                    { icon: TrendingDown, color: "green",  label: "CO₂ Emitted",          value: `${s.total_co2_kg.toFixed(3)}kg`, badge: `${fmtCO2(s.avg_co2_per_prompt)}/prompt` },
                    { icon: Target,       color: "purple", label: "Efficiency Score",     value: `${s.efficiency_score}%`,          badge: `${s.unique_models_used} models` },
                  ].map(({ icon: Icon, color, label, value, badge }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`size-9 bg-${color}-50 rounded-xl flex items-center justify-center`}>
                          <Icon className={`size-4 text-${color}-600`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${color}-50 text-${color}-700`}>
                          {badge}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-900">CO₂ Emissions Trend</h3>
                      <p className="text-xs text-gray-400">Daily carbon footprint (grams)</p>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <AreaChart data={data!.timeSeries}>
                        <defs>
                          <linearGradient id="gCO2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<GreenTooltip />} />
                        <Area type="monotone" dataKey="co2_grams" name="CO₂ (g)"
                          stroke="#10b981" strokeWidth={2.5} fill="url(#gCO2)" dot={false}
                          activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Sustainability Radar</h3>
                    <p className="text-xs text-gray-400 mb-4">Multi-dimension score</p>
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart data={[
                        { dim: "Caching",   score: Math.min(100, s.cache_efficiency * 2) },
                        { dim: "Efficiency",score: s.efficiency_score },
                        { dim: "CO₂/Token", score: Math.max(0, 100 - s.avg_co2_per_prompt * 100) },
                        { dim: "Token Opt", score: Math.max(0, 100 - (s.avg_tokens_per_prompt / 40)) },
                        { dim: "Water",     score: Math.max(0, 100 - s.total_water_liters * 3) },
                      ]}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill:"#6b7280" }} />
                        <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Model table + Impact */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <BarChart2 className="size-4 text-emerald-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Model Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                            {["Model","Provider","Prompts","Avg CO₂/req","Total CO₂","Score"].map(h => (
                              <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {data!.modelBreakdown.slice(0, 8).map((m, i) => (
                            <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-900">{m.model}</td>
                              <td className="px-5 py-3 text-gray-500 capitalize">{m.llm}</td>
                              <td className="px-5 py-3 text-gray-700">{fmt(m.usage_count)}</td>
                              <td className="px-5 py-3 text-emerald-700 font-semibold">{fmtCO2(m.avg_co2_per_prompt)}</td>
                              <td className="px-5 py-3 text-gray-700">{fmtCO2(m.total_co2_grams)}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${
                                      m.efficiency_score >= 80 ? "bg-emerald-500"
                                      : m.efficiency_score >= 60 ? "bg-blue-500"
                                      : "bg-amber-500"}`}
                                      style={{ width: `${m.efficiency_score}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-600 w-7">{m.efficiency_score}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Real-World Impact</h3>
                    {[
                      { icon: Flame,    color:"orange", label:"Energy Used",    value:`${s.total_energy_kwh.toFixed(3)} kWh`,   sub:`≈ ${(s.total_energy_kwh*60).toFixed(0)} min of a 100W bulb` },
                      { icon: Droplets, color:"blue",   label:"Water Consumed", value:`${s.total_water_liters.toFixed(1)} L`,    sub:"Data-centre cooling" },
                      { icon: Cloud,    color:"emerald",label:"CO₂ Total",      value:`${s.total_co2_kg.toFixed(3)} kg`,         sub:`≈ ${(s.total_co2_kg/0.21).toFixed(1)} km car travel` },
                      { icon: Zap,      color:"purple", label:"Tokens Total",   value:`${(s.total_tokens/1e6).toFixed(2)} M`,    sub:"Across all providers" },
                    ].map(({ icon: Icon, color, label, value, sub }) => (
                      <div key={label} className={`flex items-center gap-3 p-3 rounded-xl bg-${color}-50`}>
                        <div className={`size-9 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0`}>
                          <Icon className={`size-4 text-${color}-600`} />
                        </div>
                        <div>
                          <div className={`text-base font-bold text-${color}-700`}>{value}</div>
                          <div className="text-xs text-gray-500">{label} · {sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Lightbulb className="size-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">AI Recommendations</h3>
                        <p className="text-xs text-gray-400">Personalised from your usage data</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      {recs.length} suggestion{recs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {recs.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      <CheckCircle className="size-8 text-emerald-400 mx-auto mb-2" />
                      Your usage looks great — no critical optimisations found.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {recs.map(rec => (
                        <div key={rec.id} className="group">
                          <button
                            onClick={() => setRecOpen(recOpen === rec.id ? null : rec.id)}
                            className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-all"
                          >
                            <div className={`size-2 rounded-full shrink-0 ${priorityDot(rec.priority)}`} />
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border uppercase shrink-0 ${priorityColor(rec.priority)}`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs font-medium text-gray-400 shrink-0 w-36 truncate">{rec.category}</span>
                            <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{rec.title}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                              save ~{rec.saving_pct}%
                            </span>
                            <span className="text-xs text-gray-400 shrink-0 hidden xl:block">{rec.impact}</span>
                            <ChevronRight className={`size-4 text-gray-300 shrink-0 transition-transform ${recOpen === rec.id ? "rotate-90" : ""}`} />
                          </button>

                          {recOpen === rec.id && (
                            <div className="px-6 pb-5 pt-1 bg-gray-50/50">
                              <div className="flex gap-8">
                                <div className="flex-1">
                                  <div className="flex items-start gap-2 mb-3">
                                    <Info className="size-4 text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-600">{rec.description}</p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <ArrowRight className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <p className="text-sm font-medium text-gray-700">{rec.action}</p>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-xs text-gray-400 mb-1">Potential Saving</div>
                                  <div className="text-2xl font-bold text-emerald-600">{rec.saving_pct}%</div>
                                  <div className="text-xs text-gray-500">{rec.impact}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── AWS Cloud Carbon Analytics Section ── */}
              {hasAWSData && (
                <div className="space-y-7 mt-12 pt-12 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Cloud className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">AWS Cloud Carbon Footprint</h2>
                        <p className="text-xs text-gray-500">Infrastructure emissions from Customer Carbon Footprint Tool</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={fetchAWSData}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <RefreshCw className="size-4" />
                      </button>
                      {["3","6","12"].map(m => (
                        <button key={m} onClick={() => setAwsTimeRange(m)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            awsTimeRange === m
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                          }`}>
                          {m}mo
                        </button>
                      ))}
                    </div>
                  </div>

                  {awsLoading ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                      <Loader2 className="size-8 text-blue-500 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Loading AWS data...</p>
                    </div>
                  ) : (
                    <>
                      {/* AWS KPIs */}
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { icon: Cloud, color: "blue", label: "Total Emissions", value: fmtMT(awsData!.metrics.total_emissions), badge: "MBM" },
                          { icon: TrendingUp, color: "purple", label: "Peak Month", value: fmtMT(awsData!.metrics.peak_emissions), badge: "Highest" },
                          { icon: TrendingDown, color: "emerald", label: "Avg Monthly", value: fmtMT(awsData!.metrics.avg_monthly_emissions), badge: "Average" },
                          { icon: BarChart2, color: "orange", label: "Data Points", value: fmt(awsData!.metrics.total_months), badge: `${awsData!.metrics.total_months} months` },
                        ].map(({ icon: Icon, color, label, value, badge }) => (
                          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`size-9 bg-${color}-50 rounded-xl flex items-center justify-center`}>
                                <Icon className={`size-4 text-${color}-600`} />
                              </div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${color}-50 text-${color}-700`}>
                                {badge}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* AWS Charts */}
                      <div className="grid grid-cols-3 gap-4">
                        {/* Monthly trend */}
                        <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <div className="mb-5">
                            <h3 className="text-sm font-semibold text-gray-900">Monthly Emissions Trend</h3>
                            <p className="text-xs text-gray-400">Market-based (MBM) emissions in MT CO₂e</p>
                          </div>
                          <ResponsiveContainer width="100%" height={240}>
                            <ComposedChart data={awsData!.trends.slice().reverse()}>
                              <defs>
                                <linearGradient id="awsGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="metric_month" 
                                tick={{ fontSize: 11, fill:"#9ca3af" }} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                              />
                              <YAxis tick={{ fontSize: 11, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                              <Tooltip content={<GreenTooltip />} />
                              <Area type="monotone" dataKey="total_mbm_emissions" name="MBM Emissions (MT)" 
                                stroke="#3b82f6" strokeWidth={2.5} fill="url(#awsGrad)" />
                              <Line type="monotone" dataKey="total_lbm_emissions" name="LBM Emissions (MT)" 
                                stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Top services pie */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Services</h3>
                          <p className="text-xs text-gray-400 mb-4">By emissions</p>
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie 
                                data={awsData!.topServices.slice(0, 6)} 
                                cx="50%" 
                                cy="50%"
                                innerRadius={50} 
                                outerRadius={90}
                                dataKey="total_emissions"
                                nameKey="product_code"
                                paddingAngle={3}
                                label={({ product_code, percent }: any) => percent > 0.08 ? `${(percent*100).toFixed(0)}%` : ""}
                                labelLine={false}
                              >
                                {awsData!.topServices.slice(0, 6).map((_, i) => (
                                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => fmtMT(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Services & Regions */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Top Services */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <Box className="size-4 text-blue-600" />
                              Top Services by Emissions
                            </h3>
                          </div>
                          <div className="p-6 space-y-3">
                            {awsData!.topServices.slice(0, 6).map((svc, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <span className="size-6 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm">{svc.product_code}</div>
                                    <div className="text-xs text-gray-500">{svc.record_count} records</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-blue-600">{fmtMT(svc.total_emissions)}</div>
                                  <div className="text-xs text-gray-500">avg {fmtMT(svc.avg_emissions)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Regions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <Globe className="size-4 text-emerald-600" />
                              Top Regions by Emissions
                            </h3>
                          </div>
                          <div className="p-6 space-y-3">
                            {awsData!.topRegions.slice(0, 6).map((reg, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <span className="size-6 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-gray-900 text-sm">{reg.location}</div>
                                    <div className="text-xs text-gray-500">{reg.record_count} records</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-emerald-600">{fmtMT(reg.total_emissions)}</div>
                                  <div className="text-xs text-gray-500">avg {fmtMT(reg.avg_emissions)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* AWS Recommendations */}
                      {awsData!.recommendations.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-9 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Lightbulb className="size-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">AWS Optimization Recommendations</h3>
                                <p className="text-xs text-gray-400">Generated from your infrastructure data</p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {awsData!.recommendations.length} suggestion{awsData!.recommendations.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          
                          <div className="divide-y divide-gray-50">
                            {awsData!.recommendations.slice(0, 5).map((rec) => (
                              <div key={rec.id} className="p-6 hover:bg-blue-50/30 transition-colors">
                                <div className="flex items-start gap-4">
                                  <div className={`size-2 rounded-full shrink-0 mt-2 ${priorityDot(rec.priority)}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border uppercase ${priorityColor(rec.priority)}`}>
                                        {rec.priority}
                                      </span>
                                      <span className="text-xs font-medium text-gray-500">{rec.category.replace(/_/g, ' ')}</span>
                                      {rec.related_service && (
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                          {rec.related_service}
                                        </span>
                                      )}
                                      {rec.related_region && (
                                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                          {rec.related_region}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                                    
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <ArrowRight className="size-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-gray-700 uppercase">Action Items:</span>
                                      </div>
                                      <ul className="space-y-1 ml-6">
                                        {rec.action_items.map((item, idx) => (
                                          <li key={idx} className="text-sm text-gray-700 list-disc">{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="text-emerald-600 font-semibold">
                                        💰 Potential savings: {fmtMT(rec.potential_co2_reduction)}
                                      </span>
                                      <span className="text-gray-400">
                                        Generated {new Date(rec.generated_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* No AWS data message */}
              {!hasAWSData && !awsLoading && (
                <div className="mt-12 pt-12 border-t-2 border-gray-200">
                  <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-12 text-center">
                    <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                      <Cloud className="size-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No AWS Data Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your AWS Customer Carbon Footprint export to see infrastructure analytics
                    </p>
                    <a 
                      href="/aws-tracker"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Cloud className="size-4" />
                      Upload AWS Data
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}