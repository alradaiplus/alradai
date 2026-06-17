'use client';

import { useEffect } from 'react';

import { Commitments } from '@/src/components/today/Commitments';
import { MorningParagraph } from '@/src/components/today/MorningParagraph';
import { NoKeyBanner } from '@/src/components/overlays/Onboarding';
import { RecallColumn } from '@/src/components/today/RecallColumn';
import { ThreadsCard } from '@/src/components/today/Threads';
import { TodayEditor } from '@/src/components/today/TodayEditor';
import { useAgent } from '@/src/store/agentStore';
import { useToday } from '@/src/store/todayStore';
import { useUI } from '@/src/store/uiStore';
import { longDate } from '@/src/core/time';
import { renderSynthesis, renderThread } from '@/src/ai/outcomes';

export function TodaySurface() {
  const hydrate = useToday((s) => s.hydrate);
  const ready = useToday((s) => s.ready);
  const refreshMorning = useAgent((s) => s.refreshMorning);
  const refreshThreads = useAgent((s) => s.refreshThreads);
  const triggerSynthesis = useAgent((s) => s.triggerSynthesis);
  const triggerThreadDiscovery = useAgent((s) => s.triggerThreadDiscovery);
  const toast = useUI((s) => s.toast);

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  // Auto-trigger on first open. Toast hard errors only — info-level
  // outcomes (already-ran, too-few-blocks) live on the Morning
  // Paragraph itself.
  useEffect(() => {
    void refreshMorning();
    void refreshThreads();

    void triggerSynthesis().then((o) => {
      void refreshMorning();
      const r = renderSynthesis(o);
      if (r.severity === 'error') toast(r.message);
    });

    void triggerThreadDiscovery().then((o) => {
      void refreshThreads();
      const r = renderThread(o);
      if (r.severity === 'error') toast(r.message);
    });
  }, [
    refreshMorning,
    refreshThreads,
    triggerSynthesis,
    triggerThreadDiscovery,
    toast,
  ]);

  return (
    <main className="nc-today">
      <div>
        <header className="nc-day-header">
          <div className="nc-day-header__date">{longDate()}</div>
          <h1 className="nc-day-header__title">Today</h1>
        </header>
        <NoKeyBanner />
        <MorningParagraph />
        <ThreadsCard />
        <Commitments />
        <TodayEditor />
      </div>
      <RecallColumn />
    </main>
  );
}
