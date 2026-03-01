import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';

interface Habit {
    habit_id: number;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    is_completed: boolean;
    completed_at: string | null;
}

interface XPPopup { id: number; xp: number; x: number; y: number }

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<number | null>(null);
    const [popups, setPopups] = useState<XPPopup[]>([]);

    const fetchHabits = useCallback(async () => {
        try {
            const data = await client.getHabitsToday();
            setHabits(data.habits || []);
            setCompletedCount(data.completed_count || 0);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    const handleComplete = async (habit: Habit, e: React.MouseEvent) => {
        if (habit.is_completed || completing === habit.habit_id) return;
        setCompleting(habit.habit_id);

        // Spawn XP popup at click position
        const newId = Date.now();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPopups(p => [...p, { id: newId, xp: habit.xp_reward, x: rect.left + rect.width / 2, y: rect.top }]);
        setTimeout(() => setPopups(p => p.filter(x => x.id !== newId)), 1800);

        try {
            await client.completeHabit(habit.habit_id);
            setHabits(h => h.map(x => x.habit_id === habit.habit_id ? { ...x, is_completed: true } : x));
            setCompletedCount(c => c + 1);
        } catch { }
        finally { setCompleting(null); }
    };

    const total = habits.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return (
        <motion.div
            className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
            {/* XP Popups — fixed to viewport */}
            <AnimatePresence>
                {popups.map(p => (
                    <motion.div
                        key={p.id}
                        className="fixed pointer-events-none z-50 font-black text-emerald-500 text-lg"
                        style={{ left: p.x, top: p.y, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -60 }} exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        +{p.xp} XP ✨
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-bold text-stone-800 text-base leading-none">Daily Habits</h3>
                        <p className="text-xs text-stone-400 mt-0.5">Small steps, big change</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">{completedCount}/{total} done</p>
                        <p className="text-xs text-stone-400">{pct}% complete</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Habit list */}
            <div className="px-3 pb-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50" />
                            <div className="flex-1">
                                <div className="h-3 w-24 bg-stone-100 rounded mb-1" />
                                <div className="h-2.5 w-36 bg-stone-100 rounded" />
                            </div>
                            <div className="w-16 h-7 rounded-lg bg-emerald-50" />
                        </div>
                    ))
                ) : (
                    habits.map((habit, i) => (
                        <motion.div
                            key={habit.habit_id}
                            className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all ${habit.is_completed ? 'opacity-60' : 'hover:bg-emerald-50/60'}`}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${habit.is_completed ? 'bg-emerald-100' : 'bg-stone-50 border border-stone-100'}`}>
                                {habit.is_completed ? '✅' : habit.icon}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight ${habit.is_completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                                    {habit.name}
                                </p>
                                <p className="text-xs text-stone-400 truncate">{habit.description}</p>
                            </div>

                            {/* Action */}
                            {habit.is_completed ? (
                                <div className="shrink-0 text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    ✓ Done
                                </div>
                            ) : (
                                <motion.button
                                    onClick={(e) => handleComplete(habit, e)}
                                    disabled={completing === habit.habit_id}
                                    className="shrink-0 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                                    whileTap={{ scale: 0.94 }}
                                >
                                    {completing === habit.habit_id ? '…' : `+${habit.xp_reward} XP`}
                                </motion.button>
                            )}
                        </motion.div>
                    ))
                )}

                {/* All done celebration */}
                {!loading && pct === 100 && (
                    <motion.div
                        className="mt-2 mx-2 text-center py-3 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    >
                        <p className="text-sm font-bold text-emerald-700">🎉 All habits done for today!</p>
                        <p className="text-xs text-emerald-600 mt-0.5">You earned {total * 10} XP — amazing work!</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
