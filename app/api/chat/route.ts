import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_BODY_LENGTH = 50_000;
const REQUEST_TIMEOUT_MS = 45_000;

const SYSTEM_INSTRUCTIONS = `You are Mindlix AI, a professional business intelligence assistant for founders, growth leaders, and commercial teams.
Help users with business research, demand and lead-generation strategy, decision analysis, growth analytics, and clear next actions.
State assumptions, separate evidence from inference, and ask one focused question when essential context is missing.
Be concise, commercially practical, and calm. Never invent sources, market facts, prices, or statistics.
For legal, medical, or financial decisions, provide general information and recommend qualified professional advice.
Do not claim to have searched the web or accessed private business data.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Mindlix AI is not configured yet. Add OPENAI_API_KEY and try again." },
      { status: 503 },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (rawBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: "This conversation is too long. Close the chat and start a new session." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      { error: "Please send a valid message." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna",
        instructions: SYSTEM_INSTRUCTIONS,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        store: false,
        max_output_tokens: 900,
        reasoning: { effort: "none" },
        text: { verbosity: "medium" },
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      output?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    if (!response.ok) {
      console.error("OpenAI request failed", response.status, payload.error?.message);
      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "Mindlix AI is receiving many requests. Please try again shortly."
              : "Mindlix AI could not complete that response. Please try again.",
        },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const message = payload.output
      ?.filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .filter((content) => content.type === "output_text")
      .map((content) => content.text ?? "")
      .join("\n")
      .trim();

    if (!message) {
      return NextResponse.json(
        { error: "Mindlix AI returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("Mindlix AI request error", timedOut ? "timeout" : error);
    return NextResponse.json(
      {
        error: timedOut
          ? "Mindlix AI took too long to respond. Please try again."
          : "Mindlix AI is temporarily unavailable. Please try again.",
      },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !("messages" in body)) return null;
  const candidate = (body as { messages?: unknown }).messages;
  if (!Array.isArray(candidate) || candidate.length === 0) return null;

  const messages = candidate.slice(-MAX_MESSAGES).map((message) => {
    if (!message || typeof message !== "object") return null;
    const { role, content } = message as Record<string, unknown>;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > MAX_MESSAGE_LENGTH
    ) {
      return null;
    }
    return { role, content: content.trim() } satisfies ChatMessage;
  });

  if (messages.some((message) => message === null)) return null;
  const validMessages = messages as ChatMessage[];
  if (validMessages.at(-1)?.role !== "user") return null;
  return validMessages;
}
