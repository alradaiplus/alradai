'use client';

import { useEffect, useState } from 'react';

import { Sheet } from '@/src/components/primitives/Sheet';
import { Button } from '@/src/components/primitives/Button';
import { makeProvider } from '@/src/ai/provider';
import { useAgent } from '@/src/store/agentStore';
import { useMemory } from '@/src/store/memoryStore';
import { useSettings } from '@/src/store/settingsStore';
import { useUI } from '@/src/store/uiStore';
import type { ReasoningLevel } from '@/src/core/types';
import type { Memory } from '@/src/core/memory/types';

const REASONING: ReasoningLevel[] = ['off', 'low', 'medium', 'high'];

const COMMON_MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-opus-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-exp',
];

export function SettingsSheet() {
  const close = useUI((s) => s.close);
  const settings = useSettings((s) => s.settings);
  const patch = useSettings((s) => s.patch);
  const patchModel = useSettings((s) => s.patchModel);
  const monthlyUsd = useAgent((s) => s.monthlyUsd);
  const refreshSpend = useAgent((s) => s.refreshSpend);

  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState<string>('');

  useEffect(() => {
    setKeyDraft(settings.apiKey);
  }, [settings.apiKey]);

  useEffect(() => {
    void refreshSpend();
  }, [refreshSpend]);

  async function saveKey() {
    await patch({ apiKey: keyDraft.trim() });
  }

  async function testKey() {
    setTestStatus('testing');
    setTestMsg('');
    try {
      const provider = makeProvider({
        provider: settings.provider,
        apiKey: keyDraft.trim(),
      });
      const r = await provider.test();
      if (r.ok) {
        setTestStatus('ok');
        await saveKey();
      } else {
        setTestStatus('fail');
        setTestMsg(r.message ?? '');
      }
    } catch (e) {
      setTestStatus('fail');
      setTestMsg((e as Error).message);
    }
  }

  return (
    <Sheet title="Settings" onClose={close}>
      <Section label="Account">
        <Field label="Signed in">
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Local device · no account yet
          </div>
        </Field>
      </Section>

      <Section label="AI">
        <Field label="Provider" hint="v1 ships OpenRouter; others arrive in v2.">
          <select
            className="nc-sheet__select"
            value={settings.provider}
            onChange={(e) => void patch({ provider: e.target.value as 'openrouter' })}
          >
            <option value="openrouter">OpenRouter</option>
            <option value="openai" disabled>
              OpenAI (v2)
            </option>
            <option value="anthropic" disabled>
              Anthropic (v2)
            </option>
            <option value="gemini" disabled>
              Gemini (v2)
            </option>
            <option value="local" disabled>
              Local / Ollama (v3)
            </option>
          </select>
        </Field>

        <Field label="API Key" hint="Stored locally. Never sent to our servers.">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="nc-sheet__input"
              type="password"
              value={keyDraft}
              placeholder="sk-or-…"
              onChange={(e) => setKeyDraft(e.target.value)}
              onBlur={saveKey}
            />
            <Button onClick={testKey}>
              {testStatus === 'testing'
                ? 'Testing…'
                : testStatus === 'ok'
                  ? '✓'
                  : testStatus === 'fail'
                    ? 'Retry'
                    : 'Test'}
            </Button>
          </div>
        </Field>
        {testStatus === 'fail' ? (
          <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 4 }}>
            {testMsg || 'Could not reach provider.'}
          </div>
        ) : null}

        <Field label="Synthesis model">
          <ModelSelect
            value={settings.models.synthesis}
            onChange={(v) => patchModel('synthesis', v)}
          />
        </Field>
        <Field label="Boards model">
          <ModelSelect
            value={settings.models.boards}
            onChange={(v) => patchModel('boards', v)}
          />
        </Field>
        <Field label="Threads model">
          <ModelSelect
            value={settings.models.threads}
            onChange={(v) => patchModel('threads', v)}
          />
        </Field>

        <Field label="Temperature" hint={`${settings.temperature.toFixed(2)}`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            className="nc-slider"
            value={settings.temperature}
            onChange={(e) =>
              void patch({ temperature: parseFloat(e.target.value) })
            }
          />
        </Field>

        <Field label="Reasoning">
          <div className="nc-segmented">
            {REASONING.map((r) => (
              <div
                key={r}
                className={`nc-segmented__opt ${settings.reasoning === r ? 'nc-segmented__opt--on' : ''}`}
                onClick={() => void patch({ reasoning: r })}
              >
                {r}
              </div>
            ))}
          </div>
        </Field>

        <Field label="Monthly cap" hint={`Spent $${monthlyUsd.toFixed(2)} this month`}>
          <input
            className="nc-sheet__input"
            type="number"
            min={0}
            step={1}
            value={settings.monthlyCapUsd}
            onChange={(e) =>
              void patch({ monthlyCapUsd: parseFloat(e.target.value || '0') })
            }
            style={{ minWidth: 100 }}
          />
        </Field>
      </Section>

      <MemorySection />

      <Section label="Canvas">
        <Field label="Snap to grid">
          <Toggle
            on={settings.snapToGrid}
            onClick={() => void patch({ snapToGrid: !settings.snapToGrid })}
          />
        </Field>
      </Section>

      <Section label="Data">
        <Field label="Export">
          <Button>Export · markdown</Button>
        </Field>
        <Field label="Danger zone">
          <Button variant="danger">Delete all blocks</Button>
        </Field>
      </Section>
    </Sheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="nc-sheet__section">
      <div className="nc-sheet__section-label">{label}</div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nc-sheet__field">
      <div>
        <div className="nc-sheet__field-label">{label}</div>
        {hint ? <div className="nc-sheet__field-hint">{hint}</div> : null}
      </div>
      <div className="nc-sheet__field-ctrl">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 34,
        height: 20,
        borderRadius: 999,
        border: '1px solid var(--hairline)',
        background: on ? 'var(--text)' : 'transparent',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
      }}
      aria-pressed={on}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: on ? 'var(--bg)' : 'var(--text-mute)',
          transition: 'left 140ms ease',
        }}
      />
    </button>
  );
}

function ModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      className="nc-sheet__select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {COMMON_MODELS.includes(value) ? null : <option value={value}>{value}</option>}
      {COMMON_MODELS.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

// ── Memory ─────────────────────────────────────────────────
//
// Intentionally tiny. Count + searchable list + delete. The value of
// the memory layer lives in Recall and Synthesis quality — not here.

function MemorySection() {
  const ready = useMemory((s) => s.ready);
  const count = useMemory((s) => s.count);
  const recent = useMemory((s) => s.recent);
  const load = useMemory((s) => s.load);
  const search = useMemory((s) => s.search);
  const del = useMemory((s) => s.deleteMemory);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Memory[]>([]);

  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);

  useEffect(() => {
    let alive = true;
    if (!open) return;
    if (q.trim().length === 0) {
      setResults(recent);
      return;
    }
    void search(q).then((r) => {
      if (alive) setResults(r);
    });
    return () => {
      alive = false;
    };
  }, [open, q, recent, search]);

  return (
    <Section label="Memory">
      <Field
        label={`${count} memor${count === 1 ? 'y' : 'ies'}`}
        hint="What the agent knows about you. Updated nightly."
      >
        <Button onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide' : 'View'}
        </Button>
      </Field>

      {open ? (
        <div style={{ marginTop: 12 }}>
          <input
            className="nc-sheet__input"
            style={{ minWidth: '100%' }}
            value={q}
            placeholder="Search memories…"
            onChange={(e) => setQ(e.target.value)}
          />
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.length === 0 ? (
              <div className="nc-empty" style={{ padding: '12px 0' }}>
                {q ? 'No matches.' : 'No memories yet — write a few blocks and the agent will start learning tonight.'}
              </div>
            ) : (
              results.map((m) => <MemoryRow key={m.id} m={m} onDelete={() => del(m.id)} />)
            )}
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function MemoryRow({ m, onDelete }: { m: Memory; onDelete: () => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px minmax(0,1fr) auto',
        gap: 12,
        padding: '10px 12px',
        border: '1px solid var(--hairline)',
        borderRadius: 10,
        alignItems: 'start',
      }}
    >
      <span style={{ fontSize: 10.5, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {m.tier}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{m.subjectLabel}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.45 }}>
          {m.statement}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 4 }}>
          {m.evidenceCount} block{m.evidenceCount === 1 ? '' : 's'} · confidence {Math.round(m.confidence * 100)}%
        </div>
      </div>
      <Button variant="ghost" onClick={onDelete} aria-label="Delete">
        ×
      </Button>
    </div>
  );
}
