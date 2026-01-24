"use client";
import { Leaf, LayoutDashboard, FileText, Settings, TrendingUp, Zap, TrendingDown, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data for charts
const emissionsData = [
  { date: 'Jan 15', emissions: 4.2 },
  { date: 'Jan 22', emissions: 3.8 },
  { date: 'Jan 29', emissions: 3.5 },
  { date: 'Feb 5', emissions: 3.1 },
  { date: 'Feb 12', emissions: 2.9 },
  { date: 'Feb 19', emissions: 2.6 },
  { date: 'Feb 26', emissions: 2.4 },
];

const tokenData = [
  { month: 'Oct', before: 5200, after: 3400 },
  { month: 'Nov', before: 6100, after: 4200 },
  { month: 'Dec', before: 5800, after: 3900 },
  { month: 'Jan', before: 6500, after: 4100 },
];

const tableData = [
  { platform: 'ChatGPT', model: 'GPT-4', tokensSaved: '1.2M', optimization: 'Non-LLM', efficiency: '34%' },
  { platform: 'ChatGPT', model: 'GPT-3.5', tokensSaved: '850K', optimization: 'LLM', efficiency: '28%' },
  { platform: 'Gemini', model: 'Gemini Pro', tokensSaved: '420K', optimization: 'Non-LLM', efficiency: '22%' },
  { platform: 'Gemini', model: 'Gemini Flash', tokensSaved: '180K', optimization: 'LLM', efficiency: '18%' },
];

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Leaf className="size-8 text-emerald-600" />
            <span className="text-2xl font-semibold text-gray-900">GAIA</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg transition-all hover:bg-emerald-100"
          >
            <LayoutDashboard className="size-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg transition-all hover:bg-gray-50 hover:text-gray-900"
          >
            <FileText className="size-5" />
            <span className="font-medium">Reports</span>
          </a>
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg transition-all hover:bg-gray-50 hover:text-gray-900"
          >
            <Settings className="size-5" />
            <span className="font-medium">Settings</span>
          </a>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Track and optimize your AI sustainability impact</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="size-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">+12%</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">12,847</div>
              <div className="text-sm text-gray-600">Total Prompts</div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Zap className="size-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+23%</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">2.4M</div>
              <div className="text-sm text-gray-600">Tokens Saved</div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="size-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">-18%</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">1,842g</div>
              <div className="text-sm text-gray-600">CO₂ Reduced</div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Target className="size-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">+8%</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">87%</div>
              <div className="text-sm text-gray-600">Optimization Efficiency</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Line Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">CO₂ Emissions Over Time</h3>
                <p className="text-sm text-gray-600">Daily carbon footprint (kg)</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={emissionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Tokens Before vs After</h3>
                <p className="text-sm text-gray-600">Optimization impact by month</p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="before" fill="#94a3b8" name="Before" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="after" fill="#10b981" name="After" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
              <p className="text-sm text-gray-600 mt-1">Detailed breakdown by platform and model</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tokens Saved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Optimization Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {row.platform}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.model}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.tokensSaved}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          row.optimization === 'Non-LLM' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {row.optimization}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.efficiency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
