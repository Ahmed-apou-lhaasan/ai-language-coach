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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-950 px-4 relative overflow-hidden">
      <div className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl top-10 -left-10 animate-float" />
      <div className="absolute w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl bottom-10 -right-10 animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-sm w-full relative z-10 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-purple-500/30 orb-idle">
            🌐
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Language Coach
          </h1>
          <p className="text-white/40 mt-2 text-sm">
            Sign in to save your progress
          </p>
        </div>

        {status === "sent" ? (
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-3xl p-6 text-center animate-fade-up">
            <div className="text-3xl mb-2">📩</div>
            <p className="text-white font-semibold">Check your email!</p>
            <p className="text-sm text-white/50 mt-1">
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
              className="w-full bg-white/10 backdrop-blur border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl py-3.5 text-sm font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-400 text-center">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
