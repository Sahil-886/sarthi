import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
export default function AnomalyBadge({ isAnomaly, severity, message, zScore }) {
    if (!isAnomaly || severity === 'none')
        return null;
    const configs = {
        spike_high: {
            icon: '⚠️',
            bg: 'bg-red-50',
            border: 'border-red-200',
            title: 'Stress Spike Detected',
            titleColor: 'text-red-700',
            textColor: 'text-red-600',
        },
        spike_low: {
            icon: '🎉',
            bg: 'bg-green-50',
            border: 'border-green-200',
            title: 'Big Improvement!',
            titleColor: 'text-green-700',
            textColor: 'text-green-600',
        },
        moderate: {
            icon: '📊',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            title: 'Pattern Change',
            titleColor: 'text-amber-700',
            textColor: 'text-amber-600',
        },
    };
    const cfg = configs[severity] || configs.moderate;
    return (_jsx(AnimatePresence, { children: _jsxs(motion.div, { initial: { opacity: 0, y: -8, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8 }, transition: { type: 'spring', stiffness: 300, damping: 24 }, className: `rounded-2xl border ${cfg.bg} ${cfg.border} p-4 flex items-start gap-3`, children: [_jsx("span", { className: "text-2xl flex-shrink-0", children: cfg.icon }), _jsxs("div", { children: [_jsx("p", { className: `font-bold text-sm ${cfg.titleColor}`, children: cfg.title }), _jsx("p", { className: `text-sm mt-0.5 ${cfg.textColor}`, children: message }), zScore !== undefined && Math.abs(zScore) > 0.1 && (_jsxs("p", { className: "text-xs text-stone-400 mt-1", children: ["Z-score: ", zScore > 0 ? '+' : '', zScore.toFixed(2), " \u03C3 from your average"] }))] })] }) }));
}
