import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../api/api';
import StressMeter from '../components/StressMeter';
import StressTrajectoryChart from '../components/StressTrajectoryChart';
import StreakCard from '../components/StreakCard';
import HabitTracker from '../components/HabitTracker';
// ── Daily wellness tips (cycling) ─────────────────────────────────────────────
const TIPS = [
    { emoji: '🧘', tip: 'Take 5 slow deep breaths right now — your nervous system will thank you.' },
    { emoji: '💧', tip: 'Drink a glass of water. Dehydration silently amplifies stress.' },
    { emoji: '🌿', tip: 'Step outside for 10 minutes. Natural light resets your mood clock.' },
    { emoji: '📵', tip: 'Put your phone down for 15 minutes. Presence is a superpower.' },
    { emoji: '😴', tip: "Protect your sleep. Everything feels harder when you're tired." },
    { emoji: '✍️', tip: "Write down 3 things you're grateful for — it rewires your brain." },
    { emoji: '🎵', tip: 'Play your favourite song. Music is instant emotional first aid.' },
];
const MENU_ITEMS = [
    {
        id: 'games', name: 'Cognitive Games',
        description: 'Sharpen focus and measure mental wellbeing through play',
        icon: '🎮', path: '/games',
        gradient: 'from-indigo-500 to-purple-600',
        badge: 'Popular',
        badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
        id: 'ai-companion', name: 'AI Companion',
        description: 'A caring, intelligent friend available anytime you need to talk',
        icon: '🤖', path: '/ai-companion',
        gradient: 'from-blue-400 to-cyan-500',
        badge: 'Always On',
        badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
        id: 'therapy', name: 'Therapy at Home',
        description: 'Guided videos, breathing exercises and curated mental health books',
        icon: '🌿', path: '/therapy',
        gradient: 'from-emerald-400 to-teal-500',
        badge: 'Calming',
        badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
        id: 'score', name: 'View Progress',
        description: 'Track stress trends and celebrate your mental wellness journey',
        icon: '📊', path: '/score',
        gradient: 'from-rose-400 to-orange-500',
        badge: 'Insights',
        badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
        id: 'habits', name: 'Daily Habits',
        description: 'Track small daily steps that lead to big life changes',
        icon: '✅', path: '#habits',
        gradient: 'from-amber-400 to-orange-500',
        badge: 'Habits',
        badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
        id: 'contact', name: 'Contact & Support',
        description: 'Reach Sarthi support or emergency helplines anytime',
        icon: '📞', path: '/contact',
        gradient: 'from-fuchsia-400 to-pink-500',
        badge: '24/7 Help',
        badgeColor: 'bg-fuchsia-100 text-fuchsia-700',
    },
];
function greeting() {
    const h = new Date().getHours();
    if (h < 5)
        return 'Working late';
    if (h < 12)
        return 'Good morning';
    if (h < 17)
        return 'Good afternoon';
    return 'Good evening';
}
function stressEmoji(level) {
    switch (level.toLowerCase()) {
        case 'low': return '😊';
        case 'moderate': return '😐';
        case 'high': return '😰';
        default: return '😶';
    }
}
function stressColor(level) {
    switch (level.toLowerCase()) {
        case 'low': return 'text-emerald-500';
        case 'moderate': return 'text-amber-500';
        case 'high': return 'text-red-500';
        default: return 'text-stone-500';
    }
}
// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useAuth();
    const [stressData, setStressData] = useState(null);
    const [lastGameScore, setLastGameScore] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Cycle through tips based on day of year
    const tip = TIPS[new Date().getDate() % TIPS.length];
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                // Use analytics endpoint as single source of truth
                const [analyticsRes, historyRes] = await Promise.all([
                    api.getAnalytics(),
                    api.getGameHistory(),
                ]);
                if (analyticsRes) {
                    // Use average_stress from analytics as the current stress indicator
                    const score = analyticsRes.average_stress ?? 0;
                    const level = score === 0 ? 'unknown' : score <= 33 ? 'low' : score <= 66 ? 'moderate' : 'high';
                    setStressData({ score, level });
                    // Trajectory for trend chart
                    if (analyticsRes.trajectory?.length) {
                        setTrendData(analyticsRes.trajectory);
                    }
                }
                else {
                    // Fallback: call /scores/current if analytics not available
                    const scoreRes = await api.getStressScore();
                    if (scoreRes?.stress_score !== undefined) {
                        setStressData({ score: scoreRes.stress_score, level: scoreRes.stress_level || 'unknown' });
                    }
                }
                if (historyRes?.history?.length > 0) {
                    setLastGameScore(historyRes.history[0].score);
                }
            }
            catch {
                setError("Couldn't reach the server. Check if the backend is running.");
                setStressData(null);
                setLastGameScore(null);
                setTrendData([]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    return (_jsxs("div", { className: "min-h-screen font-sans text-stone-900 pb-24", style: { background: 'linear-gradient(160deg, #fefce8 0%, #ecfdf5 60%, #fef9f0 100%)' }, children: [_jsx(motion.header, { className: "bg-white/80 backdrop-blur-md border-b border-amber-100 py-4 px-6 sticky top-0 z-20 shadow-sm", initial: { y: -24, opacity: 0 }, animate: { y: 0, opacity: 1 }, children: _jsxs("div", { className: "max-w-6xl mx-auto flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white", children: user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || 'S' }), _jsxs("div", { children: [_jsxs("h1", { className: "text-lg font-bold text-stone-800 leading-tight", children: [greeting(), ", ", user?.firstName || 'Friend', " \uD83D\uDC4B"] }), _jsx("p", { className: "text-stone-400 text-xs", children: "Your mental wellness dashboard" })] })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(motion.button, { onClick: () => navigate('/contact'), className: "flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition", whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 }, children: "\uD83D\uDCDE Support" }), _jsx(motion.button, { onClick: () => navigate('/ai-companion'), className: "hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition", whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 }, children: "\uD83E\uDD16 Chat Now" }), _jsx("button", { onClick: () => signOut({ redirectUrl: '/login' }), className: "px-4 py-2 text-stone-500 bg-stone-100 rounded-xl hover:bg-stone-200 transition font-semibold text-sm", children: "Sign Out" })] })] }) }), _jsxs("div", { className: "max-w-6xl mx-auto pt-8 px-6", children: [_jsx(AnimatePresence, { children: error && (_jsxs(motion.div, { className: "mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "\u26A0\uFE0F" }), _jsx("p", { className: "text-sm font-medium", children: error })] }), _jsx("button", { onClick: () => setError(null), className: "font-bold text-red-400 hover:text-red-700", children: "\u00D7" })] })) }), _jsxs(motion.div, { className: "mb-7 flex items-center gap-4 bg-white/70 border border-amber-100 rounded-2xl px-5 py-4 shadow-sm backdrop-blur-sm", initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 }, children: [_jsx("span", { className: "text-3xl shrink-0", children: tip.emoji }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5", children: "Today's Wellness Tip" }), _jsx("p", { className: "text-stone-700 text-sm font-medium leading-snug", children: tip.tip })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5", children: [_jsxs(motion.div, { className: "lg:col-span-2 bg-white rounded-3xl border border-amber-100 p-7 shadow-sm relative overflow-hidden", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: [_jsx("div", { className: "absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-40 blur-3xl pointer-events-none", style: { background: 'radial-gradient(circle, #fde68a, transparent)' } }), _jsx("p", { className: "text-stone-400 text-xs font-bold uppercase tracking-wider mb-3", children: "Current Stress Level" }), loading ? (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "h-10 w-40 bg-amber-100 rounded-xl animate-pulse" }), _jsx("div", { className: "h-3 w-full bg-amber-100 rounded-full animate-pulse" })] })) : stressData ? (_jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: `text-4xl font-black capitalize mb-3 ${stressColor(stressData.level)}`, children: [stressData.level, " ", stressEmoji(stressData.level)] }), _jsx(StressMeter, { stressScore: stressData.score, size: "lg", label: false }), _jsx("p", { className: "text-xs text-stone-400 mt-2", children: "Based on recent games and interactions" })] }), _jsxs("div", { className: "shrink-0 text-center", children: [_jsx("div", { className: "w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center shadow-inner", children: _jsx("span", { className: "text-4xl font-black text-stone-800", children: Math.round(stressData.score) }) }), _jsx("p", { className: "text-stone-400 text-xs mt-2 font-bold uppercase tracking-wider", children: "/ 100" })] })] })) : (_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-stone-700 mb-2", children: "No data yet" }), _jsx("p", { className: "text-stone-400 text-sm mb-4", children: "Play a game to get your first stress score." }), _jsx(motion.button, { onClick: () => navigate('/games'), className: "px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition", whileTap: { scale: 0.97 }, children: "Start a Game \u2192" })] }))] }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs(motion.div, { className: "flex-1 bg-white rounded-2xl border border-amber-100 p-5 shadow-sm flex flex-col", initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.15 }, children: [_jsx("p", { className: "text-stone-400 text-xs font-bold uppercase tracking-wider mb-2", children: "\uD83C\uDFAE Last Game Score" }), _jsx("div", { className: "flex-1 flex items-center justify-between", children: loading ? (_jsx("div", { className: "h-10 w-16 bg-amber-100 rounded animate-pulse" })) : lastGameScore !== null ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-4xl font-black text-amber-500", children: Math.round(lastGameScore) }), _jsx("span", { className: "text-sm text-stone-400 font-medium", children: "pts" })] })) : (_jsx("span", { className: "text-2xl font-black text-stone-300", children: "\u2014" })) }), _jsx("button", { onClick: () => navigate('/score'), className: "mt-3 text-xs text-amber-600 font-semibold text-right hover:underline", children: "View trend \u2192" })] }), _jsxs(motion.div, { className: "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-md relative overflow-hidden cursor-pointer", initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.2 }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => navigate('/ai-companion'), children: [_jsx("div", { className: "absolute -right-4 -bottom-4 text-6xl opacity-20 pointer-events-none", children: "\uD83E\uDD16" }), _jsx("p", { className: "text-white/70 text-xs font-bold uppercase tracking-wider mb-1", children: "AI Companion" }), _jsx("p", { className: "text-white font-bold text-base leading-tight", children: "Talk to Sarthi" }), _jsx("p", { className: "text-white/70 text-xs mt-1", children: "Available 24/7 for you" }), _jsx("div", { className: "mt-3 inline-flex items-center gap-1 text-white text-xs font-semibold bg-white/20 px-3 py-1 rounded-full", children: "Start Chat \u2192" })] })] })] }), _jsx(motion.div, { className: "mb-5", initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.22 }, children: _jsx(StreakCard, {}) }), _jsxs(motion.div, { className: "bg-white rounded-3xl border border-amber-100 p-7 shadow-sm mb-8", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.28 }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-stone-800 text-base", children: "Stress Trend" }), _jsx("p", { className: "text-stone-400 text-xs mt-0.5", children: "Your mental load over recent sessions" })] }), _jsx("button", { onClick: () => navigate('/score'), className: "text-xs text-amber-600 font-semibold hover:underline", children: "Full Report \u2192" })] }), loading ? (_jsx("div", { className: "h-44 w-full bg-amber-50 rounded-2xl animate-pulse" })) : (_jsx(StressTrajectoryChart, { data: trendData, showCognitive: false }))] }), _jsxs("div", { className: "mb-2", children: [_jsxs(motion.div, { className: "flex items-center gap-3 mb-5", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.32 }, children: [_jsx("h2", { className: "text-xl font-bold text-stone-800", children: "Wellness Tools" }), _jsx("div", { className: "h-px flex-1 bg-stone-200" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-5", children: MENU_ITEMS.map((item, i) => (_jsxs(motion.button, { onClick: () => navigate(item.path), className: "group bg-white rounded-3xl border border-stone-100 p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden", whileTap: { scale: 0.98 }, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.35 + i * 0.08, type: 'spring', stiffness: 200, damping: 22 }, children: [_jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none rounded-3xl` }), _jsx("span", { className: `text-xs font-bold px-2.5 py-0.5 rounded-full mb-4 inline-block ${item.badgeColor}`, children: item.badge }), _jsxs("div", { className: "flex items-start gap-4 relative z-10", children: [_jsx("div", { className: "text-4xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shrink-0", children: item.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-base font-bold text-stone-800 mb-1 group-hover:text-amber-600 transition-colors", children: item.name }), _jsx("p", { className: "text-stone-500 text-sm leading-relaxed", children: item.description })] }), _jsx("div", { className: "shrink-0 w-8 h-8 rounded-full bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors", children: _jsx("span", { className: "text-stone-400 group-hover:text-amber-600 text-sm transition-colors", children: "\u2192" }) })] })] }, item.id))) })] }), _jsxs("div", { id: "habits", className: "mb-2 mt-8", children: [_jsxs(motion.div, { className: "flex items-center gap-3 mb-5", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.55 }, children: [_jsx("h2", { className: "text-xl font-bold text-stone-800", children: "Daily Progress & Habits" }), _jsx("div", { className: "h-px flex-1 bg-stone-200" })] }), _jsx("div", { className: "max-w-2xl mx-auto", children: _jsx(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, children: _jsx(HabitTracker, {}) }) })] }), _jsx(motion.p, { className: "text-center text-stone-400 text-xs mt-10 pb-4", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.7 }, children: "Sarthi is an AI companion for reflection, not a medical service. \uD83D\uDC9B Always seek professional help when needed." })] })] }));
}
