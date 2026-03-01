import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';

interface XPData {
    total_xp: number;
    current_level: number;
    xp_to_next_level: number;
    level_title: string;
    xp_this_level: number;
    xp_needed_this_level: number;
    badges: { key: string; name: string; icon: string; description: string; earned_at: string }[];
}

const LEVEL_COLORS = [
    { from: '#6366f1', to: '#8b5cf6' },  // 1–4: indigo → violet
    { from: '#3b82f6', to: '#06b6d4' },  // 5–9: blue → cyan
    { from: '#f59e0b', to: '#ef4444' },  // 10–14: amber → red
    { from: '#10b981', to: '#059669' },  // 15–19: emerald
    { from: '#f97316', to: '#dc2626' },  // 20+: fire
];

function getLevelColor(level: number) {
    if (level >= 20) return LEVEL_COLORS[4];
    if (level >= 15) return LEVEL_COLORS[3];
    if (level >= 10) return LEVEL_COLORS[2];
    if (level >= 5) return LEVEL_COLORS[1];
    return LEVEL_COLORS[0];
}

function getLevelEmoji(level: number) {
    if (level >= 20) return '👑';
    if (level >= 15) return '🌟';
    if (level >= 10) return '⚔️';
    if (level >= 5) return '🚀';
    return '🌱';
}

function CircularProgress({ percent, level, color }: { percent: number; level: number; color: { from: string; to: string } }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;

    return (
        <div className="relative w-28 h-28 shrink-0">
            <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
                <circle cx="56" cy="56" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <motion.circle
                    cx="56" cy="56" r={r} fill="none" strokeWidth="10"
                    stroke={`url(#grad-${level})`}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                    <linearGradient id={`grad-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color.from} />
                        <stop offset="100%" stopColor={color.to} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-stone-800">{level}</span>
                <span className="text-xs text-stone-400 font-bold -mt-0.5">LVL</span>
            </div>
        </div>
    );
}

export default function LevelCard() {
    const [xp, setXP] = useState<XPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBadges, setShowBadges] = useState(false);

    useEffect(() => {
        client.getXP()
            .then(setXP)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 animate-pulse">
                <div className="h-4 w-32 bg-indigo-100 rounded mb-3" />
                <div className="h-8 w-20 bg-indigo-100 rounded" />
            </div>
        );
    }

    if (!xp) return null;

    const color = getLevelColor(xp.current_level);
    const pct = xp.xp_needed_this_level > 0
        ? Math.min(100, Math.round((xp.xp_this_level / xp.xp_needed_this_level) * 100))
        : 100;
    const emoji = getLevelEmoji(xp.current_level);

    return (
        <motion.div
            className="relative rounded-2xl overflow-hidden border border-indigo-100 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #f8faff, #f0f4ff)' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-stone-800 text-base leading-none">Level & XP</h3>
                        <p className="text-xs text-stone-400 mt-0.5">Keep engaging to level up</p>
                    </div>
                    <button
                        onClick={() => setShowBadges(b => !b)}
                        className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 transition"
                    >
                        {showBadges ? 'Hide' : '🏅 Badges'}
                    </button>
                </div>

                {/* Main row: circular progress + details */}
                <div className="flex items-center gap-4">
                    <CircularProgress percent={pct} level={xp.current_level} color={color} />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{emoji}</span>
                            <span className="font-bold text-stone-800 text-base">{xp.level_title}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-3">{xp.total_xp} total XP earned</p>

                        {/* Linear XP bar */}
                        <div>
                            <div className="flex justify-between text-xs text-stone-400 mb-1">
                                <span>{xp.xp_this_level} XP</span>
                                <span>{xp.xp_needed_this_level} XP to Lvl {xp.current_level + 1}</span>
                            </div>
                            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* XP reward guide */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                        { icon: '🎮', label: 'Game', pts: '+20 XP' },
                        { icon: '🤖', label: 'AI Chat', pts: '+15 XP' },
                        { icon: '✅', label: 'Habit', pts: '+10 XP' },
                    ].map(r => (
                        <div key={r.label} className="bg-white rounded-xl p-2 text-center border border-indigo-50">
                            <div className="text-base">{r.icon}</div>
                            <div className="text-xs text-stone-500 font-medium leading-tight">{r.label}</div>
                            <div className="text-xs font-bold text-indigo-500">{r.pts}</div>
                        </div>
                    ))}
                </div>

                {/* Badges */}
                <AnimatePresence>
                    {showBadges && (
                        <motion.div
                            className="mt-4 pt-4 border-t border-indigo-100"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        >
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Earned Badges</p>
                            {xp.badges.length === 0 ? (
                                <p className="text-xs text-stone-400">Play games and chat with AI to earn badges!</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {xp.badges.map(b => (
                                        <div key={b.key} className="flex items-center gap-1.5 bg-indigo-50 rounded-lg px-2.5 py-1.5 border border-indigo-100" title={b.description}>
                                            <span>{b.icon}</span>
                                            <span className="text-xs font-semibold text-indigo-700">{b.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
