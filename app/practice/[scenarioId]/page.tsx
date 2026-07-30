"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { GoogleGenAI, Modality } from "@google/genai";
import { getScenario } from "@/lib/scenarios";
import { createClient } from "@/lib/supabase/client";

type Transcript = { role: "user" | "assistant"; content: string };

const VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"];

export default function PracticePage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const scenario = getScenario(scenarioId)!;

  const [callStatus, setCallStatus] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [voice, setVoice] = useState("Puck");
  const [language, setLanguage] = useState("english");
  const [showTranscript, setShowTranscript] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioCtxInRef = useRef<AudioContext | null>(null);
  const audioCtxOutRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playTimeRef = useRef(0);
  const currentUserLineRef = useRef("");
  const currentAiLineRef = useRef("");
  const speakingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    async function loadLanguage() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_language")
        .eq("id", user.id)
        .single();
      if (profile?.target_language) setLanguage(profile.target_language);
    }
    loadLanguage();
  }, []);

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Scenario not found.</p>
      </div>
    );
  }

  const effectiveLanguage = scenario.englishOnly ? "English" : language;

  function floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  function toBase64(bytes: Uint8Array) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function downsampleTo16k(buffer: Float32Array, inRate: number) {
    if (inRate === 16000) return buffer;
    const ratio = inRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.floor(i * ratio)];
    }
    return result;
  }

  function markSpeaking() {
    setIsSpeaking(true);
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
    speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 700);
  }

  async function playAudioChunk(base64Data: string) {
    markSpeaking();
    if (!audioCtxOutRef.current) {
      audioCtxOutRef.current = new AudioContext({ sampleRate: 24000 });
      playTimeRef.current = audioCtxOutRef.current.currentTime;
    }
    const ctx = audioCtxOutRef.current;
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startAt = Math.max(playTimeRef.current, ctx.currentTime);
    source.start(startAt);
    playTimeRef.current = startAt + audioBuffer.duration;
  }

  async function startCall() {
    setCallStatus("connecting");
    setTranscripts([]);
    try {
      const res = await fetch("/api/live-token", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setCallStatus("error: " + data.error);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: data.token, httpOptions: { apiVersion: "v1alpha" } });

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: scenario.buildPrompt(effectiveLanguage),
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => setCallStatus("connected"),
          onclose: () => setCallStatus("closed"),
          onerror: (e: any) => setCallStatus("error: " + (e.message || "connection error")),
          onmessage: (msg: any) => {
            const sc = msg.serverContent;
            if (!sc) return;

            if (sc.outputTranscription?.text) {
              currentAiLineRef.current += sc.outputTranscription.text;
              setTranscripts((prev) => {
                const next = [...prev];
                if (next.length && next[next.length - 1].role === "assistant" && sc.turnComplete !== true && currentAiLineRef.current.length > sc.outputTranscription.text.length) {
                  next[next.length - 1] = { role: "assistant", content: currentAiLineRef.current };
                } else {
                  next.push({ role: "assistant", content: currentAiLineRef.current });
                }
                return next;
              });
            }

            if (sc.inputTranscription?.text) {
              currentUserLineRef.current += sc.inputTranscription.text;
              setTranscripts((prev) => {
                const next = [...prev];
                if (next.length && next[next.length - 1].role === "user" && currentUserLineRef.current.length > sc.inputTranscription.text.length) {
                  next[next.length - 1] = { role: "user", content: currentUserLineRef.current };
                } else {
                  next.push({ role: "user", content: currentUserLineRef.current });
                }
                return next;
              });
            }

            if (sc.turnComplete) {
              currentAiLineRef.current = "";
              currentUserLineRef.current = "";
            }

            const parts = sc.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playAudioChunk(part.inlineData.data);
              }
            }

            if (sc.interrupted) {
              playTimeRef.current = audioCtxOutRef.current?.currentTime || 0;
              setIsSpeaking(false);
            }
          },
        },
      });

      sessionRef.current = session;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxInRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const downsampled = downsampleTo16k(input, audioCtx.sampleRate);
        const pcm16 = floatTo16BitPCM(downsampled);
        const base64Audio = toBase64(new Uint8Array(pcm16.buffer));
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64Audio, mimeType: "audio/pcm;rate=16000" },
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: any) {
      setCallStatus("error: " + (err.message || "unknown"));
    }
  }

  function endCall() {
    processorRef.current?.disconnect();
    audioCtxInRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sessionRef.current?.close();
    setCallStatus("idle");
    setIsSpeaking(false);
  }

  const isConnected = callStatus === "connected";
  const isConnecting = callStatus === "connecting";
  const orbState = isSpeaking ? "orb-speaking" : isConnecting ? "orb-connecting" : "orb-idle";

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-gray-950 text-white overflow-hidden">
      <header className="px-4 py-3 flex items-center gap-3 z-10">
        <a href="/" className="text-white/50 text-sm">← Back</a>
        <div>
          <h1 className="font-bold text-lg">{scenario.title}</h1>
          <p className="text-xs text-white/40">{scenario.cefrTarget} · {effectiveLanguage}</p>
        </div>
      </header>

      <div className="px-4 flex items-center gap-2 flex-wrap z-10">
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={isConnected || isConnecting}
          className="text-xs bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white"
        >
          {VOICES.map((v) => (
            <option key={v} value={v} className="text-black">{v}</option>
          ))}
        </select>
        <button
          onClick={() => setShowTranscript((s) => !s)}
          className="text-xs bg-white/10 border border-white/10 rounded-full px-3 py-1"
        >
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center">
          {isConnected && (
            <>
              <span className="absolute w-40 h-40 rounded-full border border-purple-400/40 ripple-ring" />
              <span className="absolute w-40 h-40 rounded-full border border-indigo-400/40 ripple-ring" style={{ animationDelay: "0.5s" }} />
            </>
          )}
          <div
            className={`w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center ${orbState}`}
          >
            {isSpeaking ? (
              <div className="flex items-end gap-1.5 h-8">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-white rounded-full wave-bar"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-5xl">
                {isConnecting ? "🔄" : isConnected ? "🎙️" : "👋"}
              </span>
            )}
          </div>
        </div>

        <p className="mt-8 text-white/60 text-sm">
          {isConnecting && "Connecting..."}
          {isConnected && isSpeaking && "Speaking..."}
          {isConnected && !isSpeaking && "Listening..."}
          {callStatus === "idle" && "Tap below to start"}
          {callStatus.startsWith("error") && (
            <span className="text-red-400">{callStatus}</span>
          )}
        </p>

        {showTranscript && (
          <div className="absolute bottom-28 left-4 right-4 max-h-40 overflow-y-auto bg-black/30 backdrop-blur rounded-2xl p-3 text-xs space-y-1.5">
            {transcripts.length === 0 && (
              <p className="text-white/30 text-center">No transcript yet</p>
            )}
            {transcripts.map((t, i) => (
              <p key={i} className={t.role === "user" ? "text-blue-300" : "text-purple-200"}>
                <span className="opacity-50">{t.role === "user" ? "You: " : "AI: "}</span>
                {t.content}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="pb-10 flex justify-center z-10">
        {isConnected ? (
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg shadow-red-500/30"
          >
            ⏹
          </button>
        ) : (
          <button
            onClick={startCall}
            disabled={isConnecting}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 disabled:opacity-50"
          >
            📞
          </button>
        )}
      </div>
    </div>
  );
}
