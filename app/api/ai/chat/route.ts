import { NextRequest } from "next/server";
import { hasOpenRouterKeys, streamChat } from "@/lib/ai/openrouter";
import {
  type ContextNode,
  retrieve,
  citationsOf,
  fallbackAnswer,
  contextBlock,
} from "@/lib/ai/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { message?: string; context?: ContextNode[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = (body.message || "").trim();
  const context = body.context || [];
  if (!message) return Response.json({ error: "Empty message" }, { status: 400 });

  const hits = retrieve(message, context);
  const citationHeader = { "x-citations": JSON.stringify(citationsOf(hits)) };

  // --- Graceful local fallback when no AI keys are configured --------------
  if (!hasOpenRouterKeys()) {
    return new Response(textStream(fallbackAnswer(hits)), {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...citationHeader },
    });
  }

  // --- Grounded generation via OpenRouter → Claude ------------------------
  const system = `You are Notes Canvas, the user's visual second brain. Answer using ONLY the context from their canvas below when relevant, and cite note titles inline. Be concise and helpful. If the context is insufficient, say so.\n\nCONTEXT:\n${
    contextBlock(hits) || "(no matching notes)"
  }`;

  try {
    const stream = await streamChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      maxTokens: 900,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...citationHeader },
    });
  } catch (e) {
    return Response.json(
      { error: `AI service error: ${String(e instanceof Error ? e.message : e)}` },
      { status: 502 }
    );
  }
}

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/);
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= words.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(words[i++]));
    },
  });
}
