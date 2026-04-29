import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CloneResponse {
  response_as_user: string;
  reasoning: string;
  confidence: "low" | "medium" | "high";
}

export async function askClone(
  personality: string,
  goals: string,
  memories: string[],
  chatHistory: { role: "user" | "model"; parts: { text: string }[] }[],
  question: string
): Promise<CloneResponse> {
  const systemInstruction = `You are a Personal AI Clone.
Your goal is to replicate the user's thinking style, tone, and decision-making patterns based on the provided Personality, Goals, and Memories.

Rules:
- Mimic the user's tone.
- Use past memory to answer like the user would.
- Provide decisions based on the user's personality and goals.
- Stay consistent with behavior patterns.
- If unsure, ask clarifying questions.

User Personality:
${personality || "Not provided"}

User Goals:
${goals || "Not provided"}

Memories/Past Decisions:
${memories.length > 0 ? memories.map((m, i) => `${i + 1}. ${m}`).join("\n") : "None"}

Analyze the question and formulate your response in strict accordance with the provided user profile.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: question }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response_as_user: {
              type: Type.STRING,
              description: "The response spoken natively in the persona of the user.",
            },
            reasoning: {
              type: Type.STRING,
              description: "Why the AI chose this response based on the user's personality, goals, and memories.",
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
              description: "Confidence level of simulating the user's likely response.",
            },
          },
          required: ["response_as_user", "reasoning", "confidence"],
        },
      },
    });

    const textPayload = response.text();
    if (!textPayload) throw new Error("No response from AI");
    
    const parsed = JSON.parse(textPayload) as CloneResponse;
    return parsed;
  } catch (err) {
    console.error("Error asking clone:", err);
    throw err;
  }
}
