'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/src/components/primitives/Button';
import { Icon } from '@/src/components/primitives/Icon';
import { KeyHint } from '@/src/components/primitives/KeyHint';
import { makeProvider } from '@/src/ai/provider';
import { useSettings } from '@/src/store/settingsStore';
import { useUI } from '@/src/store/uiStore';

// Notes Canvas — first-launch onboarding.
//
// Two screens. ≤ 60 seconds. The product opens here when the user
// has no API key saved, and never again afterward. Skipping is
// allowed; an inline reminder appears on Today until a key is added.

type Step = 'welcome' | 'key';

const ONBOARDING_DISMISSED_KEY = 'noter:onboarding-dismissed';

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const settings = useSettings((s) => s.settings);
  const patch = useSettings((s) => s.patch);
  const toast = useUI((s) => s.toast);

  const [keyDraft, setKeyDraft] = useState(settings.apiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState<string>('');

  function skip() {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1'); } catch {}
    }
    onClose();
  }

  async function finish() {
    const k = keyDraft.trim();
    if (k) await patch({ apiKey: k });
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1'); } catch {}
    }
    toast(k ? 'Key saved' : 'Skipped — add a key any time in Settings');
    onClose();
  }

  async function test() {
    const k = keyDraft.trim();
    if (!k) return;
    setTestStatus('testing');
    setTestMsg('');
    try {
      const provider = makeProvider({ provider: settings.provider, apiKey: k });
      const r = await provider.test();
      if (r.ok) {
        setTestStatus('ok');
        await patch({ apiKey: k });
      } else {
        setTestStatus('fail');
        setTestMsg(r.message ?? 'Could not reach OpenRouter.');
      }
    } catch (e) {
      setTestStatus('fail');
      setTestMsg((e as Error).message);
    }
  }

  return (
    <div className="nc-overlay-root" onMouseDown={(e) => e.stopPropagation()}>
      <div className="nc-onb">
        <div className="nc-onb__step-indicator">
          <span className={`nc-onb__dot ${step === 'welcome' ? 'nc-onb__dot--on' : ''}`} />
          <span className={`nc-onb__dot ${step === 'key' ? 'nc-onb__dot--on' : ''}`} />
        </div>

        {step === 'welcome' ? (
          <Welcome onContinue={() => setStep('key')} onSkip={skip} />
        ) : (
          <KeyStep
            keyDraft={keyDraft}
            setKeyDraft={setKeyDraft}
            testStatus={testStatus}
            testMsg={testMsg}
            onTest={test}
            onSkip={skip}
            onFinish={finish}
            onBack={() => setStep('welcome')}
          />
        )}
      </div>
    </div>
  );
}

function Welcome({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <div className="nc-onb__brand">
        <div className="nc-onb__brand-mark">N</div>
        <span>Notes Canvas</span>
      </div>
      <h1 className="nc-onb__title">Capture every thought.</h1>
      <p className="nc-onb__lede">
        Notes Canvas reads what you write and, by morning, tells you
        what you were really thinking about.
      </p>

      <ul className="nc-onb__list">
        <li>
          <span className="nc-onb__bullet">·</span>
          <div>
            <strong>Capture</strong> any thought with{' '}
            <KeyHint keys={['⌘', '⇧', 'Space']} /> from anywhere.
          </div>
        </li>
        <li>
          <span className="nc-onb__bullet">·</span>
          <div>
            <strong>Synthesis</strong> writes one paragraph each morning
            tying yesterday&apos;s thinking together.
          </div>
        </li>
        <li>
          <span className="nc-onb__bullet">·</span>
          <div>
            <strong>Memory</strong> builds a working model of your
            projects, positions, and open questions as you go.
          </div>
        </li>
      </ul>

      <div className="nc-onb__footer">
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Continue
          <Icon name="arrow-right" size={12} />
        </Button>
      </div>
    </>
  );
}

function KeyStep({
  keyDraft,
  setKeyDraft,
  testStatus,
  testMsg,
  onTest,
  onSkip,
  onFinish,
  onBack,
}: {
  keyDraft: string;
  setKeyDraft: (s: string) => void;
  testStatus: 'idle' | 'testing' | 'ok' | 'fail';
  testMsg: string;
  onTest: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <h1 className="nc-onb__title">Connect OpenRouter.</h1>
      <p className="nc-onb__lede">
        One key unlocks every model — Claude, GPT, Gemini, more. Your
        key lives only on this device. We never see it.
      </p>

      <div className="nc-onb__field">
        <label className="nc-onb__label">OpenRouter API key</label>
        <div className="nc-onb__keyrow">
          <input
            className="nc-sheet__input"
            type="password"
            value={keyDraft}
            placeholder="sk-or-…"
            onChange={(e) => setKeyDraft(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={onTest} disabled={keyDraft.trim().length < 8}>
            {testStatus === 'testing'
              ? 'Testing…'
              : testStatus === 'ok'
                ? '✓ Reachable'
                : testStatus === 'fail'
                  ? 'Retry'
                  : 'Test'}
          </Button>
        </div>
        {testStatus === 'fail' ? (
          <div className="nc-onb__error">{testMsg || 'Could not reach OpenRouter.'}</div>
        ) : null}
        <div className="nc-onb__hint">
          No key?{' '}
          <a
            className="nc-onb__link"
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer noopener"
          >
            Create one in 60 seconds →
          </a>
        </div>
      </div>

      <div className="nc-onb__recs">
        <div className="nc-onb__recs-label">Recommended models</div>
        <div className="nc-onb__rec">
          <strong>Synthesis</strong>
          <code>anthropic/claude-sonnet-4</code>
          <span>balanced quality & cost</span>
        </div>
        <div className="nc-onb__rec">
          <strong>Boards</strong>
          <code>openai/gpt-4o</code>
          <span>strong structured-output</span>
        </div>
        <div className="nc-onb__rec">
          <strong>Threads</strong>
          <code>anthropic/claude-opus-4</code>
          <span>once per week — best naming</span>
        </div>
        <div className="nc-onb__hint" style={{ marginTop: 8 }}>
          You can change these any time in Settings (⌘,).
        </div>
      </div>

      <div className="nc-onb__footer">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={onFinish}
            disabled={testStatus === 'fail'}
          >
            {testStatus === 'ok' ? 'Get started' : 'Save & start'}
            <Icon name="arrow-right" size={12} />
          </Button>
        </div>
      </div>
    </>
  );
}

/** Returns true the first time the app is opened (no key, not dismissed). */
export function shouldShowOnboarding(apiKey: string): boolean {
  if (apiKey.trim().length > 0) return false;
  if (typeof localStorage === 'undefined') return true;
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Inline reminder bar on Today when no key is configured. */
export function NoKeyBanner() {
  const settings = useSettings((s) => s.settings);
  const open = useUI((s) => s.open);
  if (settings.apiKey.trim().length > 0) return null;
  return (
    <div className="nc-nokey">
      <span>
        Add an OpenRouter key to enable synthesis, threads, and boards.
      </span>
      <Button variant="primary" onClick={() => open('settings')}>
        Add key
      </Button>
    </div>
  );
}

// hook used by Shell to hydrate the dismissed-flag without forcing
// useEffect at every render
export function useOnboardingGate(): {
  show: boolean;
  setShow: (v: boolean) => void;
} {
  const apiKey = useSettings((s) => s.settings.apiKey);
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(shouldShowOnboarding(apiKey));
  }, [apiKey]);
  return { show, setShow };
}
