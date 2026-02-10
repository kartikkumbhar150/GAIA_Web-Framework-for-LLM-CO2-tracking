"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
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
            Welcome back
          </h2>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() =>
                signIn("google", { callbackUrl: "/auth/oauth-callback" })
              }
              className="w-full border rounded-lg py-3"
            >
              Continue with Google
            </button>

            <button
              onClick={() =>
                signIn("github", { callbackUrl: "/auth/oauth-callback" })
              }
              className="w-full border rounded-lg py-3"
            >
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email/password */}
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            New to GAIA?{" "}
            <Link href="/signup" className="text-emerald-600">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
