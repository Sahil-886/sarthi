import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
const MILESTONES = [
    { days: 3, label: '3-Day Starter', emoji: '🌱' },
    { days: 7, label: '7-Day Warrior', emoji: '⚡' },
    { days: 14, label: '14-Day Champion', emoji: '🏆' },
    { days: 30, label: '30-Day Legend', emoji: '👑' },
];
function FlameIcon({ size = 48, animate = false }) {
    return (_jsx(motion.div, { style: { fontSize: size, lineHeight: 1, display: 'inline-block', transformOrigin: 'bottom center' }, animate: animate ? { scale: [1, 1.12, 0.95, 1.08, 1], rotate: [-3, 3, -2, 2, 0] } : {}, transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }, children: "\uD83D\uDD25" }));
}
function motivationalText(n) {
    if (n === 0)
        return "Start your streak today! 🌟";
    if (n === 1)
        return "Great start — come back tomorrow! 💪";
    if (n < 4)
        return `You're on a ${n}-day streak! Keep going 🔥`;
    if (n < 8)
        return `${n} days strong — you're building a habit! 🚀`;
    if (n < 15)
        return `${n} days! You're on fire! 🏆`;
    if (n < 30)
        return `Incredible — ${n} days of self-care! 🌟`;
    return `${n} days! You are a Sarthi legend! 👑`;
}
export default function StreakCard() {
    const [streak, setStreak] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBadges, setShowBadges] = useState(false);
    const prevStreak = useRef(0);
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
            }
            catch (e) {
                console.error('Failed to load streak', e);
            }
            finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);
    if (loading) {
        return (_jsxs("div", { className: "bg-white rounded-2xl border border-orange-100 p-5 animate-pulse", children: [_jsx("div", { className: "h-4 bg-orange-100 rounded w-1/2 mb-3" }), _jsx("div", { className: "h-10 bg-orange-100 rounded w-1/3" })] }));
    }
    if (!streak)
        return null;
    const current = streak.current_streak;
    const earnedMilestones = MILESTONES.filter(m => streak.longest_streak >= m.days);
    const nextMilestone = MILESTONES.find(m => m.days > current);
    const daysToNext = nextMilestone ? nextMilestone.days - current : null;
    return (_jsxs(motion.div, { className: "relative overflow-hidden rounded-2xl border border-orange-100 shadow-sm", style: { background: 'linear-gradient(135deg, #fff7ed, #fef3c7)' }, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, children: [_jsx(AnimatePresence, { children: justIncreased && (_jsx(motion.div, { className: "absolute inset-0 rounded-2xl pointer-events-none", style: { background: 'radial-gradient(circle, rgba(251,146,60,0.25), transparent 70%)' }, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.5 } })) }), _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FlameIcon, { size: 28, animate: current > 0 }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-stone-800 text-base leading-none", children: "Daily Streak" }), _jsx("p", { className: "text-xs text-stone-400 mt-0.5", children: "Keep showing up every day" })] })] }), _jsx("button", { onClick: () => setShowBadges(b => !b), className: "text-xs text-orange-500 font-semibold hover:text-orange-700 transition", children: showBadges ? 'Hide' : '🏅 Badges' })] }), _jsxs("div", { className: "flex items-end gap-3 mb-3", children: [_jsx(motion.div, { className: "text-5xl font-black leading-none", style: { background: 'linear-gradient(135deg, #ea580c, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 300, damping: 20 }, children: current }, current), _jsxs("div", { className: "pb-1", children: [_jsx("p", { className: "text-sm font-semibold text-stone-600 leading-tight", children: "days" }), _jsx("p", { className: "text-xs text-stone-400", children: "in a row" })] }), _jsxs("div", { className: "ml-auto pb-1 text-right", children: [_jsx("p", { className: "text-xs text-stone-400", children: "Best streak" }), _jsxs("p", { className: "text-sm font-bold text-amber-600", children: ["\uD83C\uDFC6 ", streak.longest_streak, " days"] })] })] }), _jsx("p", { className: "text-sm text-stone-600 font-medium mb-3", children: motivationalText(current) }), nextMilestone && (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-stone-400 mb-1", children: [_jsxs("span", { children: ["Next: ", nextMilestone.emoji, " ", nextMilestone.label] }), _jsxs("span", { children: [daysToNext, " day", daysToNext !== 1 ? 's' : '', " away"] })] }), _jsx("div", { className: "h-2 bg-orange-100 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full rounded-full", style: { background: 'linear-gradient(90deg, #f97316, #f59e0b)' }, initial: { width: 0 }, animate: { width: `${Math.min((current / nextMilestone.days) * 100, 100)}%` }, transition: { duration: 0.8, ease: 'easeOut' } }) })] })), _jsxs("p", { className: "text-xs text-stone-400 mt-3 text-right", children: [streak.total_days_active, " total active days"] }), _jsx(AnimatePresence, { children: showBadges && (_jsxs(motion.div, { className: "mt-4 pt-4 border-t border-orange-100", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.25 }, children: [_jsx("p", { className: "text-xs font-bold text-stone-500 uppercase tracking-wider mb-3", children: "Milestone Badges" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: MILESTONES.map(m => {
                                        const earned = streak.longest_streak >= m.days;
                                        return (_jsxs("div", { className: `rounded-xl p-2 text-center transition ${earned ? 'bg-orange-100' : 'bg-stone-100 opacity-40'}`, title: earned ? `Earned — ${m.label}` : `Reach ${m.days} days to unlock`, children: [_jsx("div", { className: "text-2xl", children: m.emoji }), _jsxs("div", { className: "text-xs font-semibold text-stone-600 mt-1 leading-tight", children: [m.days, "d"] }), earned && _jsx("div", { className: "text-xs text-orange-500 font-bold", children: "\u2713" })] }, m.days));
                                    }) }), earnedMilestones.length === 0 && (_jsx("p", { className: "text-xs text-stone-400 text-center mt-2", children: "Play games or chat daily to earn badges!" }))] })) })] })] }));
}
