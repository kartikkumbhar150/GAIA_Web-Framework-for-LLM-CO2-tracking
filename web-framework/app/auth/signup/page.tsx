import Link from "next/link";
import { Leaf, Shield } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Signup Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="size-8 text-emerald-600" />
            <span className="text-3xl font-semibold text-gray-900">GAIA</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Create your account
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Start tracking AI usage responsibly
          </p>

          {/* Signup Form */}
          <form className="space-y-5">
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullname"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Work Email
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
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Re-enter your password"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Link
              href="/dashboard"
              className="w-full block text-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Create Account
            </Link>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Privacy Message */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6 flex items-start gap-3">
          <Shield className="size-5 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-900 mb-1">
              Privacy First
            </p>
            <p className="text-sm text-emerald-700">
              Track AI usage responsibly. No prompts are stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
