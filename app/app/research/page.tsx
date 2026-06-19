"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { SemanticNode } from "@/lib/types";
import { Telescope, ExternalLink, Plus, FileType2, Link2 } from "lucide-react";

/**
 * Research Center — research questions and their sources, plus a library of
 * source nodes (PDFs, links, bookmarks). The Research→Project pipeline starts
 * here: open a research node and use AI actions to turn findings into tasks.
 */
export default function ResearchPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const router = useRouter();

  const research = nodes.filter((n) => n.type === "research");
  const sources = nodes.filter(
    (n) => n.type === "pdf" || n.type === "link" || n.type === "bookmark"
  );

  const open = (n: SemanticNode) => {
    selectBoard(n.boardId);
    select(n.id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Telescope size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Research Center</h1>
        <span className="text-[12px] text-ink-faint">
          {research.length} questions · {sources.length} sources
        </span>
        <button
          onClick={() => {
            addNode({ type: "research", title: "New research question", sources: [] });
            router.push("/app");
          }}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          <Plus size={14} /> New research
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-auto p-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {research.length === 0 && (
            <p className="text-[13px] text-ink-faint">No research questions yet.</p>
          )}
          {research.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-canvas-border bg-canvas-panel p-4"
            >
              <button
                onClick={() => open(n)}
                className="text-[14px] font-semibold text-ink hover:underline"
              >
                {n.title}
              </button>
              <p className="mt-1 text-[12px] text-ink-muted">{n.content}</p>
              {n.sources && n.sources.length > 0 && (
                <div className="mt-2 space-y-1">
                  {n.sources.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                      <ExternalLink size={11} />
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-ink">
                          {s.title}
                        </a>
                      ) : (
                        <span>{s.title}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
            Sources
          </div>
          <div className="space-y-1.5">
            {sources.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className="flex w-full items-center gap-2 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-left text-[12px] text-ink-muted transition hover:border-canvas-strong hover:text-ink"
              >
                {n.type === "pdf" ? <FileType2 size={13} /> : <Link2 size={13} />}
                <span className="flex-1 truncate">{n.title}</span>
              </button>
            ))}
            {sources.length === 0 && (
              <p className="text-[12px] text-ink-faint">No sources yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
