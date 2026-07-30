import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { language, level, topic } = await req.json();

  try {
    const result = await generateText({
      model: google("gemini-flash-latest"),
      system: `You are a language learning content writer. Write a short story (150-250 words) in ${language} for a learner at CEFR level ${level}. Use simple, clear sentences appropriate for that level. The story should be engaging and about the topic given. After the story, add a line "---" followed by 5 useful vocabulary words from the story with their English translation, one per line, formatted as "word - translation".`,
      prompt: `Write a story about: ${topic}`,
    });

    return Response.json({ story: result.text });
  } catch (err: any) {
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
