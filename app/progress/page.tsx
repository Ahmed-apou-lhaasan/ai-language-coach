"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getScenario } from "@/lib/scenarios";

type Session = {
  id: string;
  scenario_id: string;
  language: string;
  transcript: any;
  created_at: string;
};

export default function ProgressPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    setSessions(data || []);
    setLoading(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-5 py-8">
      <div className="max-w-md mx-auto">
        <a href="/" className="text-gray-400 text-sm">← Back</a>
        <div className="flex items-center gap-3 mt-2 mb-1 animate-fade-up">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-md">
            📈
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Progress</h1>
        </div>
        <p className="text-gray-400 mb-6 text-sm">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} completed
        </p>

        {loading ? (
          <p className="text-center text-gray-400 text-sm">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 animate-fade-up">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-gray-400 text-sm">
              No sessions yet. Complete a practice call to see your progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const scenario = getScenario(s.scenario_id);
              const messageCount = Array.isArray(s.transcript) ? s.transcript.length : 0;
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-up"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {scenario?.title || s.scenario_id}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {s.language} · {messageCount} exchanges
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-300 whitespace-nowrap">
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
