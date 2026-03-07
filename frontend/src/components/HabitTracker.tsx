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
interface Particle { id: number; x: number; y: number; color: string; size: number; velocityX: number; velocityY: number }

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffd700', '#ff69b4', '#00ced1'];

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<number | null>(null);
    const [popups, setPopups] = useState<XPPopup[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);

    const fetchHabits = useCallback(async () => {
        try {
            const data = await client.getHabitsToday();
            setHabits(data.habits || []);
            setCompletedCount(data.completed_count || 0);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHabits(); }, [fetchHabits]);

    const spawnConfetti = (x: number, y: number) => {
        const newParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
            id: Date.now() + i,
            x,
            y,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4,
            velocityX: (Math.random() - 0.5) * 12,
            velocityY: (Math.random() - 0.8) * 15,
        }));
        setParticles(p => [...p, ...newParticles]);
        setTimeout(() => setParticles(p => p.filter(pt => !newParticles.find(n => n.id === pt.id))), 2000);
    };

    const handleComplete = async (habit: Habit, e: React.MouseEvent) => {
        if (habit.is_completed || completing === habit.habit_id) return;
        setCompleting(habit.habit_id);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Spawn XP popup
        const newId = Date.now();
        setPopups(p => [...p, { id: newId, xp: habit.xp_reward, x: centerX, y: rect.top }]);
        setTimeout(() => setPopups(p => p.filter(x => x.id !== newId)), 1800);

        // Spawn Confetti
        spawnConfetti(centerX, centerY);

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
            {/* Particle Layer */}
            <div className="fixed inset-0 pointer-events-none z-[60]">
                <AnimatePresence>
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            className="absolute rounded-full"
                            style={{
                                left: p.x,
                                top: p.y,
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                boxShadow: `0 0 10px ${p.color}44`
                            }}
                            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                            animate={{
                                x: p.velocityX * 15,
                                y: p.velocityY * 15 + 100,
                                scale: 0,
                                opacity: 0,
                                rotate: 360
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* XP Popups */}
            <AnimatePresence>
                {popups.map(p => (
                    <motion.div
                        key={p.id}
                        className="fixed pointer-events-none z-50 font-black text-emerald-500 text-xl drop-shadow-md"
                        style={{ left: p.x, top: p.y, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0, y: 20, scale: 0.5 }}
                        animate={{ opacity: 1, y: -80, scale: 1.5 }}
                        exit={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 1.2, type: "spring" }}
                    >
                        +{p.xp} XP ✨
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 bg-gradient-to-b from-stone-50/50 to-transparent">
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
                <div className="h-2.5 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100 shadow-inner">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'circOut' }}
                    />
                </div>
            </div>

            {/* Habit list */}
            <div className="px-3 pb-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 px-2 py-3">
                            <div className="w-10 h-10 skeleton" />
                            <div className="flex-1">
                                <div className="h-4 w-24 skeleton mb-2" />
                                <div className="h-3 w-40 skeleton" />
                            </div>
                        </div>
                    ))
                ) : (
                    habits.map((habit, i) => (
                        <motion.div
                            key={habit.habit_id}
                            className={`flex items-center gap-3 px-2 py-3 rounded-2xl transition-all ${habit.is_completed ? 'bg-emerald-50/20 opacity-70' : 'hover:bg-emerald-50/60'}`}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {/* Icon */}
                            <motion.div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all ${habit.is_completed ? 'bg-emerald-100' : 'bg-white border border-stone-100 shadow-sm'}`}
                                whileHover={!habit.is_completed ? { scale: 1.1, rotate: 5 } : {}}
                            >
                                {habit.is_completed ? '✅' : habit.icon}
                            </motion.div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold leading-tight ${habit.is_completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                                    {habit.name}
                                </p>
                                <p className="text-[11px] text-stone-400 truncate mt-0.5">{habit.description}</p>
                            </div>

                            {/* Action */}
                            {habit.is_completed ? (
                                <motion.div
                                    className="shrink-0 text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-100 px-3 py-1.5 rounded-xl shadow-sm border border-emerald-200"
                                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                >
                                    ✓ Done
                                </motion.div>
                            ) : (
                                <motion.button
                                    onClick={(e) => handleComplete(habit, e)}
                                    disabled={completing === habit.habit_id}
                                    className="shrink-0 text-[11px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-3.5 py-2 rounded-xl transition shadow-md disabled:opacity-60 uppercase tracking-tighter"
                                    whileHover={{ scale: 1.05, y: -1 }}
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
                        className="mt-3 mx-2 text-center py-4 rounded-2xl border border-emerald-200 shadow-lg relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    >
                        <div className="absolute inset-0 opacity-10 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        <p className="text-sm font-black text-emerald-800 relative z-10">🎉 ALL HABITS COMPLETE!</p>
                        <p className="text-xs text-emerald-600 mt-1 font-bold relative z-10">You earned {total * 10} XP — amazing dedication!</p>
                        <motion.div
                            className="text-2xl mt-1"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            🏆
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
