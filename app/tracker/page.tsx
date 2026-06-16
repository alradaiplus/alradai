import type { ReactElement } from 'react';

/* ──────────────────────────────────────────────────────────────
   Notes Canvas — Tracker
   November 2026 · Carbon black · Apple-inspired
   ────────────────────────────────────────────────────────────── */

const MONTH_DAYS = 30; // November 2026
const TODAY = 18; // current day inside the month for the design
const NOV_1_WEEKDAY = 0; // Sunday = 0

type Habit = {
  id: string;
  name: string;
  cue: string;
  pattern: number; // bitmask-like density 0..100
  schedule?: 'daily' | 'weekday' | 'weekend';
  emoji?: string;
};

const HABITS: Habit[] = [
  { id: 'wake', name: 'Wake Up at 5:00 AM', cue: 'Daily · 05:00', pattern: 86 },
  { id: 'deep', name: 'Deep Work', cue: '90 min · morning block', pattern: 92 },
  { id: 'exercise', name: 'Exercise', cue: '45 min · strength + zone 2', pattern: 74 },
  { id: 'reading', name: 'Reading', cue: '30 pages · evening', pattern: 81 },
  { id: 'journal', name: 'Journal', cue: 'Reflection · before sleep', pattern: 88 },
  { id: 'meditation', name: 'Meditation', cue: '15 min · mid-day', pattern: 67 },
  { id: 'learning', name: 'Learning', cue: 'Course · 1 module', pattern: 78 },
  { id: 'project', name: 'Project Work', cue: 'Mechatronics · evening', pattern: 95 },
];

/** Deterministic completion map per habit per day. */
function completionFor(habit: Habit): boolean[] {
  // simple deterministic hash → no Math.random, no hydration drift
  const result: boolean[] = [];
  let seed = 0;
  for (let i = 0; i < habit.id.length; i++) seed = (seed * 31 + habit.id.charCodeAt(i)) >>> 0;
  for (let d = 1; d <= MONTH_DAYS; d++) {
    if (d > TODAY) {
      result.push(false);
      continue;
    }
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const roll = seed % 100;
    result.push(roll < habit.pattern);
  }
  return result;
}

function countDone(arr: boolean[]): number {
  return arr.slice(0, TODAY).filter(Boolean).length;
}

function currentStreak(arr: boolean[]): number {
  let s = 0;
  for (let i = TODAY - 1; i >= 0; i--) {
    if (arr[i]) s++;
    else break;
  }
  return s;
}

function bestStreak(arr: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < TODAY; i++) {
    if (arr[i]) {
      cur++;
      if (cur > best) best = cur;
    } else cur = 0;
  }
  return best;
}

/* ────────────── small icons ────────────── */
function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const I = {
  search: 'M11 19a8 8 0 1 1 5.3-2L21 21',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  home: 'M4 11 12 4l8 7v9h-6v-6h-4v6H4z',
  canvas: 'M4 5h16v14H4zM8 9h8M8 13h5',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  bar: 'M4 20V10m6 10V4m6 16v-7m6 7V8',
  book: 'M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2Zm2-2h13',
  flame: 'M12 22c4 0 7-2.5 7-7 0-3-2-5-3-7 0 2-1 3-3 3 0-3-2-5-2-8-3 2-6 5-6 10s3 9 7 9Z',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  trend: 'M3 17l6-6 4 4 8-8M14 7h7v7',
};

/* ────────────── helpers ────────────── */
function dayWeekday(day: number): number {
  return (NOV_1_WEEKDAY + day - 1) % 7;
}
function isWeekend(day: number): boolean {
  const w = dayWeekday(day);
  return w === 0 || w === 6;
}

