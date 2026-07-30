"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LANGUAGES = [
  { id: "english", label: "English", emoji: "🇬🇧", color: "from-blue-500 to-indigo-600" },
  { id: "spanish", label: "Español", emoji: "🇪🇸", color: "from-orange-400 to-red-500" },
  { id: "german", label: "Deutsch", emoji: "🇩🇪", color: "from-gray-600 to-gray-800" },
  { id: "dutch", label: "Nederlands", emoji: "🇳🇱", color: "from-orange-400 to-pink-500" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("english");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      target_language: language,
      learning_reason: reason,
    });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-950 px-4 py-8 relative overflow-hidden">
      <div className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl top-0 -right-10 animate-float" />

      <div className="max-w-sm w-full relative z-10 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome! 👋
          </h1>
          <p className="text-white/40 mt-2 text-sm">
            Let's set up your learning journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-white/70 block mb-3">
              Which language do you want to learn?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`card-hover rounded-2xl p-4 text-left transition border ${
                    language === l.id
                      ? "border-white/30 bg-white/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${l.color} flex items-center justify-center text-lg mb-2`}
                  >
                    {l.emoji}
                  </div>
                  <p className="text-sm font-semibold text-white">{l.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-white/70 block mb-2">
              Why do you want to learn it? (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. for work, travel, exams..."
              rows={3}
              className="w-full bg-white/10 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl py-3.5 text-sm font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Start Learning →"}
          </button>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
