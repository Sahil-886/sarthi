import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import StressTrajectoryChart from '../components/StressTrajectoryChart';
import PerformanceRadarChart from '../components/PerformanceRadarChart';
import AnomalyBadge from '../components/AnomalyBadge';
const GAME_LABELS = {
    reaction_speed: 'Reaction Speed',
    memory_pattern: 'Memory Pattern',
    focus_tracking: 'Focus Tracking',
    emotional_recognition: 'Emotion Recognition',
    decision_making: 'Decision Making',
    persistence_challenge: 'Persistence',
};
const GAME_ICONS = {
    reaction_speed: '⚡', memory_pattern: '🧩', focus_tracking: '🎯',
    emotional_recognition: '🎭', decision_making: '🧠', persistence_challenge: '🔥',
};
const LEVEL_COLORS = {
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-500' },
    moderate: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500' },
    high: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500' },
};
export default function ViewScore() {
    const navigate = useNavigate();
    const [stressMetrics, setStressMetrics] = useState(null);
    const [gameStats, setGameStats] = useState(null);
    const [stressHistory, setStressHistory] = useState([]);
    const [radarScores, setRadarScores] = useState(null);
    const [anomaly, setAnomaly] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    useEffect(() => {
        const load = async () => {
            try {
                const [analyticsRes, historyRes] = await Promise.all([
                    api.getStressAnalytics().catch(() => null),
                    api.getStressHistory(30).catch(() => ({ history: [] })),
                ]);
                if (analyticsRes) {
                    setStressMetrics(analyticsRes.stress_metrics);
                    setGameStats(analyticsRes.game_statistics);
                    // Use radar sub-scores if available, otherwise leave null
                    if (analyticsRes.radar) {
                        setRadarScores(analyticsRes.radar);
                    }
                }
                setStressHistory(historyRes?.history || []);
                // Check anomaly
                try {
                    const token = localStorage.getItem('token') || '';
                    const anomalyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/ml/anomaly-check?token=${token}`);
                    if (anomalyRes.ok)
                        setAnomaly(await anomalyRes.json());
                }
                catch { }
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    const handleClearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear all your stress and game history? This cannot be undone."))
            return;
        try {
            setClearing(true);
            await api.clearHistory();
            setStressHistory([]);
            setGameStats(null);
            setStressMetrics(null);
            setAnomaly(null);
        }
        catch (e) {
            alert("Failed to clear history. Please try again.");
        }
        finally {
            setClearing(false);
        }
    };
    // Build chart data from history
    const chartData = useMemo(() => stressHistory.slice().reverse().map((log, i) => ({
        session: i + 1,
        stress_score: log.stress_score,
        label: log.stress_level,
    })), [stressHistory]);
    // Build radar from cognitive dimension scores (focus/memory/decision/emotion)
    const radarData = useMemo(() => {
        if (radarScores) {
            return [
                { game: 'Focus', score: radarScores.focus },
                { game: 'Memory', score: radarScores.memory },
                { game: 'Decision', score: radarScores.decision },
                { game: 'Emotion', score: radarScores.emotion },
            ];
        }
        // Fallback: build from game stats avg scores
        return Object.entries(gameStats || {}).map(([game, stats]) => ({
            game,
            score: stats.avg_score,
        }));
    }, [radarScores, gameStats]);
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'games', label: 'Game Stats', icon: '🎮' },
        { id: 'history', label: 'History', icon: '📅' },
    ];
    return (_jsx("div", { className: "min-h-screen bg-amber-50 py-10 px-4", children: _jsxs(motion.div, { className: "max-w-4xl mx-auto", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-black text-stone-800", children: "Your Progress" }), _jsx("p", { className: "text-stone-600 mt-1", children: "ML-powered cognitive & stress analytics" })] }), _jsx(motion.button, { onClick: () => navigate('/dashboard'), className: "px-5 py-2.5 bg-white border border-amber-200 text-stone-700 rounded-xl font-medium text-sm hover:bg-amber-50 transition", whileTap: { scale: 0.96 }, children: "\u2190 Dashboard" })] }), anomaly && (_jsx("div", { className: "mb-6", children: _jsx(AnomalyBadge, { isAnomaly: anomaly.is_anomaly, severity: anomaly.severity, message: anomaly.message, zScore: anomaly.z_score }) })), loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-20", children: [_jsx(motion.div, { className: "w-12 h-12 border-4 border-amber-300 border-t-amber-500 rounded-full", animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 0.8, ease: 'linear' } }), _jsx("p", { className: "text-stone-500 mt-4 text-sm font-medium", children: "Loading your analytics\u2026" })] })) : (_jsxs("div", { className: "space-y-6", children: [stressMetrics && (_jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                                { label: 'Average Stress', value: stressMetrics.average, suffix: '/100', color: '#f59e0b' },
                                { label: 'Peak Stress', value: stressMetrics.maximum, suffix: '/100', color: '#ef4444' },
                                { label: 'Best Session', value: stressMetrics.minimum, suffix: '/100', color: '#10b981' },
                            ].map((m) => (_jsxs(motion.div, { className: "bg-white rounded-2xl border border-amber-100 p-5", initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, whileHover: { y: -3 }, children: [_jsx("p", { className: "text-xs font-bold text-stone-500 uppercase tracking-wide mb-2", children: m.label }), _jsx("p", { className: "text-3xl font-black", style: { color: m.color }, children: m.value.toFixed(0) }), _jsx("p", { className: "text-xs font-medium text-stone-500", children: m.suffix })] }, m.label))) })), _jsx("div", { className: "flex gap-2 p-1 bg-white rounded-2xl border border-amber-100", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-amber-400 text-white shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'}`, children: [tab.icon, " ", tab.label] }, tab.id))) }), activeTab === 'overview' && (_jsxs(motion.div, { className: "space-y-5", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 p-6", children: [_jsx("h2", { className: "text-base font-bold text-stone-800 mb-4", children: "\uD83D\uDCC8 Stress Trajectory" }), _jsx(StressTrajectoryChart, { data: chartData, showCognitive: false }), _jsx("p", { className: "text-xs text-stone-400 mt-2 text-center", children: "Green zone (<40) = low stress \u00B7 Red zone (>70) = high stress" })] }), radarData.length > 0 && (_jsxs("div", { className: "bg-white rounded-2xl border border-amber-100 p-6", children: [_jsx("h2", { className: "text-base font-bold text-stone-800 mb-4", children: "\uD83E\uDDE0 Cognitive Performance Radar" }), _jsx(PerformanceRadarChart, { scores: radarData }), _jsx("p", { className: "text-xs font-medium text-stone-500 mt-2 text-center", children: "Average cognitive score per game type (higher = better)" })] }))] })), activeTab === 'games' && gameStats && (_jsx(_Fragment, { children: Object.keys(gameStats).length === 0 ? (_jsxs("div", { className: "text-center py-12 text-stone-500 bg-white rounded-2xl border border-amber-100", children: [_jsx("p", { className: "text-4xl mb-3", children: "\uD83E\uDDE9" }), _jsx("p", { className: "font-semibold text-stone-700", children: "No game statistics available yet!" }), _jsx("p", { className: "text-sm mt-1", children: "Play the cognitive games to start tracking your individual performance metrics." })] })) : (_jsx(motion.div, { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", initial: { opacity: 0 }, animate: { opacity: 1 }, children: Object.entries(gameStats).map(([gameName, stats]) => (_jsxs(motion.div, { className: "bg-white rounded-2xl border border-amber-100 p-5", whileHover: { y: -3, boxShadow: '0 8px 24px rgba(245,158,11,0.12)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xl", children: GAME_ICONS[gameName] || '🎮' }), _jsx("h3", { className: "font-bold text-stone-800 text-sm", children: GAME_LABELS[gameName] || gameName })] }), _jsx("div", { className: "space-y-2.5", children: [
                                                { label: 'Played', value: stats.count, unit: 'times' },
                                                { label: 'Avg Score', value: stats.avg_score.toFixed(1), unit: '/100' },
                                                { label: 'Best', value: stats.max_score.toFixed(1), unit: '/100' },
                                                { label: 'Lowest', value: stats.min_score.toFixed(1), unit: '/100' },
                                            ].map(({ label, value, unit }) => (_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "font-medium text-stone-500", children: label }), _jsxs("span", { className: "font-semibold text-stone-700", children: [value, " ", _jsx("span", { className: "font-medium text-stone-500 text-xs", children: unit })] })] }, label))) }), _jsx("div", { className: "mt-3 h-1.5 bg-amber-100 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full bg-amber-400 rounded-full", initial: { width: 0 }, animate: { width: `${stats.avg_score}%` }, transition: { delay: 0.3, duration: 0.8, ease: 'easeOut' } }) })] }, gameName))) })) })), activeTab === 'history' && stressHistory.length > 0 && (_jsxs(motion.div, { className: "bg-white rounded-2xl border border-amber-100 overflow-hidden", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsxs("div", { className: "flex items-center justify-between py-4 px-5 border-b border-amber-100 bg-amber-50", children: [_jsx("h3", { className: "font-bold text-stone-800 text-sm", children: "Session Logs" }), _jsx("button", { onClick: handleClearHistory, disabled: clearing, className: "text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50", children: clearing ? 'Clearing...' : '🗑️ Clear History' })] }), _jsxs("div", { className: "grid grid-cols-3 py-3 px-5 border-b border-amber-100 bg-amber-50/50", children: [_jsx("span", { className: "text-xs font-bold text-stone-600 uppercase tracking-wide", children: "Date" }), _jsx("span", { className: "text-xs font-bold text-stone-600 uppercase tracking-wide text-center", children: "Score" }), _jsx("span", { className: "text-xs font-bold text-stone-600 uppercase tracking-wide text-right", children: "Level" })] }), _jsx("div", { className: "divide-y divide-amber-50 max-h-[420px] overflow-y-auto", children: stressHistory.map((log, idx) => {
                                        const cc = LEVEL_COLORS[log.stress_level] || LEVEL_COLORS.moderate;
                                        return (_jsxs(motion.div, { className: "grid grid-cols-3 py-3 px-5 hover:bg-amber-50/50 transition-colors", initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { delay: idx * 0.02 }, children: [_jsx("span", { className: "text-sm font-medium text-stone-700", children: new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }), _jsxs("span", { className: "text-sm font-bold text-stone-800 text-center", children: [log.stress_score.toFixed(0), "/100"] }), _jsx("div", { className: "flex justify-end", children: _jsx("span", { className: `px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${cc.badge}`, children: log.stress_level }) })] }, idx));
                                    }) })] })), stressHistory.length === 0 && !loading && (_jsxs("div", { className: "text-center py-12 text-stone-400 bg-white rounded-2xl border border-amber-100", children: [_jsx("p", { className: "text-4xl mb-3", children: "\uD83C\uDFAE" }), _jsx("p", { className: "font-semibold", children: "No data yet \u2014 play some games!" }), _jsx("p", { className: "text-sm mt-1", children: "Your analytics will appear here after your first session." }), _jsx(motion.button, { onClick: () => navigate('/games'), className: "mt-4 px-6 py-2.5 bg-amber-400 text-white rounded-xl font-bold text-sm", whileHover: { scale: 1.03 }, children: "Play Now" })] }))] }))] }) }));
}
