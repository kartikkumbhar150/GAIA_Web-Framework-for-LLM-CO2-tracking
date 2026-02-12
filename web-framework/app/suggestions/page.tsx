"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Leaf, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Sparkles,
  LogOut,
  Zap,
  TrendingDown,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Info,
  Database,
  Cloud,
  Cpu,
  Box,
  CheckCircle,
  Activity
} from 'lucide-react';

// Types
interface User {
  name: string;
  email: string;
}

interface OptimizationRequest {
  workload: string;
  priority: string;
  region?: string;
  duration_hours: number;
}

interface Recommendation {
  region: string;
  zone: string;
  instance_type: string;
  carbon_intensity_gco2_kwh: number;
  renewable_percentage: number | null;
  estimated_co2_emissions_kg: number;
  estimated_co2_emissions_g: number;
  power_consumption_kwh: number;
  duration_hours: number;
  optimal_time_window: {
    start_time: string;
    end_time: string;
    avg_carbon_intensity: number;
    duration_hours: number;
  } | null;
  is_carbon_estimate: boolean;
}

interface ApiResponse {
  status: string;
  request_id: string;
  recommendation: {
    workload_type: string;
    priority: string;
    timestamp: string;
    recommendations: Recommendation[];
    carbon_savings: {
      potential_savings_kg: number;
      potential_savings_percentage: number;
      comparison: string;
    };
    service_optimizations: string[];
    metadata: {
      total_regions_analyzed: number;
      duration_hours: number;
      api_data_freshness: string;
    };
  };
}

const workloadOptions = [
  { value: 'training', label: 'ML Training', icon: Database, description: 'GPU-intensive model training' },
  { value: 'inference', label: 'ML Inference', icon: Cpu, description: 'Real-time predictions' },
  { value: 'general', label: 'General Compute', icon: Cloud, description: 'Web apps, APIs, services' },
  { value: 'database', label: 'Database', icon: Database, description: 'Data storage & queries' },
  { value: 'containers', label: 'Containers', icon: Box, description: 'Kubernetes, Docker workloads' },
  { value: 'serverless', label: 'Serverless', icon: Zap, description: 'Lambda functions' },
];

