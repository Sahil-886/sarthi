import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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



export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<number | null>(null);

    const fetchHabits = useCallback(async () => {
        try {
            const data = await client.getHabitsToday();
            setHabits(data.habits || []);
            setCompletedCount(data.completed_count || 0);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    const handleComplete = async (habit: Habit) => {
        if (habit.is_completed || completing === habit.habit_id) return;
        setCompleting(habit.habit_id);
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
            className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-stone-800 text-base leading-none">Daily Habits</h3>
                    <p className="text-xs text-stone-400 mt-1">Small steps, big change</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-amber-600">{pct}%</span>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="w-14 h-14 rounded-2xl bg-amber-50 animate-pulse shrink-0" />
                    ))
                ) : (
                    habits.map((habit) => (
                        <motion.button
                            key={habit.habit_id}
                            onClick={() => handleComplete(habit)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all relative ${habit.is_completed
                                ? 'bg-amber-100 ring-2 ring-amber-400'
                                : 'bg-stone-50 border border-stone-100 hover:border-amber-200 hover:bg-amber-50'}`}
                            whileTap={{ scale: 0.9 }}
                            title={habit.name}
                        >
                            {habit.is_completed ? '✨' : habit.icon}
                            {completing === habit.habit_id && (
                                <div className="absolute inset-0 bg-white/40 rounded-2xl flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </motion.button>
                    ))
                )}
            </div>

            {!loading && total > 0 && (
                <div className="mt-4 h-1.5 bg-amber-50 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </motion.div>
    );
}
