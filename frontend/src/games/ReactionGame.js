import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const ROUNDS = 5;
const MIN_DELAY = 1500;
const MAX_DELAY = 4000;
export default function ReactionGame({ onComplete, onBack }) {
    const [phase, setPhase] = useState('intro');
    const [round, setRound] = useState(0);
    const [reactionTimes, setReactionTimes] = useState([]);
    const [earlyClickCount, setEarlyClickCount] = useState(0);
    const [lastClickedEarly, setLastClickedEarly] = useState(false);
    const [currentReaction, setCurrentReaction] = useState(null);
    const startTimeRef = useRef(0);
    const timerRef = useRef(null);
    const clearTimer = () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
    };
    const startRound = useCallback(() => {
        setLastClickedEarly(false);
        setCurrentReaction(null);
        setPhase('waiting');
        const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
        timerRef.current = setTimeout(() => {
            startTimeRef.current = performance.now();
            setPhase('ready');
        }, delay);
    }, []);
    const handleClick = () => {
        if (phase === 'waiting') {
            clearTimer();
            setLastClickedEarly(true);
            setEarlyClickCount(c => c + 1);
            setPhase('clicked');
            setTimeout(() => startRound(), 1500);
            return;
        }
        if (phase === 'ready') {
            const rt = performance.now() - startTimeRef.current;
            setCurrentReaction(rt);
            const newTimes = [...reactionTimes, rt];
            setReactionTimes(newTimes);
            setPhase('clicked');
            if (round + 1 >= ROUNDS) {
                setTimeout(() => {
                    const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
                    const score = Math.max(0, Math.min(100, 100 - avg / 10));
                    onComplete(Math.round(score), { reactionTime: avg, mistakes: earlyClickCount });
                }, 1000);
            }
            else {
                setTimeout(() => {
                    setRound(r => r + 1);
                    startRound();
                }, 1200);
            }
        }
    };
    useEffect(() => () => clearTimer(), []);
    const avgTime = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
    const circleColor = phase === 'waiting'
        ? '#e9d5ff'
        : phase === 'ready'
            ? '#7c3aed'
            : phase === 'clicked' && !lastClickedEarly
                ? '#10b981'
                : '#ef4444';
    return (_jsx("div", { className: "flex flex-col items-center min-h-screen bg-amber-50 py-10 px-4", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("button", { onClick: onBack, className: "text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1", children: "\u2190 Back" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u26A1 Reaction Speed" }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Round ", Math.min(round + 1, ROUNDS), "/", ROUNDS] })] }), _jsx("div", { className: "w-full bg-purple-100 rounded-full h-2 mb-8", children: _jsx(motion.div, { className: "bg-purple-600 h-2 rounded-full", animate: { width: `${(round / ROUNDS) * 100}%` }, transition: { duration: 0.4 } }) }), phase === 'intro' && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-3xl p-8 shadow-lg text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u26A1" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-3", children: "Reaction Speed Test" }), _jsxs("p", { className: "text-gray-500 mb-6 leading-relaxed", children: ["The circle will turn ", _jsx("span", { className: "text-purple-600 font-semibold", children: "purple" }), " after a random delay.", _jsx("br", {}), "Click it as fast as you can! Don't click too early."] }), _jsx("div", { className: "bg-purple-50 rounded-2xl p-4 mb-6 text-sm text-gray-600", children: "5 rounds \u2022 Score based on average reaction time" }), _jsx(motion.button, { onClick: () => { setRound(0); startRound(); }, className: "w-full py-4 bg-purple-600 text-white rounded-2xl font-semibold text-lg hover:bg-purple-700 transition", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Start Game" })] })), (phase === 'waiting' || phase === 'ready' || phase === 'clicked') && (_jsxs("div", { className: "text-center", children: [_jsxs(AnimatePresence, { mode: "wait", children: [phase === 'waiting' && (_jsx(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "text-gray-500 text-lg mb-6", children: "Wait for it\u2026" }, "wait")), phase === 'ready' && (_jsx(motion.p, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 }, className: "text-purple-700 text-2xl font-bold mb-6", children: "CLICK NOW! \uD83C\uDFAF" }, "now")), phase === 'clicked' && !lastClickedEarly && currentReaction !== null && (_jsxs(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "text-green-600 text-xl font-semibold mb-6", children: [Math.round(currentReaction), " ms \u2713"] }, "result")), phase === 'clicked' && lastClickedEarly && (_jsx(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "text-red-500 text-xl font-semibold mb-6", children: "Too early! Try again" }, "early"))] }), _jsxs(motion.div, { className: "w-56 h-56 rounded-full mx-auto cursor-pointer shadow-2xl flex items-center justify-center select-none", style: { backgroundColor: circleColor }, animate: { scale: phase === 'ready' ? [1, 1.05, 1] : 1 }, transition: { repeat: phase === 'ready' ? Infinity : 0, duration: 0.5 }, onClick: handleClick, children: [phase === 'waiting' && _jsx("span", { className: "text-purple-300 text-4xl", children: "\u25CF" }), phase === 'ready' && _jsx("span", { className: "text-white text-4xl", children: "\u26A1" }), phase === 'clicked' && !lastClickedEarly && _jsx("span", { className: "text-white text-4xl", children: "\u2713" }), phase === 'clicked' && lastClickedEarly && _jsx("span", { className: "text-white text-4xl", children: "\u2717" })] }), reactionTimes.length > 0 && (_jsxs("div", { className: "mt-8 bg-white rounded-2xl p-4 shadow-sm", children: [_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Average so far" }), _jsxs("p", { className: "text-2xl font-bold text-purple-700", children: [avgTime, " ms"] })] }))] }))] }) }));
}
