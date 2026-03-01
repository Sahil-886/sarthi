import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';

interface StreakData {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string | null;
    total_days_active: number;
}

const MILESTONES = [
    { days: 3, label: '3-Day Starter', emoji: '🌱' },
    { days: 7, label: '7-Day Warrior', emoji: '⚡' },
    { days: 14, label: '14-Day Champion', emoji: '🏆' },
    { days: 30, label: '30-Day Legend', emoji: '👑' },
];

function FlameIcon({ size = 48, animate = false }: { size?: number; animate?: boolean }) {
    return (
        <motion.div
            style={{ fontSize: size, lineHeight: 1, display: 'inline-block', transformOrigin: 'bottom center' }}
            animate={animate ? { scale: [1, 1.12, 0.95, 1.08, 1], rotate: [-3, 3, -2, 2, 0] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
            🔥
        </motion.div>
    );
}

function motivationalText(n: number): string {
    if (n === 0) return "Start your streak today! 🌟";
    if (n === 1) return "Great start — come back tomorrow! 💪";
    if (n < 4) return `You're on a ${n}-day streak! Keep going 🔥`;
    if (n < 8) return `${n} days strong — you're building a habit! 🚀`;
    if (n < 15) return `${n} days! You're on fire! 🏆`;
    if (n < 30) return `Incredible — ${n} days of self-care! 🌟`;
    return `${n} days! You are a Sarthi legend! 👑`;
}

export default function StreakCard() {
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBadges, setShowBadges] = useState(false);
    const prevStreak = useRef<number>(0);
    const [justIncreased, setJustIncreased] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await client.getStreak();
                if (prevStreak.current > 0 && data.current_streak > prevStreak.current) {
                    setJustIncreased(true);
                    setTimeout(() => setJustIncreased(false), 3000);
                }
                prevStreak.current = data.current_streak;
                setStreak(data);
            } catch (e) {
                console.error('Failed to load streak', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-orange-100 p-5 animate-pulse">
                <div className="h-4 bg-orange-100 rounded w-1/2 mb-3" />
                <div className="h-10 bg-orange-100 rounded w-1/3" />
            </div>
        );
    }

    if (!streak) return null;

    const current = streak.current_streak;
    const earnedMilestones = MILESTONES.filter(m => streak.longest_streak >= m.days);
    const nextMilestone = MILESTONES.find(m => m.days > current);
    const daysToNext = nextMilestone ? nextMilestone.days - current : null;

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl border border-orange-100 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Glow when streak just increased */}
            <AnimatePresence>
                {justIncreased && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.25), transparent 70%)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </AnimatePresence>

            <div className="p-5">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FlameIcon size={28} animate={current > 0} />
                        <div>
                            <h3 className="font-bold text-stone-800 text-base leading-none">Daily Streak</h3>
                            <p className="text-xs text-stone-400 mt-0.5">Keep showing up every day</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowBadges(b => !b)}
                        className="text-xs text-orange-500 font-semibold hover:text-orange-700 transition"
                    >
                        {showBadges ? 'Hide' : '🏅 Badges'}
                    </button>
                </div>

                {/* Main streak number */}
                <div className="flex items-end gap-3 mb-3">
                    <motion.div
                        key={current}
                        className="text-5xl font-black leading-none"
                        style={{ background: 'linear-gradient(135deg, #ea580c, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {current}
                    </motion.div>
                    <div className="pb-1">
                        <p className="text-sm font-semibold text-stone-600 leading-tight">days</p>
                        <p className="text-xs text-stone-400">in a row</p>
                    </div>
                    <div className="ml-auto pb-1 text-right">
                        <p className="text-xs text-stone-400">Best streak</p>
                        <p className="text-sm font-bold text-amber-600">🏆 {streak.longest_streak} days</p>
                    </div>
                </div>

                {/* Motivational text */}
                <p className="text-sm text-stone-600 font-medium mb-3">{motivationalText(current)}</p>

                {/* Progress to next milestone */}
                {nextMilestone && (
                    <div>
                        <div className="flex justify-between text-xs text-stone-400 mb-1">
                            <span>Next: {nextMilestone.emoji} {nextMilestone.label}</span>
                            <span>{daysToNext} day{daysToNext !== 1 ? 's' : ''} away</span>
                        </div>
                        <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #f97316, #f59e0b)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((current / nextMilestone.days) * 100, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                )}

                {/* Total days stat */}
                <p className="text-xs text-stone-400 mt-3 text-right">
                    {streak.total_days_active} total active days
                </p>

                {/* Badges panel */}
                <AnimatePresence>
                    {showBadges && (
                        <motion.div
                            className="mt-4 pt-4 border-t border-orange-100"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Milestone Badges</p>
                            <div className="grid grid-cols-4 gap-2">
                                {MILESTONES.map(m => {
                                    const earned = streak.longest_streak >= m.days;
                                    return (
                                        <div
                                            key={m.days}
                                            className={`rounded-xl p-2 text-center transition ${earned ? 'bg-orange-100' : 'bg-stone-100 opacity-40'}`}
                                            title={earned ? `Earned — ${m.label}` : `Reach ${m.days} days to unlock`}
                                        >
                                            <div className="text-2xl">{m.emoji}</div>
                                            <div className="text-xs font-semibold text-stone-600 mt-1 leading-tight">{m.days}d</div>
                                            {earned && <div className="text-xs text-orange-500 font-bold">✓</div>}
                                        </div>
                                    );
                                })}
                            </div>
                            {earnedMilestones.length === 0 && (
                                <p className="text-xs text-stone-400 text-center mt-2">Play games or chat daily to earn badges!</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
