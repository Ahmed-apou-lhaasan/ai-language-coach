"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { GoogleGenAI, Modality } from "@google/genai";
import { getScenario } from "@/lib/scenarios";

type Transcript = { role: "user" | "assistant"; content: string };

const VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"];

export default function PracticePage() {
  const params = useParams();
  const scenarioId = params.scenarioId as string;
  const scenario = getScenario(scenarioId)!;

  const [callStatus, setCallStatus] = useState("idle");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [voice, setVoice] = useState("Puck");

  const sessionRef = useRef<any>(null);
  const audioCtxInRef = useRef<AudioContext | null>(null);
  const audioCtxOutRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playTimeRef = useRef(0);
  const currentUserLineRef = useRef("");
  const currentAiLineRef = useRef("");

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Scenario not found.</p>
      </div>
    );
  }

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

  async function playAudioChunk(base64Data: string) {
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
          systemInstruction: scenario.systemPrompt,
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

      <div className="px-4 py-3 bg-white border-b flex items-center gap-2 flex-wrap">
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={callStatus === "connected" || callStatus === "connecting"}
          className="text-xs border rounded-full px-2 py-1"
        >
          {VOICES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {callStatus === "connected" ? (
          <button onClick={endCall} className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-full">
            End Call
          </button>
        ) : (
          <button onClick={startCall} className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-full">
            Start Call
          </button>
        )}
        <span className="text-xs text-gray-500">{callStatus}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {transcripts.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Tap "Start Call" and speak to begin.
          </p>
        )}
        {transcripts.map((t, i) => (
          <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                t.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border rounded-bl-sm"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
