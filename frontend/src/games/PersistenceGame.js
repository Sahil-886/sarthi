import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const LEVELS = 5;
const INITIAL_FILL_RATE = 0.8; // % per 100ms
const DRAIN_RATES = [0.6, 0.9, 1.3, 1.8, 2.5]; // increasing drain per level
export default function PersistenceGame({ onComplete, onBack }) {
    const [phase, setPhase] = useState('intro');
    const [fill, setFill] = useState(0);
    const [level, setLevel] = useState(1);
    const [highestLevel, setHighestLevel] = useState(0);
    const [holding, setHolding] = useState(false);
    const holdingRef = useRef(false);
    const fillRef = useRef(0);
    const animRef = useRef(null);
    const lastTimeRef = useRef(0);
    const DRAIN = DRAIN_RATES[Math.min(level - 1, DRAIN_RATES.length - 1)];
    const TARGET = 100;
    const FAIL_THRESHOLD = 0;
    const startAnimation = () => {
        const tick = (time) => {
            if (!lastTimeRef.current)
                lastTimeRef.current = time;
            const dt = time - lastTimeRef.current;
            lastTimeRef.current = time;
            if (holdingRef.current) {
                fillRef.current = Math.min(TARGET, fillRef.current + INITIAL_FILL_RATE * (dt / 16));
            }
            else {
                fillRef.current = Math.max(FAIL_THRESHOLD, fillRef.current - DRAIN * (dt / 16));
            }
            setFill(fillRef.current);
            if (fillRef.current >= TARGET) {
                if (animRef.current)
                    cancelAnimationFrame(animRef.current);
                if (level >= LEVELS) {
                    setHighestLevel(LEVELS);
                    setPhase('done');
                    setTimeout(() => onComplete(100), 800);
                }
                else {
                    setHighestLevel(level);
                    holdingRef.current = false;
                    setHolding(false);
                    setPhase('levelUp');
                }
                return;
            }
            if (fillRef.current <= FAIL_THRESHOLD && !holdingRef.current) {
                if (animRef.current)
                    cancelAnimationFrame(animRef.current);
                setHighestLevel(prev => Math.max(prev, level - 1));
                setPhase('fail');
                return;
            }
            animRef.current = requestAnimationFrame(tick);
        };
        lastTimeRef.current = 0;
        animRef.current = requestAnimationFrame(tick);
    };
    const startLevel = (lvl) => {
        setLevel(lvl);
        fillRef.current = 50;
        setFill(50);
        holdingRef.current = false;
        setHolding(false);
        setPhase('playing');
    };
    useEffect(() => {
        if (phase === 'playing') {
            startAnimation();
        }
        return () => { if (animRef.current)
            cancelAnimationFrame(animRef.current); };
    }, [phase, level]);
    const handlePressStart = () => {
        holdingRef.current = true;
        setHolding(true);
    };
    const handlePressEnd = () => {
        holdingRef.current = false;
        setHolding(false);
    };
    const fillColor = fill > 66 ? '#10b981' : fill > 33 ? '#f59e0b' : '#ef4444';
    const finalScore = Math.round((highestLevel / LEVELS) * 100);
    return (_jsx("div", { className: "flex flex-col items-center min-h-screen bg-gradient-to-br from-green-50 to-white py-10 px-4", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("button", { onClick: onBack, className: "text-purple-600 hover:text-purple-800 font-medium", children: "\u2190 Back" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\uD83D\uDCAA Persistence" }), phase === 'playing' && _jsxs("div", { className: "text-sm text-gray-500", children: ["Level ", level, "/", LEVELS] })] }), _jsx("div", { className: "w-full bg-green-100 rounded-full h-2 mb-8", children: _jsx(motion.div, { className: "bg-green-500 h-2 rounded-full", animate: { width: `${((level - 1) / LEVELS) * 100}%` } }) }), phase === 'intro' && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-3xl p-8 shadow-lg text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCAA" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-3", children: "Persistence Challenge" }), _jsxs("p", { className: "text-gray-500 mb-6 leading-relaxed", children: ["Press and hold the button to fill the bar to 100%. Release and it drains!", _jsx("br", {}), "The drain gets faster each level. Reach level ", LEVELS, "!"] }), _jsx("div", { className: "bg-green-50 rounded-2xl p-4 mb-6 text-sm text-gray-600", children: "5 levels \u2022 Fill bar to 100% to advance" }), _jsx(motion.button, { onClick: () => startLevel(1), className: "w-full py-4 bg-green-500 text-white rounded-2xl font-semibold text-lg hover:bg-green-600 transition", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Start Game" })] })), phase === 'playing' && (_jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "mb-2 text-gray-600 text-sm font-medium", children: ["Level ", level, " \u2014 Drain rate: ", DRAIN.toFixed(1), "x"] }), _jsxs("div", { className: "bg-gray-100 rounded-2xl h-16 mb-8 overflow-hidden relative border-2 border-gray-200 mx-4", children: [_jsx(motion.div, { className: "h-full rounded-2xl", style: { width: `${fill}%`, backgroundColor: fillColor, transition: 'background-color 0.3s' } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("span", { className: "text-gray-800 font-bold text-xl", children: [Math.round(fill), "%"] }) })] }), _jsx(motion.button, { onMouseDown: handlePressStart, onMouseUp: handlePressEnd, onTouchStart: e => { e.preventDefault(); handlePressStart(); }, onTouchEnd: handlePressEnd, className: "w-48 h-48 rounded-full text-white text-2xl font-bold shadow-2xl select-none mx-auto flex items-center justify-center", style: {
                                background: holding
                                    ? 'radial-gradient(circle, #4ade80, #16a34a)'
                                    : 'radial-gradient(circle, #86efac, #22c55e)',
                                boxShadow: holding ? '0 0 40px #16a34a88' : '0 8px 32px #22c55e44',
                            }, animate: { scale: holding ? 0.93 : 1 }, transition: { type: 'spring', stiffness: 400, damping: 20 }, children: holding ? '⚡ Charging!' : 'HOLD' }), _jsx("p", { className: "mt-6 text-gray-500 text-sm", children: holding ? 'Filling…' : 'Press & hold to fill' })] })), _jsxs(AnimatePresence, { children: [phase === 'levelUp' && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 }, className: "bg-white rounded-3xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF89" }), _jsxs("h2", { className: "text-2xl font-bold text-green-600 mb-2", children: ["Level ", level, " Complete!"] }), _jsxs("p", { className: "text-gray-500 mb-6", children: ["Get ready for level ", level + 1, " \u2014 it gets faster!"] }), _jsx(motion.button, { onClick: () => startLevel(level + 1), className: "w-full py-4 bg-green-500 text-white rounded-2xl font-semibold text-lg", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Next Level \u2192" })] })), phase === 'fail' && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 }, className: "bg-white rounded-3xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDE24" }), _jsxs("h2", { className: "text-2xl font-bold text-red-500 mb-2", children: ["Level ", level, " Failed!"] }), _jsxs("p", { className: "text-gray-500 mb-2", children: ["You reached level ", _jsx("strong", { children: highestLevel }), " out of ", LEVELS, "."] }), _jsxs("p", { className: "text-gray-500 mb-6 text-sm", children: ["Score: ", finalScore, "/100"] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(motion.button, { onClick: () => startLevel(level), className: "flex-1 py-4 bg-purple-600 text-white rounded-2xl font-semibold", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Retry Level" }), _jsx(motion.button, { onClick: () => onComplete(finalScore, { levelReached: highestLevel }), className: "flex-1 py-4 border-2 border-gray-300 text-gray-600 rounded-2xl font-semibold", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Submit Score" })] })] })), phase === 'done' && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-3xl shadow-lg p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDFC6" }), _jsx("h2", { className: "text-2xl font-bold text-green-600 mb-2", children: "Perfect Score!" }), _jsxs("p", { className: "text-gray-500 mb-6", children: ["You completed all ", LEVELS, " levels! Incredible persistence!"] })] }))] })] }) }));
}