/* ────────────── SVG charts ────────────── */
function AreaChart(): ReactElement {
  // Daily completion ratio across the month (out of 8 habits, up to today)
  const series = Array.from({ length: TODAY }, (_, i) => {
    const day = i + 1;
    const done = HABITS.reduce(
      (acc, h) => acc + (completionFor(h)[day - 1] ? 1 : 0),
      0,
    );
    return done / HABITS.length;
  });
  const W = 560;
  const H = 200;
  const PAD = 28;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const step = innerW / (TODAY - 1);
  const points = series
    .map((v, i) => `${PAD + i * step},${PAD + (1 - v) * innerH}`)
    .join(' ');
  const area = `M ${PAD},${H - PAD} L ${points.split(' ').join(' L ')} L ${W - PAD},${H - PAD} Z`;
  const line = `M ${points.split(' ').join(' L ')}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={PAD}
          x2={W - PAD}
          y1={PAD + (1 - g) * innerH}
          y2={PAD + (1 - g) * innerH}
          stroke="#1f1f1f"
          strokeDasharray="2 4"
        />
      ))}
      <path d={area} fill="#ffffff" fillOpacity="0.06" />
      <path d={line} fill="none" stroke="#ffffff" strokeWidth="1.5" />
      {series.map((v, i) =>
        i === series.length - 1 ? (
          <circle
            key={i}
            cx={PAD + i * step}
            cy={PAD + (1 - v) * innerH}
            r={3.5}
            fill="#111111"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ) : null,
      )}
      {/* x labels */}
      {[1, 8, 15, 22, TODAY].map((d, i) => (
        <text
          key={i}
          x={PAD + (d - 1) * step}
          y={H - 8}
          fill="#6b6b6b"
          fontSize="10"
          textAnchor="middle"
        >
          Nov {d}
        </text>
      ))}
    </svg>
  );
}

function StreakRing(): ReactElement {
  const size = 168;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = 0.74; // consistency
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0' }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#232323"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#ffffff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          fill="#f5f5f5"
          fontSize="34"
          fontWeight="500"
          letterSpacing="-1.5"
        >
          18
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          fill="#6b6b6b"
          fontSize="11"
          letterSpacing="1.4"
        >
          DAY STREAK
        </text>
      </svg>
    </div>
  );
}

function WeeklyBars(): ReactElement {
  const W = 320;
  const H = 200;
  const PAD = 24;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [0.78, 0.84, 0.91, 0.88, 0.95, 0.62, 0.71];
  const barW = (W - PAD * 2) / days.length - 8;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={PAD}
          x2={W - PAD}
          y1={PAD + (1 - g) * (H - PAD * 2)}
          y2={PAD + (1 - g) * (H - PAD * 2)}
          stroke="#1f1f1f"
          strokeDasharray="2 4"
        />
      ))}
      {values.map((v, i) => {
        const x = PAD + i * ((W - PAD * 2) / days.length) + 4;
        const h = v * (H - PAD * 2);
        const y = H - PAD - h;
        const isMax = v === Math.max(...values);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={isMax ? '#ffffff' : '#2c2c2c'}
            />
            <text
              x={x + barW / 2}
              y={H - 6}
              fill="#6b6b6b"
              fontSize="10"
              textAnchor="middle"
            >
              {days[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ────────────── Page ────────────── */
export default function TrackerPage() {
  const completions = HABITS.map((h) => completionFor(h));
  const totalDoneToToday = completions.reduce((s, arr) => s + countDone(arr), 0);
  const totalSlots = HABITS.length * TODAY;
  const monthlyRate = Math.round((totalDoneToToday / totalSlots) * 100);

  const currentStreaks = completions.map((c) => currentStreak(c));
  const bestStreaks = completions.map((c) => bestStreak(c));
  const overallStreak = Math.min(...currentStreaks); // every habit at once
  const allTimeBest = Math.max(...bestStreaks);

  const todayDoneCount = HABITS.reduce(
    (acc, h, i) => acc + (completions[i][TODAY - 1] ? 1 : 0),
    0,
  );

  const habitPct = HABITS.map((_, i) => Math.round((countDone(completions[i]) / TODAY) * 100));
  const bestHabitIdx = habitPct.indexOf(Math.max(...habitPct));
  const worstHabitIdx = habitPct.indexOf(Math.min(...habitPct));

  return (
    <div className="tk-shell">
      {/* ── Top Bar ── */}
      <header className="tk-topbar">
        <div className="tk-brand">
          <div className="tk-brand-mark">N</div>
          <span>Notes Canvas</span>
          <span className="tk-brand-sub">/ Tracker</span>
        </div>
        <div className="tk-topbar-actions">
          <button className="tk-iconbtn" aria-label="Search">
            <Icon d={I.search} />
          </button>
          <button className="tk-iconbtn" aria-label="Notifications">
            <Icon d={I.bell} />
          </button>
          <button className="tk-iconbtn" aria-label="Settings">
            <Icon d={I.settings} />
          </button>
          <span className="tk-divider" />
          <div className="tk-avatar">AF</div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="tk-main">
        {/* ── Left Content ── */}
        <section>
          {/* Header */}
          <div className="tk-header">
            <div>
              <div className="tk-eyebrow">Habit Tracker</div>
              <h1 className="tk-title">November 2026</h1>
              <div className="tk-subtitle">
                {todayDoneCount} of {HABITS.length} habits completed today · keep building.
              </div>
            </div>
            <div className="tk-row" style={{ gap: 10 }}>
              <span className="tk-month-pill">
                <Icon d={I.arrow} size={12} /> <strong>Nov 18, 2026</strong> · Wednesday
              </span>
              <button
                className="tk-iconbtn"
                style={{ width: 'auto', padding: '0 14px', gap: 8, display: 'inline-flex' }}
                aria-label="Add habit"
              >
                <Icon d={I.plus} size={13} />
                <span style={{ fontSize: 12 }}>Add Habit</span>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="tk-stats">
            <div className="tk-stat">
              <div className="tk-stat-label">Monthly Completion</div>
              <div className="tk-stat-value">
                {monthlyRate}
                <span className="tk-stat-unit">%</span>
              </div>
              <div className="tk-stat-meta">
                <span className="tk-trend-up">▲ 6.2%</span>
                <span className="tk-muted">vs October</span>
              </div>
            </div>
            <div className="tk-stat">
              <div className="tk-stat-label">Habits Tracked</div>
              <div className="tk-stat-value">
                {HABITS.length}
                <span className="tk-stat-unit">active</span>
              </div>
              <div className="tk-stat-meta">
                <span className="tk-dim">{totalDoneToToday} completions</span>
                <span className="tk-muted">this month</span>
              </div>
            </div>
            <div className="tk-stat">
              <div className="tk-stat-label">Current Streak</div>
              <div className="tk-stat-value">
                {overallStreak}
                <span className="tk-stat-unit">days</span>
              </div>
              <div className="tk-stat-meta">
                <span className="tk-trend-up">▲ all habits today</span>
              </div>
            </div>
            <div className="tk-stat">
              <div className="tk-stat-label">Best Streak</div>
              <div className="tk-stat-value">
                {allTimeBest}
                <span className="tk-stat-unit">days</span>
              </div>
              <div className="tk-stat-meta">
                <span className="tk-dim">Project Work</span>
                <span className="tk-muted">all-time</span>
              </div>
            </div>
          </div>

          {/* Habit Grid */}
          <div className="tk-card" style={{ marginTop: 28 }}>
            <div className="tk-card-head">
              <div>
                <div className="tk-card-title">Habit Grid</div>
                <div className="tk-card-sub">November 2026 · {MONTH_DAYS} days</div>
              </div>
              <div className="tk-tabs" role="tablist">
                <span className="tk-tab is-active">Month</span>
                <span className="tk-tab">Week</span>
                <span className="tk-tab">Year</span>
              </div>
            </div>

            <div className="tk-grid-wrap">
              <table className="tk-grid">
                <thead>
                  <tr>
                    <th className="tk-grid-head-name">Habit</th>
                    {Array.from({ length: MONTH_DAYS }, (_, i) => i + 1).map((d) => (
                      <th key={d} className={isWeekend(d) ? 'is-weekend' : ''}>
                        {d}
                      </th>
                    ))}
                    <th className="tk-grid-head-stats">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {HABITS.map((h, hi) => {
                    const done = completions[hi];
                    const doneCount = countDone(done);
                    const pct = habitPct[hi];
                    return (
                      <tr key={h.id}>
                        <td className="tk-row-name">
                          <div className="tk-row-name-inner">
                            <span className={`tk-row-dot ${done[TODAY - 1] ? 'is-on' : ''}`} />
                            <div>
                              <div className="tk-row-label">{h.name}</div>
                              <div className="tk-row-sub">{h.cue}</div>
                            </div>
                          </div>
                        </td>
                        {Array.from({ length: MONTH_DAYS }, (_, i) => i + 1).map((d) => {
                          const idx = d - 1;
                          const isFuture = d > TODAY;
                          const isToday = d === TODAY;
                          const isDone = done[idx];
                          let cls = 'tk-box';
                          if (isFuture) cls += ' is-future';
                          else if (isDone) cls += ' is-done';
                          if (isToday && !isDone) cls += ' is-today';
                          return (
                            <td key={d} className="tk-row-cell">
                              <span className={cls} />
                            </td>
                          );
                        })}
                        <td className="tk-row-stats">
                          <div className="tk-row-pct">{pct}%</div>
                          <div>
                            {doneCount}/{TODAY}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics */}
          <div className="tk-analytics">
            {/* Area chart */}
            <div className="tk-card">
              <div className="tk-card-head">
                <div>
                  <div className="tk-card-title">Completion Trend</div>
                  <div className="tk-card-sub">Daily ratio across all habits</div>
                </div>
                <div className="tk-tabs">
                  <span className="tk-tab is-active">30D</span>
                  <span className="tk-tab">90D</span>
                  <span className="tk-tab">YTD</span>
                </div>
              </div>
              <div className="tk-chart-body">
                <div className="tk-chart-stats">
                  <div>
                    <div className="tk-chart-stat-label">Avg</div>
                    <div className="tk-chart-stat-value">{monthlyRate}%</div>
                  </div>
                  <div>
                    <div className="tk-chart-stat-label">Peak</div>
                    <div className="tk-chart-stat-value">100%</div>
                  </div>
                  <div>
                    <div className="tk-chart-stat-label">Variance</div>
                    <div className="tk-chart-stat-value">±12.4</div>
                  </div>
                </div>
                <AreaChart />
              </div>
            </div>

            {/* Streak ring */}
            <div className="tk-card">
              <div className="tk-card-head">
                <div>
                  <div className="tk-card-title">Streak</div>
                  <div className="tk-card-sub">All habits aligned</div>
                </div>
                <span className="tk-card-sub">
                  <Icon d={I.flame} size={12} /> live
                </span>
              </div>
              <div className="tk-chart-body">
                <StreakRing />
                <div className="tk-scores" style={{ marginTop: 8 }}>
                  <div className="tk-score">
                    <div className="tk-score-label">Productivity</div>
                    <div className="tk-score-value">
                      8.7<span className="tk-stat-unit">/10</span>
                    </div>
                    <div className="tk-score-bar">
                      <div className="tk-score-fill" style={{ width: '87%' }} />
                    </div>
                    <div className="tk-score-meta">↑ from 8.1 last month</div>
                  </div>
                  <div className="tk-score">
                    <div className="tk-score-label">Consistency</div>
                    <div className="tk-score-value">
                      74<span className="tk-stat-unit">%</span>
                    </div>
                    <div className="tk-score-bar">
                      <div className="tk-score-fill" style={{ width: '74%' }} />
                    </div>
                    <div className="tk-score-meta">3-week rolling avg</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly bars */}
            <div className="tk-card">
              <div className="tk-card-head">
                <div>
                  <div className="tk-card-title">Weekly Trend</div>
                  <div className="tk-card-sub">By day of week</div>
                </div>
                <span className="tk-card-sub">
                  <Icon d={I.trend} size={12} /> Fri peaks
                </span>
              </div>
              <div className="tk-chart-body">
                <WeeklyBars />
                <div className="tk-chart-stats" style={{ marginTop: 6, marginBottom: 0 }}>
                  <div>
                    <div className="tk-chart-stat-label">Best Day</div>
                    <div className="tk-chart-stat-value" style={{ fontSize: 18 }}>
                      Friday
                    </div>
                  </div>
                  <div>
                    <div className="tk-chart-stat-label">Watch</div>
                    <div className="tk-chart-stat-value" style={{ fontSize: 18 }}>
                      Saturday
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Rail ── */}
        <aside className="tk-rail">
          {/* Today's habits */}
          <div className="tk-card">
            <div className="tk-card-head">
              <div>
                <div className="tk-card-title">Today&apos;s Habits</div>
                <div className="tk-card-sub">{todayDoneCount} of {HABITS.length} complete</div>
              </div>
              <span className="tk-card-sub">Wed</span>
            </div>
            <div className="tk-card-body">
              {HABITS.slice(0, 6).map((h, i) => {
                const done = completions[i][TODAY - 1];
                return (
                  <div key={h.id} className="tk-today-item">
                    <span className={`tk-check ${done ? 'is-on' : ''}`}>
                      {done ? <Icon d={I.check} size={11} /> : null}
                    </span>
                    <div className="tk-today-name">
                      {h.name}
                      <div className="tk-row-sub" style={{ marginTop: 2 }}>{h.cue}</div>
                    </div>
                    <span className="tk-today-time">
                      {done ? 'Done' : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current streaks */}
          <div className="tk-card">
            <div className="tk-card-head">
              <div>
                <div className="tk-card-title">Current Streaks</div>
                <div className="tk-card-sub">Active runs</div>
              </div>
              <span className="tk-card-sub">{HABITS.length}</span>
            </div>
            <div className="tk-card-body">
              {HABITS.map((h, i) => (
                <div key={h.id} className="tk-streak-item">
                  <span className={`tk-row-dot ${currentStreaks[i] > 0 ? 'is-on' : ''}`} />
                  <div className="tk-streak-name">{h.name}</div>
                  <span className="tk-streak-flame">
                    <Icon d={I.flame} size={11} /> {currentStreaks[i]}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Best performing */}
          <div className="tk-card tk-best-card">
            <div className="tk-best-label">Best Performing Habit</div>
            <div className="tk-best-name">{HABITS[bestHabitIdx].name}</div>
            <div className="tk-best-meta">
              {habitPct[bestHabitIdx]}% completion · {bestStreaks[bestHabitIdx]}-day best streak
            </div>
            <div className="tk-mini-bars" aria-hidden>
              {completions[bestHabitIdx].slice(0, TODAY).map((v, i) => (
                <span
                  key={i}
                  className={`tk-mini-bar ${v ? 'is-on' : ''}`}
                  style={{ height: v ? `${60 + ((i * 7) % 40)}%` : '24%' }}
                />
              ))}
            </div>
          </div>

          {/* Needs attention */}
          <div className="tk-card">
            <div className="tk-card-head">
              <div>
                <div className="tk-card-title">Needs Attention</div>
                <div className="tk-card-sub">Below 75% this month</div>
              </div>
            </div>
            <div className="tk-card-body">
              {[worstHabitIdx, ...habitPct
                .map((p, i) => ({ p, i }))
                .filter((x) => x.p < 80 && x.i !== worstHabitIdx)
                .slice(0, 2)
                .map((x) => x.i),
              ].map((idx) => (
                <div key={idx} className="tk-attn-item">
                  <div className="tk-row" style={{ gap: 10 }}>
                    <span className="tk-row-dot" />
                    <span style={{ fontSize: 13 }}>{HABITS[idx].name}</span>
                  </div>
                  <span className="tk-attn-pct">{habitPct[idx]}%</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="tk-bottomnav" aria-label="Primary">
        <span className="tk-nav-item">
          <Icon d={I.home} size={14} /> Home
        </span>
        <span className="tk-nav-item">
          <Icon d={I.canvas} size={14} /> Brain Canvas
        </span>
        <span className="tk-nav-item">
          <Icon d={I.folder} size={14} /> Projects
        </span>
        <span className="tk-nav-item is-active">
          <Icon d={I.bar} size={14} /> Tracker
        </span>
        <span className="tk-nav-item">
          <Icon d={I.book} size={14} /> Journal
        </span>
      </nav>
    </div>
  );
}
