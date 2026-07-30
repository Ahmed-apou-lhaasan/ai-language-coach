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
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <a href="/" className="text-gray-400 text-sm">← Back</a>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Vocabulary</h1>
        <p className="text-gray-500 mb-6">Words you're learning</p>

        <form onSubmit={addWord} className="bg-white border rounded-2xl p-4 mb-6 space-y-2">
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Word"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            placeholder="Translation (optional)"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium"
          >
            Add Word
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-400 text-sm">Loading...</p>
        ) : words.length === 0 ? (
          <p className="text-center text-gray-400 text-sm">No words saved yet.</p>
        ) : (
          <div className="space-y-2">
            {words.map((w) => (
              <div key={w.id} className="bg-white border rounded-2xl p-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{w.word}</p>
                  {w.translation && (
                    <p className="text-sm text-gray-500">{w.translation}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteWord(w.id)}
                  className="text-xs text-red-400"
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
