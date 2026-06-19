"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { SemanticNode } from "@/lib/types";
import { streamOpenRouterClient } from "@/lib/ai/openrouter-client";
import {
  FolderKanban,
  Plus,
  CircleCheck,
  Circle,
  CircleDot,
  FileText,
  FileType2,
  Maximize2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Project Hub — each project ties its tasks, notes and files together in one
 * place, with an AI planner. Projects are nodes; membership is node.projectId.
 */
export default function ProjectsPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const cycleTask = useStore((s) => s.cycleTask);
  const remove = useStore((s) => s.removeNode);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const addEdge = useStore((s) => s.addEdge);
  const aiKey = useStore((s) => s.aiKey);
  const aiModel = useStore((s) => s.aiModel);
  const router = useRouter();

  const projects = nodes.filter((n) => n.type === "project");
  const [selId, setSelId] = useState<string | null>(projects[0]?.id ?? null);
  const project = projects.find((p) => p.id === selId) ?? null;
  const [busy, setBusy] = useState(false);

  const members = (p: SemanticNode) => nodes.filter((n) => n.projectId === p.id);
  const tasksOf = (p: SemanticNode) => members(p).filter((n) => n.type === "task");
  const notesOf = (p: SemanticNode) => members(p).filter((n) => n.type === "note");
  const filesOf = (p: SemanticNode) =>
    members(p).filter((n) => ["pdf", "image", "video", "voice"].includes(n.type));
  const progress = (p: SemanticNode) => {
    const t = tasksOf(p);
    const done = t.filter((x) => x.status === "done").length;
    return t.length ? Math.round((done / t.length) * 100) : 0;
  };

  const newProject = () => setSelId(addNode({ type: "project", title: "New project" }).id);

  const planWithAI = async () => {
    if (!project || !aiKey || busy) return;
    setBusy(true);
    try {
      let acc = "";
      for await (const d of streamOpenRouterClient({
        apiKey: aiKey,
        model: aiModel,
        maxTokens: 400,
        messages: [
          { role: "system", content: "You are a sharp project planner." },
          {
            role: "user",
            content: `Plan the project "${project.title}". ${project.content}\n\nReturn 4–7 concrete next tasks, one per line, no numbering.`,
          },
        ],
      })) {
        acc += d;
      }
      acc
        .split("\n")
        .map((l) => l.replace(/^[-*\d.\s\[\]]+/, "").trim())
        .filter((l) => l.length > 2)
        .slice(0, 8)
        .forEach((title, i) => {
          const t = addNode({
            type: "task",
            title,
            projectId: project.id,
            boardId: project.boardId,
            x: project.x + (i % 2) * 290,
            y: project.y + project.h + 48 + Math.floor(i / 2) * 140,
          });
          addEdge(project.id, t.id, "reference");
        });
    } catch (e) {
      alert(`AI error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full bg-canvas-bg">
      {/* Project list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-canvas-border">
        <div className="flex items-center gap-2 border-b border-canvas-border px-3 py-2.5">
          <FolderKanban size={15} className="text-ink-muted" />
          <span className="text-[14px] font-semibold text-ink">Projects</span>
          <button onClick={newProject} className="ml-auto rounded p-1 text-ink-muted hover:bg-canvas-hover hover:text-ink">
            <Plus size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {projects.length === 0 && (
            <p className="px-2 py-6 text-center text-[12px] text-ink-faint">No projects yet.</p>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelId(p.id)}
              className={cn(
                "mb-0.5 block w-full rounded-lg px-2.5 py-2 text-left transition",
                selId === p.id ? "bg-canvas-hover" : "hover:bg-canvas-hover/60"
              )}
            >
              <div className="truncate text-[13px] font-medium text-ink">{p.title}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-canvas-elevated">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress(p)}%` }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hub */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!project ? (
          <div className="flex h-full flex-col items-center justify-center text-ink-faint">
            <FolderKanban size={26} className="mb-2 opacity-50" />
            <p className="text-[13px]">Select or create a project.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={project.title}
                onChange={(e) => useStore.getState().updateNode(project.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-[24px] font-bold text-ink outline-none"
              />
              <button
                onClick={() => {
                  selectBoard(project.boardId);
                  select(project.id);
                  router.push("/app");
                }}
                className="flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink"
              >
                <Maximize2 size={12} /> Canvas
              </button>
              <button
                onClick={() => {
                  remove(project.id);
                  setSelId(null);
                }}
                className="text-ink-faint hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              value={project.content}
              onChange={(e) => useStore.getState().updateNode(project.id, { content: e.target.value })}
              placeholder="Project description / goal…"
              className="mb-4 min-h-[60px] w-full resize-y rounded-lg border border-canvas-border bg-canvas-panel p-3 text-[13px] text-ink-muted outline-none focus:border-accent-ring"
            />

            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-[11px] text-ink-faint">
                  <span>Progress</span>
                  <span>{progress(project)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas-elevated">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${progress(project)}%` }} />
                </div>
              </div>
              <button
                onClick={planWithAI}
                disabled={!aiKey || busy}
                className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1.5 text-[12px] text-ink-muted hover:text-ink disabled:opacity-40"
              >
                <Sparkles size={12} /> AI plan
              </button>
            </div>

            {/* Tasks */}
            <Section
              title={`Tasks (${tasksOf(project).length})`}
              action={
                <button
                  onClick={() => addNode({ type: "task", title: "New task", projectId: project.id })}
                  className="text-[11px] text-ink-faint hover:text-ink"
                >
                  + Add
                </button>
              }
            >
              {tasksOf(project).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <button onClick={() => cycleTask(t.id)}>
                    {t.status === "done" ? (
                      <CircleCheck size={15} className="text-ink-muted" />
                    ) : t.status === "doing" ? (
                      <CircleDot size={15} className="text-ink-muted" />
                    ) : (
                      <Circle size={15} className="text-ink-faint" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 truncate text-[13px]",
                      t.status === "done" ? "text-ink-faint line-through" : "text-ink-muted"
                    )}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              {tasksOf(project).length === 0 && <Empty>No tasks. Use AI plan or + Add.</Empty>}
            </Section>

            {/* Notes */}
            <Section title={`Notes (${notesOf(project).length})`}>
              {notesOf(project).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    select(n.id);
                    router.push("/app/notes");
                  }}
                  className="flex w-full items-center gap-2 py-1.5 text-left text-[13px] text-ink-muted hover:text-ink"
                >
                  <FileText size={13} className="text-ink-faint" /> <span className="truncate">{n.title}</span>
                </button>
              ))}
              {notesOf(project).length === 0 && <Empty>No linked notes.</Empty>}
            </Section>

            {/* Files */}
            <Section title={`Files (${filesOf(project).length})`}>
              {filesOf(project).map((n) => (
                <div key={n.id} className="flex items-center gap-2 py-1.5 text-[13px] text-ink-muted">
                  <FileType2 size={13} className="text-ink-faint" /> <span className="truncate">{n.title}</span>
                </div>
              ))}
              {filesOf(project).length === 0 && <Empty>No linked files.</Empty>}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-1 flex items-center">
        <span className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">{title}</span>
        <span className="ml-auto">{action}</span>
      </div>
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-[12px] text-ink-faint">{children}</p>;
}
