import { GoogleGenAI, Modality } from "@google/genai";

export async function POST() {
  try {
    const client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: [Modality.AUDIO],
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return Response.json({ token: token.name });
  } catch (err: any) {
    return Response.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
