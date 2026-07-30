"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TOPICS = [
  { text: "A trip to a new city", emoji: "✈️" },
  { text: "A funny mistake at a restaurant", emoji: "🍝" },
  { text: "Making a new friend", emoji: "🤝" },
  { text: "A day at work", emoji: "💼" },
  { text: "Losing something important", emoji: "🔍" },
];

export default function StoriesPage() {
  const [language, setLanguage] = useState("english");
  const [level, setLevel] = useState("A2");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_language, cefr_level")
        .eq("id", user.id)
        .single();
      if (profile) {
        setLanguage(profile.target_language || "english");
        setLevel(profile.cefr_level || "A2");
      }
    }
    loadProfile();
  }, []);

  async function generateStory(chosenTopic: string) {
    setLoading(true);
    setError("");
    setStory("");

    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, level, topic: chosenTopic }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStory(data.story);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white px-5 py-8">
      <div className="max-w-md mx-auto">
        <a href="/" className="text-gray-400 text-sm">← Back</a>
        <div className="flex items-center gap-3 mt-2 mb-1 animate-fade-up">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-md">
            📖
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Stories</h1>
        </div>
        <p className="text-gray-400 mb-6 text-sm capitalize">
          Short stories in {language} · Level {level}
        </p>

        {!story && !loading && (
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Choose a topic
            </p>
            {TOPICS.map((t, i) => (
              <button
                key={t.text}
                onClick={() => generateStory(t.text)}
                className="card-hover flex items-center gap-3 w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{t.text}</span>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center mt-16 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 orb-connecting mb-4" />
            <p className="text-gray-400 text-sm">Writing your story...</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {story && !loading && (
          <div className="animate-fade-up">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
              {story}
            </div>
            <button
              onClick={() => {
                setStory("");
                setError("");
              }}
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl py-3.5 text-sm font-semibold shadow-lg shadow-purple-500/20"
            >
              Read Another Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
