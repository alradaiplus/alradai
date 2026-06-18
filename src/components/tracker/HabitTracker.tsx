'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/core/supabase';

export interface Habit {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  color: string;
  createdAt: number;
  completions: Record<string, boolean>; // YYYY-MM-DD -> boolean
}

interface HabitTrackerProps {
  workspaceId: string;
}

export function HabitTracker({ workspaceId }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, completed: 0, streak: 0 });

  useEffect(() => {
    loadHabits();
  }, [workspaceId]);

  const loadHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (!error && data) {
      setHabits(data.map(h => ({
        ...h,
        completions: h.completions || {},
        createdAt: new Date(h.created_at).getTime(),
      })));
      calculateStats(data);
    }
  };

  const calculateStats = (habitList: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    let completed = 0;
    let total = habitList.length;
    let streak = 0;

    for (const habit of habitList) {
      if (habit.completions?.[today]) {
        completed++;
      }

      // Calculate streak
      let currentStreak = 0;
      let checkDate = new Date();
      while (currentStreak < 365) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (habit.completions?.[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      streak = Math.max(streak, currentStreak);
    }

    setStats({ total, completed, streak });
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;

    const habit: Habit = {
      id: `habit_${Date.now()}`,
      workspaceId,
      name: newHabitName,
      frequency: 'daily',
      color: '#3b82f6',
      createdAt: Date.now(),
      completions: {},
    };

    const { error } = await supabase
      .from('habits')
      .insert([{
        id: habit.id,
        workspace_id: workspaceId,
        name: habit.name,
        frequency: habit.frequency,
        color: habit.color,
        created_at: new Date().toISOString(),
        completions: habit.completions,
      }]);

    if (!error) {
      setHabits([...habits, habit]);
      setNewHabitName('');
    }
  };

  const toggleCompletion = async (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompletions = {
      ...habit.completions,
      [date]: !habit.completions[date],
    };

    const { error } = await supabase
      .from('habits')
      .update({ completions: newCompletions })
      .eq('id', habitId);

    if (!error) {
      const updatedHabits = habits.map(h =>
        h.id === habitId ? { ...h, completions: newCompletions } : h
      );
      setHabits(updatedHabits);
      calculateStats(updatedHabits);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthDays = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);
  const days = Array.from({ length: monthDays }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4">
          <div className="text-sm text-slate-300">Total Habits</div>
          <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
        </div>
        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4">
          <div className="text-sm text-slate-300">Completed Today</div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}/{stats.total}</div>
        </div>
        <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4">
          <div className="text-sm text-slate-300">Current Streak</div>
          <div className="text-3xl font-bold text-purple-400">{stats.streak} days</div>
        </div>
      </div>

      {/* Add Habit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addHabit()}
          placeholder="Add a new habit..."
          className="flex-1 px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-500 outline-none transition"
        />
        <button
          onClick={addHabit}
          className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Add
        </button>
      </div>

      {/* Calendar Grid */}
      {habits.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition"
              >
                →
              </button>
            </div>
          </div>

          {habits.map(habit => (
            <div key={habit.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h4 className="font-semibold mb-3">{habit.name}</h4>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs text-slate-400 font-semibold py-1">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {days.map(day => {
                  const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isCompleted = habit.completions[dateStr];
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <button
                      key={day}
                      onClick={() => toggleCompletion(habit.id, dateStr)}
                      className={`aspect-square rounded text-sm font-semibold transition ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isToday
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {habits.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>No habits yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
