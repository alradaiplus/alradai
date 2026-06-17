'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/src/components/primitives/Button';
import { Icon } from '@/src/components/primitives/Icon';
import { KeyHint } from '@/src/components/primitives/KeyHint';
import { useInbox } from '@/src/store/inboxStore';
import { useToday } from '@/src/store/todayStore';
import { useUI } from '@/src/store/uiStore';

export function CaptureOverlay() {
  const close = useUI((s) => s.close);
  const toast = useUI((s) => s.toast);
  const recordCapture = useUI((s) => s.recordCapture);
  const capture = useInbox((s) => s.capture);
  const todayHydrate = useToday((s) => s.refresh);
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  async function fileInbox() {
    const body = text.trim();
    if (!body) return close();
    const block = await capture(body);
    recordCapture(block.id);
    toast('Filed to Inbox · ⌘Z to undo');
    close();
  }

  async function fileToday() {
    const body = text.trim();
    if (!body) return close();
    // inbox: false makes the block surface in Today's listing directly,
    // matching the toast. Previously this routed to Inbox silently.
    const block = await capture(body, { source: 'manual', inbox: false });
    recordCapture(block.id);
    await todayHydrate();
    toast('Filed to Today');
    close();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const cmd = e.metaKey || e.ctrlKey;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (cmd && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void fileInbox();
    } else if (cmd && e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      void fileToday();
    }
  }

  const canFile = text.trim().length > 0;

  return (
    <div className="nc-overlay-root" onMouseDown={close}>
      <div className="nc-capture" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nc-capture__row">
          <Icon name="mic" size={18} />
          <textarea
            ref={ref}
            className="nc-capture__input"
            value={text}
            placeholder="Capture a thought…"
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        {/* Tap controls — always present so touch devices can file
            without a hardware keyboard. Hidden visually on coarse
            pointers above a comfortable width to avoid duplication. */}
        <div className="nc-capture__buttons">
          <Button variant="ghost" onClick={close} aria-label="Cancel">
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="ghost"
              onClick={fileToday}
              disabled={!canFile}
              aria-label="File to Today"
            >
              Today
            </Button>
            <Button
              variant="primary"
              onClick={fileInbox}
              disabled={!canFile}
              aria-label="File to Inbox"
            >
              File
            </Button>
          </div>
        </div>

        <div className="nc-capture__hint">
          <KeyHint keys={['⌘', '↵']} label="file to Inbox" />
          <KeyHint keys={['⌘', '⇧', '↵']} label="file to Today" />
          <KeyHint keys={['Esc']} label="dismiss" />
        </div>
      </div>
    </div>
  );
}
