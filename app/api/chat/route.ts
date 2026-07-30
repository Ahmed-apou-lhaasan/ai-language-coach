import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getScenario } from "@/lib/scenarios";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, scenarioId, language } = await req.json();
  const scenario = getScenario(scenarioId);

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  const targetLanguage = scenario.englishOnly ? "English" : (language || "English");

  try {
    const result = await generateText({
      model: google("gemini-flash-latest"),
      system: scenario.buildPrompt(targetLanguage),
      messages,
    });

    return Response.json({ reply: result.text });
  } catch (err: any) {
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
