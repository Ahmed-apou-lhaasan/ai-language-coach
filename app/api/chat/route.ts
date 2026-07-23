import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { getScenario } from "@/lib/scenarios";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, scenarioId } = await req.json();
  const scenario = getScenario(scenarioId);

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: scenario.systemPrompt,
      messages,
    });

    return Response.json({ reply: result.text });
  } catch (err: any) {
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
