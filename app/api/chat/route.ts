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
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Mindlix AI is not configured yet. Add OPENROUTER_API_KEY and try again.",
        errorCode: "configuration_missing",
        retryable: false,
      },
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
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "x-openrouter-title": "Mindlix AI",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTIONS },
            ...messages,
          ],
          max_tokens: 900,
        }),
        signal: controller.signal,
      },
    );

    const payload = (await response.json()) as {
      error?: {
        code?: number | string;
        message?: string;
        metadata?: { error_type?: string };
      };
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    if (!response.ok || payload.error) {
      const providerError = classifyOpenRouterError(
        response.status,
        payload.error,
      );
      console.error(
        "OpenRouter request failed",
        response.status,
        payload.error?.metadata?.error_type ??
          payload.error?.code ??
          "unknown",
        response.headers.get("x-request-id") ?? "no-request-id",
      );
      return NextResponse.json(
        {
          error: providerError.message,
          errorCode: providerError.code,
          retryable: providerError.retryable,
        },
        {
          status: providerError.status,
          headers: { "cache-control": "no-store" },
        },
      );
    }

    const content = payload.choices?.[0]?.message?.content;
    const message =
      typeof content === "string"
        ? content.trim()
        : content
            ?.filter((part) => part.type === "text")
            .map((part) => part.text ?? "")
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

function classifyOpenRouterError(
  status: number,
  error?: {
    code?: number | string;
    message?: string;
    metadata?: { error_type?: string };
  },
) {
  const code = error?.metadata?.error_type ?? error?.code ?? "";
  const message = error?.message?.toLowerCase() ?? "";
  const quotaExceeded =
    status === 402 ||
    code === "payment_required" ||
    message.includes("insufficient credits");

  if (quotaExceeded) {
    return {
      code: "quota_exceeded",
      message:
        "Mindlix AI’s OpenRouter credits are unavailable. Add credits or use a funded API key, then try again.",
      retryable: false,
      status: 503,
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      message:
        "Mindlix AI is receiving many requests. Please wait a moment and try again.",
      retryable: true,
      status: 429,
    };
  }

  if (status === 401 || status === 403) {
    return {
      code: "authentication_failed",
      message:
        "Mindlix AI’s API key is invalid or not permitted. Check OPENROUTER_API_KEY and try again.",
      retryable: false,
      status: 503,
    };
  }

  if (status === 404 || code === "model_not_found") {
    return {
      code: "model_unavailable",
      message:
        "The configured model is unavailable through OpenRouter. Check OPENROUTER_MODEL and try again.",
      retryable: false,
      status: 503,
    };
  }

  return {
    code: "provider_error",
    message: "Mindlix AI could not complete that response. Please try again.",
    retryable: status >= 500,
    status: 502,
  };
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
