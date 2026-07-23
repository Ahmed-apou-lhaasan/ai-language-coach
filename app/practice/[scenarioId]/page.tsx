"use client";

import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getScenario } from "@/lib/scenarios";

export default function PracticePage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const scenario = getScenario(scenarioId);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { scenarioId },
  });

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Scenario not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="px-4 py-3 bg-white border-b sticky top-0 z-10 flex items-center gap-3">
        <a href="/" className="text-gray-400 text-sm">← Back</a>
        <div>
          <h1 className="font-semibold text-lg">{scenario.title}</h1>
          <p className="text-sm text-gray-500">{scenario.cefrTarget}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Say hello to start the conversation!
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && <p className="text-sm text-gray-400">Typing...</p>}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your response..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
