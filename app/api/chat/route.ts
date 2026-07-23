import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { getScenario } from "@/lib/scenarios";

export async function POST(req: Request) {
  const { messages, scenarioId } = await req.json();
  const scenario = getScenario(scenarioId);

  if (!scenario) {
    return new Response("Scenario not found", { status: 404 });
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: scenario.systemPrompt,
    messages,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
