import Link from "next/link";
import { Leaf, TrendingDown, BarChart3, Zap } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="size-8 text-emerald-600" />
            <span className="text-2xl font-semibold text-gray-900">GAIA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login"
              className="px-5 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/auth/signup"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Sustainable AI.<br />
              Measured. Optimized.<br />
              Responsible.
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              GAIA helps track, optimize, and reduce the carbon footprint of Generative AI usage in real time.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <Link 
                href="/auth/signup"
                className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg text-lg font-medium"
              >
                Get Started
              </Link>
              <Link 
                href="/dashboard"
                className="px-8 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg border border-gray-200 text-lg font-medium"
              >
                View Dashboard Preview
              </Link>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
            <div className="space-y-4">
              {/* Preview Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Impact Overview</h3>
                <span className="text-sm text-gray-500">Last 30 days</span>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-emerald-700" />
                    <span className="text-xs font-medium text-emerald-900">Tokens Saved</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">2.4M</div>
                  <div className="text-xs text-emerald-700 mt-1">↑ 23% vs last month</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="size-4 text-green-700" />
                    <span className="text-xs font-medium text-green-900">CO₂ Reduced</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">1.8kg</div>
                  <div className="text-xs text-green-700 mt-1">↓ 18% emissions</div>
                </div>
              </div>

              {/* Platform Comparison */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Platform Usage</span>
                  <BarChart3 className="size-4 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">ChatGPT</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-emerald-500 rounded-full"></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">65%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Gemini</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[35%] bg-emerald-500 rounded-full"></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">35%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
