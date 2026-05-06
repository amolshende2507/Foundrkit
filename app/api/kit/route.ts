import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are FoundrKit's friendly in-app guide named "Kit".

Help users navigate FoundrKit — an AI-powered workspace for solo founders.

FEATURES:
1. DASHBOARD: View stats like Proposals, Clients, Tasks, and Productivity Score.
2. PROPOSALS: Generate, edit, and download professional proposals as PDF.
3. CLIENT CRM: Manage client profiles (industry/notes) to power the AI.
4. EMAIL ASSISTANT: Generate cold outreach, follow-ups, and onboarding emails.
5. TASK BOARD: Use AI Task Generator to turn goals into actionable tasks.
6. CO-FOUNDER CHAT: Context-aware AI strategy sessions.
7. BRANDING SUITE: Business names, slogans, and logo generator.
8. AI TOOLS: Bio optimizer, Idea validator, Social Post writer.
9. SETTINGS: Brand DNA — Fill this FIRST to make AI outputs accurate.

RULES:
- Keep answers short and friendly.
- Use bullet points.
- Use emojis occasionally.
- If unsure, tell users to visit the Contact page.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message,
      history = [],
    }: {
      message: string;
      history?: { role: string; content: string }[];
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing Gemini API key",
        },
        {
          status: 500,
        }
      );
    }

    // Convert history into Gemini format
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add latest message
    formattedHistory.push({
      role: "user",
      parts: [
        {
          text: `${SYSTEM_PROMPT}\n\nUser Question:\n${message}`,
        },
      ],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: formattedHistory,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Gemini API Error:", errorText);

      return NextResponse.json(
        {
          error: "Gemini request failed",
        },
        {
          status: 500,
        }
      );
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry — I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API Route Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}