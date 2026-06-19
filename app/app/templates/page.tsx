"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { LayoutTemplate, FolderKanban, GraduationCap, Telescope, Users } from "lucide-react";

/**
 * Templates — one click materializes a small blueprint of nodes (and the links
 * between them) onto the current canvas. Everything stays editable as nodes.
 */
export default function TemplatesPage() {
  const addNode = useStore((s) => s.addNode);
  const addEdge = useStore((s) => s.addEdge);
  const router = useRouter();

  const go = () => router.push("/app");

  const TEMPLATES = [
    {
      id: "project",
      name: "Project plan",
      desc: "A project with three starter tasks, linked.",
      icon: <FolderKanban size={18} />,
      build: () => {
        const p = addNode({ type: "project", title: "New project", x: 0, y: 0 });
        ["Define scope", "Build MVP", "Review & ship"].forEach((t, i) => {
          const task = addNode({
            type: "task",
            title: t,
            x: -300 + i * 300,
            y: 260,
            projectId: p.id,
          });
          addEdge(p.id, task.id, "reference");
        });
      },
    },
    {
      id: "study",
      name: "Study notes",
      desc: "A topic hub linked to three sub-notes via wikilinks.",
      icon: <GraduationCap size={18} />,
      build: () => {
        addNode({
          type: "note",
          title: "Topic",
          content: "# Topic\n\nKey ideas: [[Concept A]] · [[Concept B]] · [[Concept C]]",
          x: 0,
          y: 0,
        });
        ["Concept A", "Concept B", "Concept C"].forEach((t, i) =>
          addNode({ type: "note", title: t, content: `## ${t}\n\n`, x: -320 + i * 320, y: 280 })
        );
      },
    },
    {
      id: "research",
      name: "Research",
      desc: "A research question with a sources list.",
      icon: <Telescope size={18} />,
      build: () => {
        const r = addNode({
          type: "research",
          title: "Research question",
          content: "What do I want to find out?",
          sources: [{ title: "Source 1" }, { title: "Source 2" }],
          x: 0,
          y: 0,
        });
        const note = addNode({
          type: "note",
          title: "Findings",
          content: "## Findings\n\n",
          x: 360,
          y: 0,
        });
        addEdge(r.id, note.id, "reference");
      },
    },
    {
      id: "meeting",
      name: "Meeting notes",
      desc: "An agenda note with action items.",
      icon: <Users size={18} />,
      build: () => {
        addNode({
          type: "note",
          title: `Meeting — ${new Date().toLocaleDateString()}`,
          content:
            "# Agenda\n\n- Topic 1\n- Topic 2\n\n# Notes\n\n\n# Action items\n\n- [ ] Follow up",
          tags: ["meeting"],
          x: 0,
          y: 0,
        });
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-canvas-bg">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-[20px] font-semibold text-ink">
          <LayoutTemplate size={18} /> Templates
        </h1>
        <p className="mb-6 text-[13px] text-ink-faint">
          One click drops a blueprint onto your current space.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                t.build();
                go();
              }}
              className="rounded-xl border border-canvas-border bg-canvas-panel p-4 text-left transition hover:border-accent-ring"
            >
              <div className="mb-2 flex items-center gap-2 text-ink">
                <span className="text-ink-faint">{t.icon}</span>
                <span className="text-[14px] font-semibold">{t.name}</span>
              </div>
              <p className="text-[12px] text-ink-muted">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
