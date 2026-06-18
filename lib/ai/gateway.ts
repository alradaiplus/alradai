/**
 * Provider-agnostic AI gateway.
 *
 * Requirement: the product is "OpenAI + Anthropic compatible". Features call
 * this gateway — never a vendor SDK directly — so providers can be swapped per
 * workspace/config without touching feature code.
 *
 * Supports three back ends behind one interface:
 *   - openai      → OpenAI-compatible /chat/completions (also OpenRouter, etc.)
 *   - anthropic   → Anthropic /v1/messages
 *   - openrouter  → OpenRouter (OpenAI-compatible; multi-key rotation in
 *                   lib/ai/openrouter.ts is used when selected)
 *
 * Streaming is normalized to a ReadableStream<Uint8Array> of plain-text deltas
 * regardless of provider, so the API routes and client are provider-blind.
 *
 * Server-only. Never import from a client component.
 */

import { streamChat as streamOpenRouter, hasOpenRouterKeys } from "./openrouter";

export type Provider = "openai" | "anthropic" | "openrouter";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Override the configured provider for this call. */
  provider?: Provider;
  /** Override the model id. */
  model?: string;
}

const OPENAI_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const ANTHROPIC_BASE =
  process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";

/** Resolve which provider to use, preferring an explicit override. */
export function resolveProvider(override?: Provider): Provider {
  if (override) return override;
  const configured = (process.env.AI_PROVIDER as Provider) || undefined;
  if (configured) return configured;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (hasOpenRouterKeys()) return "openrouter";
  return "openrouter";
}

export function hasAnyProvider(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      hasOpenRouterKeys()
  );
}

function defaultModel(provider: Provider): string {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4o-mini";
    case "openrouter":
    default:
      return process.env.OPENROUTER_MODEL_PRIMARY || "anthropic/claude-3.5-sonnet";
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Stream a chat completion as plain-text deltas, normalized across providers.
 */
export async function streamChat(
  opts: GenerateOptions
): Promise<ReadableStream<Uint8Array>> {
  const provider = resolveProvider(opts.provider);
  const model = opts.model || defaultModel(provider);

  if (provider === "openrouter") {
    // Delegate to the rotation-aware OpenRouter client.
    return streamOpenRouter({
      messages: opts.messages,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });
  }

  if (provider === "anthropic") {
    return streamAnthropic(model, opts);
  }

  return streamOpenAICompatible(model, opts);
}

/** Non-streaming completion (used for summaries, tagging, agents). */
export async function complete(opts: GenerateOptions): Promise<string> {
  const stream = await streamChat(opts);
  const reader = stream.getReader();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

// --- OpenAI-compatible (OpenAI, Azure-compatible, OpenRouter direct) --------
async function streamOpenAICompatible(
  model: string,
  opts: GenerateOptions
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`OpenAI error ${res.status}: ${await safeText(res)}`);
  }
  return transformSSE(res.body, (json) => json.choices?.[0]?.delta?.content);
}

// --- Anthropic /v1/messages -------------------------------------------------
async function streamAnthropic(
  model: string,
  opts: GenerateOptions
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");

  // Anthropic takes the system prompt as a top-level field.
  const system = opts.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const messages = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      system: system || undefined,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Anthropic error ${res.status}: ${await safeText(res)}`);
  }
  // Anthropic streams content_block_delta events with {delta:{text}}.
  return transformSSE(res.body, (json) =>
    json.type === "content_block_delta" ? json.delta?.text : undefined
  );
}

/**
 * Convert a provider SSE byte stream into a plain-text delta stream, using a
 * provider-specific extractor to pull the text out of each JSON frame.
 */
function transformSSE(
  input: ReadableStream<Uint8Array>,
  extract: (json: any) => string | undefined
): ReadableStream<Uint8Array> {
  let buffer = "";
  return new ReadableStream({
    async start(controller) {
      const reader = input.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const text = extract(JSON.parse(data));
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // ignore keep-alive / partial frames
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
