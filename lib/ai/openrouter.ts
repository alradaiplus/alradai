/**
 * OpenRouter gateway with multi-key rotation and model fallback.
 *
 * - Rotates across up to three keys (OPENROUTER_API_KEY_1/2/3) on 429/402/5xx.
 * - Per-key in-memory cooldown so a rate-limited key is skipped temporarily.
 * - Uses OpenRouter's server-side `models: [...]` fallback for capacity errors.
 * - Streams Server-Sent Events back to the caller as a ReadableStream<string>.
 *
 * Server-only module. Never import from client components.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const COOLDOWN_MS = 60_000;

interface KeyState {
  key: string;
  cooldownUntil: number;
}

let KEYS: KeyState[] | null = null;

function loadKeys(): KeyState[] {
  if (KEYS) return KEYS;
  KEYS = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ]
    .filter((k): k is string => Boolean(k && k.trim()))
    .map((key) => ({ key, cooldownUntil: 0 }));
  return KEYS;
}

export function hasOpenRouterKeys(): boolean {
  return loadKeys().length > 0;
}

function availableKeys(): KeyState[] {
  const now = Date.now();
  const keys = loadKeys();
  const ready = keys.filter((k) => k.cooldownUntil <= now);
  // If all are cooling down, ignore cooldown and try anyway (best effort).
  return ready.length ? ready : keys;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

function models(): string[] {
  const primary =
    process.env.OPENROUTER_MODEL_PRIMARY || "anthropic/claude-3.5-sonnet";
  const fallback =
    process.env.OPENROUTER_MODEL_FALLBACK || "anthropic/claude-3.5-haiku";
  return primary === fallback ? [primary] : [primary, fallback];
}

function headers(key: string): HeadersInit {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": site,
    "X-Title": "Notes Canvas",
  };
}

/**
 * Stream a chat completion. Yields plain text deltas.
 * Throws if no key succeeds.
 */
export async function streamChat(
  opts: ChatOptions
): Promise<ReadableStream<Uint8Array>> {
  const body = JSON.stringify({
    models: models(),
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1024,
    stream: true,
  });

  let lastError = "no OpenRouter keys configured";

  for (const ks of availableKeys()) {
    let res: Response;
    try {
      res = await fetch(ENDPOINT, { method: "POST", headers: headers(ks.key), body });
    } catch (e) {
      lastError = `network error: ${String(e)}`;
      continue;
    }

    if (res.ok && res.body) {
      return transformSSE(res.body);
    }

    // Rate limited / quota / server error → cool down this key and rotate.
    if ([429, 402, 500, 502, 503].includes(res.status)) {
      ks.cooldownUntil = Date.now() + COOLDOWN_MS;
      lastError = `key failed with ${res.status}`;
      continue;
    }

    lastError = `OpenRouter error ${res.status}: ${await res.text().catch(() => "")}`;
    break;
  }

  throw new Error(lastError);
}

/** Convert OpenRouter SSE stream into a plain-text token stream. */
function transformSSE(input: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
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
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
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

/** Non-streaming completion (used for tagging / summarization). */
export async function completeChat(opts: ChatOptions): Promise<string> {
  const body = JSON.stringify({
    models: models(),
    messages: opts.messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 512,
  });
  let lastError = "no OpenRouter keys configured";
  for (const ks of availableKeys()) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: headers(ks.key),
        body,
      });
      if (res.ok) {
        const json = await res.json();
        return json.choices?.[0]?.message?.content ?? "";
      }
      if ([429, 402, 500, 502, 503].includes(res.status)) {
        ks.cooldownUntil = Date.now() + COOLDOWN_MS;
        lastError = `key failed with ${res.status}`;
        continue;
      }
      lastError = `OpenRouter error ${res.status}`;
      break;
    } catch (e) {
      lastError = `network error: ${String(e)}`;
    }
  }
  throw new Error(lastError);
}
