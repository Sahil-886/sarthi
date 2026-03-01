import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, } from 'recharts';
import { motion } from 'framer-motion';
const GAME_LABELS = {
    reaction_speed: 'Reaction',
    memory_pattern: 'Memory',
    focus_tracking: 'Focus',
    emotional_recognition: 'Emotion',
    decision_making: 'Decision',
    persistence_challenge: 'Persistence',
};
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length)
        return null;
    return (_jsxs("div", { className: "bg-white rounded-2xl shadow-lg border border-amber-100 p-3 text-sm", children: [_jsx("p", { className: "font-bold text-stone-700", children: payload[0]?.payload?.game }), _jsxs("p", { className: "text-amber-600 font-medium", children: ["Score: ", payload[0]?.value?.toFixed(0), "/100"] })] }));
};
export default function PerformanceRadarChart({ scores }) {
    if (!scores || scores.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-40 text-stone-400 text-sm", children: "Play all 6 games to see your performance radar!" }));
    }
    const data = scores.map((s) => ({
        game: GAME_LABELS[s.game] || s.game,
        score: Math.round(s.score),
        fullMark: 100,
    }));
    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.3, duration: 0.5 }, className: "w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(RadarChart, { data: data, margin: { top: 10, right: 30, bottom: 10, left: 30 }, children: [_jsx(PolarGrid, { stroke: "#fde68a" }), _jsx(PolarAngleAxis, { dataKey: "game", tick: { fill: '#78716c', fontSize: 12, fontWeight: 600 } }), _jsx(PolarRadiusAxis, { angle: 30, domain: [0, 100], tick: { fill: '#a8a29e', fontSize: 10 }, axisLine: false }), _jsx(Radar, { name: "Cognitive Score", dataKey: "score", stroke: "#f59e0b", fill: "#f59e0b", fillOpacity: 0.25, strokeWidth: 2, dot: { fill: '#d97706', r: 4 }, activeDot: { r: 6, fill: '#d97706' } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Legend, { wrapperStyle: { fontSize: 12, color: '#78716c' } })] }) }) }));
}
