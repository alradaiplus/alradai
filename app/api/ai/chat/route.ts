import { NextRequest } from "next/server";
import { hasOpenRouterKeys, streamChat } from "@/lib/ai/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ContextNode {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

/** Lightweight keyword retrieval to pick the most relevant nodes. */
function retrieve(query: string, nodes: ContextNode[], k = 4) {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const scored = nodes.map((n) => {
    const hay = `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (hay.includes(t)) score += 1;
      if (n.title.toLowerCase().includes(t)) score += 1.5;
    }
    return { node: n, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0)
    .slice(0, k);
}

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
  const citations = hits.map((h) => ({
    nodeId: h.node.id,
    title: h.node.title,
    score: h.score,
  }));
  const citationHeader = { "x-citations": JSON.stringify(citations) };

  const contextBlock = hits
    .map((h) => `### ${h.node.title}\n${h.node.content}`)
    .join("\n\n");

  // --- Graceful local fallback when no AI keys are configured --------------
  if (!hasOpenRouterKeys()) {
    const text =
      hits.length === 0
        ? `I couldn't find anything on your canvas about that yet. Add notes (or configure OpenRouter keys in .env.local for full AI answers), then ask again.`
        : `Based on your canvas, here's what's relevant:\n\n${hits
            .map((h) => `• **${h.node.title}** — ${firstSentence(h.node.content)}`)
            .join(
              "\n"
            )}\n\n(Configure OPENROUTER_API_KEY_1 in .env.local to enable full Claude-powered answers.)`;
    return new Response(textStream(text), {
      headers: { "Content-Type": "text/plain; charset=utf-8", ...citationHeader },
    });
  }

  // --- Grounded generation via OpenRouter → Claude ------------------------
  const system = `You are Notes Canvas, the user's visual second brain. Answer using ONLY the context from their canvas below when relevant, and cite note titles inline. Be concise and helpful. If the context is insufficient, say so.\n\nCONTEXT:\n${contextBlock || "(no matching notes)"}`;

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

function firstSentence(text: string): string {
  const clean = text.replace(/[#*`>\[\]]/g, "").trim();
  const m = clean.match(/^(.{0,140}?[.!?])(\s|$)/);
  return (m ? m[1] : clean.slice(0, 120)).trim();
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
