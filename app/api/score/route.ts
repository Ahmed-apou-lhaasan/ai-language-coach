import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const scoreSchema = z.object({
  level: z.string().describe("Estimated CEFR level (A1-C2) or IELTS band (e.g. 'Band 6.5')"),
  overallScore: z.number().min(0).max(100).describe("Overall score out of 100"),
  strengths: z.array(z.string()).describe("2-3 things the learner did well"),
  improvements: z.array(z.string()).describe("2-3 specific things to improve, with brief examples"),
  summary: z.string().describe("A short, encouraging 2-sentence summary"),
});

export async function POST(req: Request) {
  const { transcript, language, scenarioTitle, cefrTarget } = await req.json();

  if (!transcript || transcript.length === 0) {
    return Response.json({ error: "No transcript to score" }, { status: 400 });
  }

  const conversationText = transcript
    .map((t: { role: string; content: string }) => `${t.role === "user" ? "Learner" : "AI"}: ${t.content}`)
    .join("\n");

  try {
    const result = await generateObject({
      model: google("gemini-flash-latest"),
      schema: scoreSchema,
      system: `You are a language assessment expert evaluating a learner's spoken performance in ${language} during a "${scenarioTitle}" roleplay (target level: ${cefrTarget}). Only assess the "Learner" lines, not the AI's. Be honest but encouraging.`,
      prompt: `Here is the conversation transcript:\n\n${conversationText}\n\nProvide an assessment.`,
    });

    return Response.json(result.object);
  } catch (err: any) {
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
