import Link from "next/link";
import { Leaf } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="size-8 text-emerald-600" />
            <span className="text-3xl font-semibold text-gray-900">GAIA</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Sign in to your account to continue
          </p>

          {/* Login Form */}
          <form className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                Forgot password?
              </a>
            </div>

            <Link
              href="/dashboard"
              className="w-full block text-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Login
            </Link>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to GAIA?{' '}
              <Link href="/auth/signup" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Message */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Enterprise-grade security. Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}
