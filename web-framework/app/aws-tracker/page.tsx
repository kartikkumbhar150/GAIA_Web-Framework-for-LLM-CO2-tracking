"use client";
import { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  X, 
  CloudUpload,
  Loader2,
  Download,
  Leaf,
  LayoutDashboard,
  Settings,
  Sparkles,
  LogOut,
  Cloud,
  Info,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email: string;
}

interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    recordsProcessed: number;
    recordsFailed: number;
    uploadId: string;
    errors?: string[];
  };
  error?: string;
}

export default function AWSTrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setUploadResult(null);
      } else {
        setUploadResult({
          success: false,
          error: 'Please upload a CSV file'
        });
      }
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setUploadResult({
        success: false,
        error: 'Please select a file first'
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/aws-tracker', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult({
          success: true,
          message: result.message,
          data: result.data
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setUploadResult({
          success: false,
          error: result.error || 'Upload failed'
        });
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        error: error.message || 'Network error occurred'
      });
    } finally {
      setUploading(false);
    }
  };

  // Clear file selection
  const clearFile = () => {
    setFile(null);
    setUploadResult(null);
  };

  // Download sample CSV
  const downloadSample = () => {
    const sampleCSV = `usage_account_id,total_mbm_emissions_value,total_mbm_emissions_unit,total_lbm_emissions_value,total_lbm_emissions_unit,product_code,location,usage_month,model_version
123456789012,2.5,mtCO2e,3.1,mtCO2e,AmazonEC2,US East (N. Virginia),2024-01,v1.0
123456789012,1.8,mtCO2e,2.2,mtCO2e,AmazonS3,US West (Oregon),2024-01,v1.0
123456789012,0.9,mtCO2e,1.1,mtCO2e,AmazonRDS,EU (Frankfurt),2024-01,v1.0`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aws_carbon_footprint_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
            { href: "/aws-tracker", icon: Cloud, label: "AWS Analyzer", active: true },
            { href: "/suggestions", icon: Sparkles, label: "AI Suggestions", active: false },
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
        <div className="p-7 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <CloudUpload className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  AWS Carbon Footprint Analyzer
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Upload your AWS Carbon Footprint Export to analyze and optimize your cloud sustainability
                </p>
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Info className="size-4 text-blue-600" />
                How to Get Your AWS Carbon Footprint Data
              </h2>
            </div>
            <div className="p-6">
              <ol className="space-y-3.5">
                {[
                  "Sign in to the AWS Management Console",
                  <>Navigate to the <strong>Customer Carbon Footprint Tool</strong> in AWS Billing</>,
                  <>Select your desired time range and click <strong>Export to CSV</strong></>,
                  "Upload the downloaded CSV file below"
                ].map((text, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 size-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700 pt-0.5">{text}</span>
                  </li>
                ))}
              </ol>
              
              <button
                onClick={downloadSample}
                className="mt-5 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
              >
                <Download className="size-4" />
                Download Sample CSV Template
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="size-4 text-emerald-600" />
                Upload CSV File
              </h3>
            </div>

            <div className="p-6">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                    dragActive ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`size-10 ${dragActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  
                  {file ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto shadow-sm">
                        <FileText className="size-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-900 font-medium truncate text-sm">{file.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                          }}
                          className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
                          disabled={uploading}
                        >
                          <X className="size-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-semibold mb-1.5">
                        {dragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                      </p>
                      <p className="text-gray-500 text-sm">or click to browse your files</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              {file && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="size-4" />
                        Analyze Carbon Footprint
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="mt-6">
                  {uploadResult.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500 rounded-lg shrink-0">
                          <CheckCircle className="size-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-green-900 mb-1 uppercase tracking-wide">
                            Upload Successful!
                          </h3>
                          <p className="text-sm text-green-800 mb-3">
                            {uploadResult.message}
                          </p>
                          {uploadResult.data && (
                            <div className="bg-white border border-green-200 rounded-lg p-4 space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Records Processed:</span>
                                <span className="font-bold text-green-700">
                                  {uploadResult.data.recordsProcessed}
                                </span>
                              </div>
                              {uploadResult.data.recordsFailed > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Records Failed:</span>
                                  <span className="font-bold text-orange-600">
                                    {uploadResult.data.recordsFailed}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
                            <Loader2 className="size-4 animate-spin" />
                            Redirecting to dashboard...
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500 rounded-lg shrink-0">
                          <AlertCircle className="size-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-red-900 mb-1 uppercase tracking-wide">
                            Upload Failed
                          </h3>
                          <p className="text-sm text-red-800">
                            {uploadResult.error}
                          </p>
                          {uploadResult.data?.errors && uploadResult.data.errors.length > 0 && (
                            <div className="mt-3 bg-white border border-red-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                Error Details:
                              </p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {uploadResult.data.errors.map((error, idx) => (
                                  <li key={idx} className="truncate">• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingDown, color: "emerald", title: "Track Emissions", desc: "Monitor your CO₂ footprint over time" },
              { icon: FileText, color: "blue", title: "Detailed Reports", desc: "Service and region breakdowns" },
              { icon: Zap, color: "purple", title: "AI Recommendations", desc: "Get optimization suggestions" }
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-5`}>
                <div className={`inline-flex p-2.5 bg-${color}-100 rounded-lg mb-3`}>
                  <Icon className={`size-5 text-${color}-600`} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}