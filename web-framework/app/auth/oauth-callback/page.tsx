"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email;
    const name = session?.user?.name;
    
    if (!email) {
      setError("No email found in session");
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/auth/oauth-jwt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }), // Include name
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create session");
        }


        // Wait for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 300));

        // Redirect to dashboard
        window.location.replace("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    })();
  }, [status, session, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push("/login")}
            className="text-blue-600 underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing you in…</p>
    </div>
  );
}