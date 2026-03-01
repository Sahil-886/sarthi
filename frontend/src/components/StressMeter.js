import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export default function StressMeter({ stressScore, label = true, size = 'md' }) {
    const score = Math.max(0, Math.min(100, stressScore));
    const getColor = () => {
        if (score <= 40)
            return { bar: '#10b981', bg: '#d1fae5', text: '#065f46', level: 'Low' };
        if (score <= 70)
            return { bar: '#f59e0b', bg: '#fef3c7', text: '#92400e', level: 'Moderate' };
        return { bar: '#ef4444', bg: '#fee2e2', text: '#991b1b', level: 'High' };
    };
    const colors = getColor();
    const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };
    return (_jsxs("div", { className: "w-full", children: [label && (_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-600", children: "Stress Level" }), _jsx("span", { className: "text-sm font-bold px-3 py-0.5 rounded-full", style: { backgroundColor: colors.bg, color: colors.text }, children: colors.level })] })), _jsx("div", { className: `w-full bg-gray-100 rounded-full overflow-hidden ${heights[size]}`, children: _jsx(motion.div, { className: `${heights[size]} rounded-full`, style: { backgroundColor: colors.bar }, initial: { width: 0 }, animate: { width: `${score}%` }, transition: { duration: 1, ease: 'easeOut' } }) }), label && (_jsxs("div", { className: "flex justify-between mt-1 text-xs text-gray-400", children: [_jsx("span", { children: "0" }), _jsxs("span", { className: "font-semibold", style: { color: colors.bar }, children: [Math.round(score), "/100"] }), _jsx("span", { children: "100" })] }))] }));
}
