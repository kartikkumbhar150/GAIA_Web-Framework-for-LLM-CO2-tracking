"use client";

import Link from "next/link";
import { Leaf, Shield } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must agree to the terms");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="size-8 text-emerald-600" />
            <span className="text-3xl font-semibold text-gray-900">GAIA</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Create your account
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Start tracking AI usage responsibly
          </p>

          {/* OAuth Signup */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50"
            >
              <img src="/google.svg" className="w-5 h-5" />
              Continue with Google
            </button>

            <button
              onClick={() => signIn("github")}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50"
            >
              <img src="/github.svg" className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-emerald-500"
            />

            <input
              type="email"
              placeholder="Work Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-emerald-500"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-emerald-500"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-emerald-500"
            />

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className="text-sm text-gray-600">
                I agree to the Terms & Privacy Policy
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6 flex gap-3">
          <Shield className="size-5 text-emerald-700 mt-0.5" />
          <p className="text-sm text-emerald-700">
            Track AI usage responsibly. No prompts are stored.
          </p>
        </div>
      </div>
    </div>
  );
}
