"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
          AI Language Coach
        </h1>
        <p className="text-gray-500 mb-6 text-center">
          Sign in to save your progress
        </p>

        {status === "sent" ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-medium">Check your email!</p>
            <p className="text-sm text-green-600 mt-1">
              We sent a sign-in link to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-blue-600 text-white rounded-2xl py-3 text-sm font-medium disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
