"use client";

import Link from "next/link";
import {
  Layers,
  FileText,
  CircleCheck,
  Flame,
  Share2,
  Sparkles,
  Command,
  Trash2,
  Upload,
  KeyRound,
} from "lucide-react";

/**
 * How to use — a concise, in-app guide. Static content; no data dependency.
 */
export default function HelpPage() {
  return (
    <div className="h-full overflow-y-auto bg-canvas-bg">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-[22px] font-semibold text-ink">How to use Notes Canvas</h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          A visual second brain: Miro&apos;s canvas + Notion&apos;s organization +
          Obsidian&apos;s links + an AI that understands your workspace.
        </p>

        <Step icon={<Layers size={16} />} title="1 · The canvas is home base">
          Open <Code>Canvas</Code> and use the bottom toolbar to add notes, tasks,
          projects, images, voice notes and more. Drag to move, drag a corner to
          resize, scroll to zoom, space-drag to pan. Use the minimap (bottom-left)
          to navigate big boards.
        </Step>

        <Step icon={<FileText size={16} />} title="2 · Write notes">
          Add a note on the canvas, or use the <Code>Notes</Code> page for a
          focused two-pane writer. Type <Code>/</Code> for blocks (headings,
          to-dos, lists, quotes, callouts, code). Link notes with{" "}
          <Code>[[Title]]</Code> and embed one inside another with{" "}
          <Code>![[Title]]</Code>.
        </Step>

        <Step icon={<CircleCheck size={16} />} title="3 · Tasks & projects">
          Create tasks with status, priority and due date. See them as a board on
          the <Code>Tasks</Code> page and dated on the <Code>Calendar</Code>.
          Group work under a project node.
        </Step>

        <Step icon={<Flame size={16} />} title="4 · Habits">
          Add habits and tick days on the <Code>Habits</Code> page to build
          streaks and see your completion rate.
        </Step>

        <Step icon={<Share2 size={16} />} title="5 · Connect your knowledge">
          Connections form automatically from <Code>[[wikilinks]]</Code>, or draw
          them: open a node → <em>Connect</em> → click another. See it all in the{" "}
          <Code>Knowledge Graph</Code>.
        </Step>

        <Step icon={<Sparkles size={16} />} title="6 · AI assistant">
          Open the <Code>AI</Code> panel to ask questions grounded in your notes
          (with citations). On any node: Summarize, Extend, Critique, or generate
          Tasks. Run <em>Discover links</em> to surface hidden connections.
        </Step>

        <Step icon={<KeyRound size={16} />} title="7 · Turn on real AI">
          In <Link href="/app/settings" className="text-accent-hover underline">Settings</Link> (or the AI panel), paste your
          OpenRouter key and pick a model. It&apos;s stored only in your browser.
          Add facts to <em>AI Memory</em> that the assistant should always know.
        </Step>

        <Step icon={<Upload size={16} />} title="8 · Files & voice">
          On image / PDF / video / voice nodes, use <em>Upload from device</em> —
          or <em>Record</em> a voice note in the browser. Everything is in the{" "}
          <Code>Files</Code> library.
        </Step>

        <Step icon={<Command size={16} />} title="9 · Move fast">
          Press <Code>⌘K</Code> / <Code>Ctrl&nbsp;K</Code> to search everything,
          switch spaces, or create any node type.
        </Step>

        <Step icon={<Trash2 size={16} />} title="10 · Delete anything">
          Select a node and press <Code>Delete</Code> on the canvas, or use the
          trash icon in the inspector / list views. Delete a Space from the
          sidebar (hover → ✕). Reset the whole workspace in Settings.
        </Step>

        <p className="mt-8 text-[12px] text-ink-faint">
          Tip: your data lives in this browser. Use Settings → Export to back it up.
        </p>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-1.5 flex items-center gap-2 text-[14px] font-semibold text-ink">
        <span className="text-ink-faint">{icon}</span>
        {title}
      </div>
      <p className="text-[13px] leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-canvas-elevated px-1.5 py-0.5 font-mono text-[11px] text-ink">
      {children}
    </code>
  );
}
