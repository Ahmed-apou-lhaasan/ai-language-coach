"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Word = {
  id: string;
  word: string;
  translation: string | null;
  notes: string | null;
  language: string;
};

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [newTranslation, setNewTranslation] = useState("");

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("vocabulary")
      .select("*")
      .order("created_at", { ascending: false });
    setWords(data || []);
    setLoading(false);
  }

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language")
      .eq("id", user.id)
      .single();

    await supabase.from("vocabulary").insert({
      user_id: user.id,
      word: newWord,
      translation: newTranslation || null,
      language: profile?.target_language || "english",
    });

    setNewWord("");
    setNewTranslation("");
    loadWords();
  }

  async function deleteWord(id: string) {
    const supabase = createClient();
    await supabase.from("vocabulary").delete().eq("id", id);
    loadWords();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-5 py-8">
      <div className="max-w-md mx-auto">
        <a href="/" className="text-gray-400 text-sm">← Back</a>
        <div className="flex items-center gap-3 mt-2 mb-1 animate-fade-up">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-md">
            📚
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Vocabulary</h1>
        </div>
        <p className="text-gray-400 mb-6 text-sm">Words you're learning</p>

        <form
          onSubmit={addWord}
          className="bg-white rounded-3xl p-4 mb-6 space-y-2 shadow-sm border border-gray-100 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Word"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            placeholder="Translation (optional)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            + Add Word
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-400 text-sm">Loading...</p>
        ) : words.length === 0 ? (
          <div className="text-center py-10 animate-fade-up">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-400 text-sm">No words saved yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {words.map((w, i) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-gray-100 animate-fade-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div>
                  <p className="font-bold text-gray-900">{w.word}</p>
                  {w.translation && (
                    <p className="text-sm text-gray-400">{w.translation}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteWord(w.id)}
                  className="text-xs text-red-400 bg-red-50 rounded-full px-3 py-1.5"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
