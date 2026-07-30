"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TOPICS = [
  "A trip to a new city",
  "A funny mistake at a restaurant",
  "Making a new friend",
  "A day at work",
  "Losing something important",
];

export default function StoriesPage() {
  const [language, setLanguage] = useState("english");
  const [level, setLevel] = useState("A2");
  const [topic, setTopic] = useState("");
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
    setTopic(chosenTopic);

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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <a href="/" className="text-gray-400 text-sm">← Back</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-1">Stories</h1>
        <p className="text-gray-500 mb-6">
          Short stories in {language} · Level {level}
        </p>

        {!story && !loading && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Choose a topic:</p>
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => generateStory(t)}
                className="block w-full text-left bg-white border rounded-2xl p-4 hover:border-blue-400 transition"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Writing your story...
          </p>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {story && !loading && (
          <div>
            <div className="bg-white border rounded-2xl p-5 whitespace-pre-wrap text-gray-800 leading-relaxed">
              {story}
            </div>
            <button
              onClick={() => {
                setStory("");
                setError("");
              }}
              className="w-full mt-4 bg-blue-600 text-white rounded-2xl py-3 text-sm font-medium"
            >
              Read Another Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
