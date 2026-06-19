"use client";

/**
 * Browser-side OpenRouter streaming client.
 *
 * Used by the static (GitHub Pages) build, where there is no server to hold a
 * secret. The key is supplied by the user at runtime and kept only in their
 * own browser (localStorage) — it is never committed to the repo or baked into
 * the deployed bundle. On a server host, the secure server route
 * (/api/ai/chat + lib/ai/openrouter.ts) is used instead.
 */

export interface ClientChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

/**
 * Stream a chat completion from OpenRouter, yielding plain-text deltas.
 * Throws on a non-OK response so the caller can surface the error.
 */
export async function* streamOpenRouterClient(opts: {
  apiKey: string;
  messages: ClientChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "https://localhost",
      "X-Title": "Notes Canvas",
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 900,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `OpenRouter ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
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
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
}

/** Lightweight validity check for an OpenRouter key (used by the connect UI). */
export function looksLikeOpenRouterKey(key: string): boolean {
  return /^sk-or-/.test(key.trim());
}
