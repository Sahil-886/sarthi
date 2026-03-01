import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
const LEVEL_COLORS = [
    { from: '#6366f1', to: '#8b5cf6' }, // 1–4: indigo → violet
    { from: '#3b82f6', to: '#06b6d4' }, // 5–9: blue → cyan
    { from: '#f59e0b', to: '#ef4444' }, // 10–14: amber → red
    { from: '#10b981', to: '#059669' }, // 15–19: emerald
    { from: '#f97316', to: '#dc2626' }, // 20+: fire
];
function getLevelColor(level) {
    if (level >= 20)
        return LEVEL_COLORS[4];
    if (level >= 15)
        return LEVEL_COLORS[3];
    if (level >= 10)
        return LEVEL_COLORS[2];
    if (level >= 5)
        return LEVEL_COLORS[1];
    return LEVEL_COLORS[0];
}
function getLevelEmoji(level) {
    if (level >= 20)
        return '👑';
    if (level >= 15)
        return '🌟';
    if (level >= 10)
        return '⚔️';
    if (level >= 5)
        return '🚀';
    return '🌱';
}
function CircularProgress({ percent, level, color }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;
    return (_jsxs("div", { className: "relative w-28 h-28 shrink-0", children: [_jsxs("svg", { width: "112", height: "112", viewBox: "0 0 112 112", className: "-rotate-90", children: [_jsx("circle", { cx: "56", cy: "56", r: r, fill: "none", stroke: "#f1f5f9", strokeWidth: "10" }), _jsx(motion.circle, { cx: "56", cy: "56", r: r, fill: "none", strokeWidth: "10", stroke: `url(#grad-${level})`, strokeLinecap: "round", strokeDasharray: circ, initial: { strokeDashoffset: circ }, animate: { strokeDashoffset: circ - dash }, transition: { duration: 1.2, ease: 'easeOut' } }), _jsx("defs", { children: _jsxs("linearGradient", { id: `grad-${level}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: color.from }), _jsx("stop", { offset: "100%", stopColor: color.to })] }) })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-xl font-black text-stone-800", children: level }), _jsx("span", { className: "text-xs text-stone-400 font-bold -mt-0.5", children: "LVL" })] })] }));
}
export default function LevelCard() {
    const [xp, setXP] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBadges, setShowBadges] = useState(false);
    useEffect(() => {
        client.getXP()
            .then(setXP)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsxs("div", { className: "bg-white rounded-2xl border border-indigo-100 p-5 animate-pulse", children: [_jsx("div", { className: "h-4 w-32 bg-indigo-100 rounded mb-3" }), _jsx("div", { className: "h-8 w-20 bg-indigo-100 rounded" })] }));
    }
    if (!xp)
        return null;
    const color = getLevelColor(xp.current_level);
    const pct = xp.xp_needed_this_level > 0
        ? Math.min(100, Math.round((xp.xp_this_level / xp.xp_needed_this_level) * 100))
        : 100;
    const emoji = getLevelEmoji(xp.current_level);
    return (_jsx(motion.div, { className: "relative rounded-2xl overflow-hidden border border-indigo-100 shadow-sm", style: { background: 'linear-gradient(135deg, #f8faff, #f0f4ff)' }, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, children: _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-stone-800 text-base leading-none", children: "Level & XP" }), _jsx("p", { className: "text-xs text-stone-400 mt-0.5", children: "Keep engaging to level up" })] }), _jsx("button", { onClick: () => setShowBadges(b => !b), className: "text-xs text-indigo-500 font-semibold hover:text-indigo-700 transition", children: showBadges ? 'Hide' : '🏅 Badges' })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(CircularProgress, { percent: pct, level: xp.current_level, color: color }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xl", children: emoji }), _jsx("span", { className: "font-bold text-stone-800 text-base", children: xp.level_title })] }), _jsxs("p", { className: "text-xs text-stone-500 mb-3", children: [xp.total_xp, " total XP earned"] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-stone-400 mb-1", children: [_jsxs("span", { children: [xp.xp_this_level, " XP"] }), _jsxs("span", { children: [xp.xp_needed_this_level, " XP to Lvl ", xp.current_level + 1] })] }), _jsx("div", { className: "h-2 bg-indigo-100 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full rounded-full", style: { background: `linear-gradient(90deg, ${color.from}, ${color.to})` }, initial: { width: 0 }, animate: { width: `${pct}%` }, transition: { duration: 1, ease: 'easeOut' } }) })] })] })] }), _jsx("div", { className: "mt-4 grid grid-cols-3 gap-2", children: [
                        { icon: '🎮', label: 'Game', pts: '+20 XP' },
                        { icon: '🤖', label: 'AI Chat', pts: '+15 XP' },
                        { icon: '✅', label: 'Habit', pts: '+10 XP' },
                    ].map(r => (_jsxs("div", { className: "bg-white rounded-xl p-2 text-center border border-indigo-50", children: [_jsx("div", { className: "text-base", children: r.icon }), _jsx("div", { className: "text-xs text-stone-500 font-medium leading-tight", children: r.label }), _jsx("div", { className: "text-xs font-bold text-indigo-500", children: r.pts })] }, r.label))) }), _jsx(AnimatePresence, { children: showBadges && (_jsxs(motion.div, { className: "mt-4 pt-4 border-t border-indigo-100", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, children: [_jsx("p", { className: "text-xs font-bold text-stone-500 uppercase tracking-wider mb-2", children: "Earned Badges" }), xp.badges.length === 0 ? (_jsx("p", { className: "text-xs text-stone-400", children: "Play games and chat with AI to earn badges!" })) : (_jsx("div", { className: "flex flex-wrap gap-2", children: xp.badges.map(b => (_jsxs("div", { className: "flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2.5 py-1.5 border border-indigo-100", title: b.description, children: [_jsx("span", { children: b.icon }), _jsx("span", { className: "text-xs font-semibold text-indigo-700", children: b.name })] }, b.key))) }))] })) })] }) }));
}