export default function Suggestions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  
  // Form state
  const [workload, setWorkload] = useState('training');
  const [priority, setPriority] = useState('carbon');
  const [region, setRegion] = useState('');
  const [durationHours, setDurationHours] = useState('24');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody: OptimizationRequest = {
        workload,
        priority,
        duration_hours: parseFloat(durationHours)
      };

      if (region) {
        requestBody.region = region;
      }

      const apiUrl = '/api/optimize';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to get recommendations');
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getPriorityBadge = (p: string) => {
    const badges = {
      carbon: { bg: 'bg-emerald-600', text: 'Carbon First', icon: '🌱' },
      performance: { bg: 'bg-blue-600', text: 'Performance', icon: '⚡' },
      balanced: { bg: 'bg-purple-600', text: 'Balanced', icon: '⚖️' },
    };
    return badges[p as keyof typeof badges] || badges.carbon;
  };

  const selectedWorkload = workloadOptions.find(w => w.value === workload);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Matching Dashboard */}
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
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", active: false },
            { href: "#", icon: FileText, label: "Reports", active: false },
            { href: "/aws-tracker", icon: Cloud, label: "AWS Analyzer", active: false },
            { href: "/suggestions", icon: Sparkles, label: "AI Suggestions", active: true },
            { href: "#", icon: Settings, label: "Settings", active: false },
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-7 max-w-[1340px] mx-auto space-y-7">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Carbon-Aware Optimization
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  AI-powered recommendations to minimize your cloud carbon footprint
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-1 space-y-5">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="size-4 text-emerald-600" />
                    Configure Workload
                  </h2>
                </div>
                
                <div className="p-6 space-y-5">
                  {/* Workload Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Workload Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {workloadOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setWorkload(option.value)}
                            className={`p-3.5 rounded-xl border-2 transition-all text-left ${
                              workload === option.value
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className={`size-5 mb-2 ${
                              workload === option.value ? 'text-emerald-600' : 'text-gray-400'
                            }`} />
                            <div className={`font-semibold text-xs ${
                              workload === option.value ? 'text-emerald-900' : 'text-gray-900'
                            }`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                              {option.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      Optimization Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['carbon', 'performance', 'balanced'].map((p) => {
                        const badge = getPriorityBadge(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                              priority === p
                                ? `${badge.bg} text-white shadow-sm`
                                : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-sm mb-0.5">{badge.icon}</div>
                            {badge.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Duration (hours)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        min="1"
                        max="8760"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                        placeholder="24"
                      />
                      <Clock className="absolute right-3 top-3 size-4 text-gray-400" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      {[1, 24, 168, 720].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDurationHours(hours.toString())}
                          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md border border-gray-100 transition-colors"
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Region (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Preferred Region <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none text-sm"
                      >
                        <option value="">🌍 Any region (recommended)</option>
                        <option value="us-east-1">🇺🇸 US East (N. Virginia)</option>
                        <option value="us-west-2">🇺🇸 US West (Oregon)</option>
                        <option value="ca-central-1">🇨🇦 Canada (Montreal)</option>
                        <option value="eu-west-1">🇮🇪 EU (Ireland)</option>
                        <option value="eu-west-3">🇫🇷 EU (Paris)</option>
                        <option value="eu-central-1">🇩🇪 EU (Frankfurt)</option>
                        <option value="eu-north-1">🇸🇪 EU (Stockholm)</option>
                        <option value="ap-south-1">🇮🇳 Asia Pacific (Mumbai)</option>
                        <option value="ap-southeast-1">🇸🇬 Asia Pacific (Singapore)</option>
                      </select>
                      <MapPin className="absolute right-3 top-3 size-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing Carbon Impact...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Get AI Recommendations
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                    <Info className="size-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-blue-900 mb-1.5 uppercase tracking-wide">How it works</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Our AI analyzes real-time carbon intensity data from Electricity Maps 
                      across all AWS regions to recommend the greenest infrastructure for your workload.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500 rounded-lg shrink-0">
                      <AlertCircle className="size-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-red-900 mb-1 uppercase tracking-wide">Error</h3>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {!result && !loading && !error && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                  <div className="inline-flex p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl mb-6">
                    <Sparkles className="size-14 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Ready to reduce your carbon footprint?
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Configure your workload parameters and get personalized AI recommendations
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl shadow-xl shadow-emerald-300/40 p-7 text-white">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3">
                          <CheckCircle2 className="size-3.5" />
                          Analysis Complete
                        </div>
                        <h3 className="text-2xl font-bold mb-1.5">Carbon Savings Potential</h3>
                        <p className="text-emerald-50 text-sm">
                          {result.recommendation.carbon_savings.comparison}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">
                          {result.recommendation.carbon_savings.potential_savings_kg.toFixed(2)}
                          <span className="text-lg ml-1">kg</span>
                        </div>
                        <div className="text-xs text-emerald-100 font-medium">CO₂ Saved</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">
                          {result.recommendation.carbon_savings.potential_savings_percentage.toFixed(1)}
                          <span className="text-lg ml-1">%</span>
                        </div>
                        <div className="text-xs text-emerald-100 font-medium">Reduction</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold mb-1">
                          {result.recommendation.recommendations.length}
                        </div>
                        <div className="text-xs text-emerald-100 font-medium">Options Found</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingDown className="size-4 text-emerald-600" />
                        Top Recommendations
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Optimized for {selectedWorkload?.label} • {getPriorityBadge(priority).text} priority
                      </p>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                      {result.recommendation.recommendations.slice(0, 5).map((rec, idx) => (
                        <div 
                          key={idx} 
                          className="p-5 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-transparent transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3.5 flex-1">
                              <div className={`flex items-center justify-center size-10 rounded-xl font-bold text-sm text-white shadow-md ${
                                idx === 0 
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200' 
                                  : idx === 1 
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-100' 
                                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
                              }`}>
                                #{idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <h4 className="text-lg font-bold text-gray-900">
                                    {rec.instance_type}
                                  </h4>
                                  {idx === 0 && (
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                      ⭐ BEST
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5" />
                                    <span className="font-medium">{rec.region}</span>
                                    <span className="text-gray-400">({rec.zone})</span>
                                  </div>
                                  {rec.renewable_percentage !== null && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-md">
                                      <Leaf className="size-3.5 text-emerald-600" />
                                      <span className="font-semibold text-emerald-700">
                                        {rec.renewable_percentage}% renewable
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-600">
                                {rec.estimated_co2_emissions_kg.toFixed(3)}
                                <span className="text-base ml-1">kg</span>
                              </div>
                              <div className="text-xs text-gray-500 font-medium">CO₂ emissions</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
                                <TrendingDown className="size-3.5" />
                                Carbon Intensity
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {rec.carbon_intensity_gco2_kwh}
                                <span className="text-xs font-normal text-gray-500 ml-1">gCO₂/kWh</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
                                <Zap className="size-3.5" />
                                Power Usage
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {rec.power_consumption_kwh.toFixed(1)}
                                <span className="text-xs font-normal text-gray-500 ml-1">kWh</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
                                <Clock className="size-3.5" />
                                Duration
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {rec.duration_hours}
                                <span className="text-xs font-normal text-gray-500 ml-1">hours</span>
                              </div>
                            </div>
                          </div>

                          {rec.optimal_time_window && (
                            <div className="mt-3.5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className="p-1.5 bg-blue-500 rounded-lg shrink-0">
                                  <Clock className="size-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-blue-900 mb-1.5">
                                    ⏰ Optimal Time Window
                                  </div>
                                  <div className="text-xs text-blue-800 font-medium">
                                    {formatDate(rec.optimal_time_window.start_time)} → {formatDate(rec.optimal_time_window.end_time)}
                                  </div>
                                  <div className="text-xs text-blue-700 mt-1.5 bg-blue-50 inline-block px-2 py-0.5 rounded">
                                    Avg. {rec.optimal_time_window.avg_carbon_intensity.toFixed(1)} gCO₂/kWh during this period
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Optimizations */}
                  {result.recommendation.service_optimizations.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-100">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Zap className="size-4 text-purple-600" />
                          Additional Optimization Tips
                        </h3>
                      </div>
                      
                      <div className="p-5">
                        <ul className="space-y-3">
                          {result.recommendation.service_optimizations.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 p-3.5 bg-gradient-to-r from-purple-50/60 to-transparent rounded-lg border border-purple-100">
                              <div className="p-1.5 bg-purple-500 rounded-lg mt-0.5 shrink-0">
                                <ArrowRight className="size-3.5 text-white" />
                              </div>
                              <span className="text-sm text-gray-700 flex-1 leading-relaxed">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}