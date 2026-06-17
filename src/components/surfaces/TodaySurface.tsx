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
import { longDate } from '@/src/core/time';

export function TodaySurface() {
  const hydrate = useToday((s) => s.hydrate);
  const ready = useToday((s) => s.ready);
  const refreshMorning = useAgent((s) => s.refreshMorning);
  const refreshThreads = useAgent((s) => s.refreshThreads);
  const triggerSynthesis = useAgent((s) => s.triggerSynthesis);
  const triggerThreadDiscovery = useAgent((s) => s.triggerThreadDiscovery);

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  // Fire-and-forget: nightly synthesis and weekly thread discovery
  // both catch up on first open.
  useEffect(() => {
    void refreshMorning();
    void refreshThreads();
    void triggerSynthesis().then(() => void refreshMorning());
    void triggerThreadDiscovery().then(() => void refreshThreads());
  }, [
    refreshMorning,
    refreshThreads,
    triggerSynthesis,
    triggerThreadDiscovery,
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
