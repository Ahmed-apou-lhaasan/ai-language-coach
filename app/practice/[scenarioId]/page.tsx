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
        const pcm16 = floa
