// Supabase Edge Function: generate gte-small (384-dim) embeddings for a node's
// chunked content and upsert them into node_embeddings.
//
// Deploy:  supabase functions deploy embed
// Invoke:  POST { nodeId, workspaceId, chunks: string[] }
//
// Uses Supabase's built-in AI inference (gte-small) so embeddings are free and
// local to the platform — no external embedding API required.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const model = new (Supabase as any).ai.Session("gte-small");

Deno.serve(async (req: Request) => {
  try {
    const { nodeId, workspaceId, chunks } = await req.json();
    if (!nodeId || !workspaceId || !Array.isArray(chunks)) {
      return new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Remove stale embeddings for this node, then insert fresh ones.
    await supabase.from("node_embeddings").delete().eq("node_id", nodeId);

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const content = String(chunks[i] ?? "").trim();
      if (!content) continue;
      const embedding = await model.run(content, {
        mean_pool: true,
        normalize: true,
      });
      rows.push({
        node_id: nodeId,
        workspace_id: workspaceId,
        chunk_index: i,
        content_chunk: content,
        embedding,
        token_count: Math.ceil(content.length / 4),
      });
    }

    if (rows.length) {
      const { error } = await supabase.from("node_embeddings").insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
