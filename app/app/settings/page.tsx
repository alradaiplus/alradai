"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { looksLikeOpenRouterKey } from "@/lib/ai/openrouter-client";
import { User, Sparkles, Database, Palette, Check, Brain, X } from "lucide-react";

const MODELS = [
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-flash-1.5",
  "meta-llama/llama-3.1-70b-instruct",
];

/**
 * Settings — profile, appearance (Chrome Noir), AI (OpenRouter key + model),
 * and data (export / reset). All local-first; no account required.
 */
export default function SettingsPage() {
  const userName = useStore((s) => s.userName);
  const setUserName = useStore((s) => s.setUserName);
  const aiKey = useStore((s) => s.aiKey);
  const setAiKey = useStore((s) => s.setAiKey);
  const aiModel = useStore((s) => s.aiModel);
  const setAiModel = useStore((s) => s.setAiModel);
  const exportWorkspace = useStore((s) => s.exportWorkspace);
  const reset = useStore((s) => s.reset);
  const memories = useStore((s) => s.memories);
  const addMemory = useStore((s) => s.addMemory);
  const removeMemory = useStore((s) => s.removeMemory);
  const [keyInput, setKeyInput] = useState("");
  const [memInput, setMemInput] = useState("");

  const doExport = () => {
    const blob = new Blob([exportWorkspace()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes-canvas-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-canvas-bg">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-[20px] font-semibold text-ink">Settings</h1>

        <Section icon={<User size={15} />} title="Profile">
          <label className="text-[12px] text-ink-faint">Display name</label>
          <input
            defaultValue={userName}
            onBlur={(e) => setUserName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink outline-none focus:border-accent-ring"
          />
        </Section>

        <Section icon={<Palette size={15} />} title="Appearance">
          <p className="text-[13px] text-ink-muted">
            Theme: <span className="text-ink">Chrome Noir</span> (monochrome dark).
          </p>
        </Section>

        <Section icon={<Sparkles size={15} />} title="AI (OpenRouter)">
          <div className="mb-2 flex items-center gap-2 text-[13px]">
            {aiKey ? (
              <>
                <Check size={14} className="text-success" />
                <span className="text-ink-muted">Key connected</span>
                <button
                  onClick={() => setAiKey(null)}
                  className="ml-auto text-[12px] text-ink-faint hover:text-danger"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <span className="text-ink-faint">No key — AI runs in grounded demo mode.</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-v1-…"
              className="flex-1 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink outline-none focus:border-accent-ring"
            />
            <button
              onClick={() => {
                if (looksLikeOpenRouterKey(keyInput)) {
                  setAiKey(keyInput);
                  setKeyInput("");
                }
              }}
              disabled={!looksLikeOpenRouterKey(keyInput)}
              className="rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
            >
              Save
            </button>
          </div>
          <label className="mt-3 block text-[12px] text-ink-faint">Model</label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink-muted outline-none focus:border-accent-ring"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-ink-faint">
            Key is stored only in your browser. Get one at openrouter.ai/keys.
          </p>
        </Section>

        <Section icon={<Brain size={15} />} title="AI Memory">
          <p className="mb-2 text-[12px] text-ink-faint">
            Facts the assistant always remembers (injected into every AI answer).
          </p>
          <div className="mb-2 space-y-1.5">
            {memories.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-1.5 text-[12px] text-ink-muted"
              >
                <span className="flex-1">{m.text}</span>
                <button
                  onClick={() => removeMemory(m.id)}
                  className="text-ink-faint hover:text-danger"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {memories.length === 0 && (
              <p className="text-[12px] text-ink-faint">No memories yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={memInput}
              onChange={(e) => setMemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && memInput.trim()) {
                  addMemory(memInput);
                  setMemInput("");
                }
              }}
              placeholder="e.g. I'm building a brushless motor; prefer concise answers."
              className="flex-1 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink outline-none focus:border-accent-ring"
            />
            <button
              onClick={() => {
                if (memInput.trim()) {
                  addMemory(memInput);
                  setMemInput("");
                }
              }}
              className="rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-accent-foreground transition hover:bg-accent-hover"
            >
              Add
            </button>
          </div>
        </Section>

        <Section icon={<Database size={15} />} title="Data">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={doExport}
              className="rounded-lg border border-canvas-border px-3 py-2 text-[13px] text-ink-muted transition hover:border-accent-ring hover:text-ink"
            >
              Export workspace (JSON)
            </button>
            <button
              onClick={() => {
                if (confirm("Reset to the demo workspace? This clears your boards and nodes."))
                  reset();
              }}
              className="rounded-lg border border-canvas-border px-3 py-2 text-[13px] text-ink-muted transition hover:border-danger hover:text-danger"
            >
              Reset workspace
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            Notifications & integrations arrive with the optional server backend.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-xl border border-canvas-border bg-canvas-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span className="text-ink-faint">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
