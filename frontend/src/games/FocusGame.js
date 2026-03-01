import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const TOTAL_ATTEMPTS = 10;
const DOT_SIZE = 60;
const MOVE_INTERVAL = 1400;
export default function FocusGame({ onComplete, onBack }) {
    const [phase, setPhase] = useState('intro');
    const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
    const [hits, setHits] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [clicked, setClicked] = useState(false);
    const [missed, setMissed] = useState(false);
    const areaRef = useRef(null);
    const timerRef = useRef(null);
    const attemptRef = useRef(0);
    const hitsRef = useRef(0);
    const randomPos = useCallback(() => {
        const pad = 12;
        return {
            x: pad + Math.random() * (100 - 2 * pad),
            y: pad + Math.random() * (100 - 2 * pad),
        };
    }, []);
    const moveDot = useCallback(() => {
        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        setClicked(false);
        setMissed(false);
        setDotPos(randomPos());
        if (attemptRef.current >= TOTAL_ATTEMPTS) {
            if (timerRef.current)
                clearInterval(timerRef.current);
            setTimeout(() => {
                const finalHits = hitsRef.current;
                const score = Math.round((finalHits / TOTAL_ATTEMPTS) * 100);
                onComplete(score, {
                    accuracy: (finalHits / TOTAL_ATTEMPTS) * 100,
                    mistakes: TOTAL_ATTEMPTS - finalHits
                });
            }, 800);
        }
    }, [randomPos, onComplete]);
    const startGame = () => {
        attemptRef.current = 0;
        hitsRef.current = 0;
        setHits(0);
        setAttempt(0);
        setClicked(false);
        setMissed(false);
        setDotPos(randomPos());
        setPhase('playing');
        timerRef.current = setInterval(moveDot, MOVE_INTERVAL);
    };
    const handleDotClick = (e) => {
        e.stopPropagation();
        if (phase !== 'playing' || clicked)
            return;
        setClicked(true);
        hitsRef.current += 1;
        setHits(h => h + 1);
    };
    const handleAreaClick = () => {
        if (phase !== 'playing' || clicked) {
            setMissed(true);
        }
    };
    useEffect(() => () => { if (timerRef.current)
        clearInterval(timerRef.current); }, []);
    return (_jsx("div", { className: "flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("button", { onClick: onBack, className: "text-purple-600 hover:text-purple-800 font-medium", children: "\u2190 Back" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\uD83C\uDFAF Focus Tracking" }), _jsx("div", { className: "text-sm text-gray-500", children: phase === 'playing' ? `${attempt}/${TOTAL_ATTEMPTS}` : '' })] }), _jsx("div", { className: "w-full bg-blue-100 rounded-full h-2 mb-8", children: _jsx(motion.div, { className: "bg-blue-500 h-2 rounded-full", animate: { width: `${(attempt / TOTAL_ATTEMPTS) * 100}%` }, transition: { duration: 0.3 } }) }), phase === 'intro' && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-3xl p-8 shadow-lg text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDFAF" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-3", children: "Focus Tracking" }), _jsxs("p", { className: "text-gray-500 mb-6 leading-relaxed", children: ["A purple dot will appear in a box. Click it before it moves!", _jsx("br", {}), "10 attempts \u2014 stay focused!"] }), _jsx("div", { className: "bg-blue-50 rounded-2xl p-4 mb-6 text-sm text-gray-600", children: "10 attempts \u2022 Dot moves every 1.4 seconds" }), _jsx(motion.button, { onClick: startGame, className: "w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-lg hover:bg-blue-600 transition", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Start Game" })] })), phase === 'playing' && (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-4", children: [_jsxs("div", { className: "bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold", children: ["\u2713 ", hits, " Hits"] }), _jsxs("div", { className: "bg-red-100 text-red-500 px-4 py-2 rounded-xl font-semibold", children: ["\u2717 ", attempt - hits, " Missed"] })] }), _jsxs("div", { ref: areaRef, onClick: handleAreaClick, className: "relative bg-white rounded-3xl shadow-xl border-2 border-blue-200 overflow-hidden", style: { height: 320, cursor: 'crosshair' }, children: [_jsxs(AnimatePresence, { children: [!clicked && (_jsx(motion.div, { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0, opacity: 0 }, transition: { type: 'spring', stiffness: 400, damping: 20 }, onClick: handleDotClick, className: "absolute cursor-pointer rounded-full shadow-lg flex items-center justify-center", style: {
                                                width: DOT_SIZE,
                                                height: DOT_SIZE,
                                                left: `calc(${dotPos.x}% - ${DOT_SIZE / 2}px)`,
                                                top: `calc(${dotPos.y}% - ${DOT_SIZE / 2}px)`,
                                                background: 'radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed)',
                                                boxShadow: '0 0 20px #7c3aed88',
                                            }, children: _jsx("span", { className: "text-white text-xl", children: "\u25CF" }) }, `${dotPos.x}-${dotPos.y}`)), clicked && (_jsx(motion.div, { initial: { scale: 0.5, opacity: 1 }, animate: { scale: 2.5, opacity: 0 }, transition: { duration: 0.4 }, className: "absolute rounded-full", style: {
                                                width: DOT_SIZE,
                                                height: DOT_SIZE,
                                                left: `calc(${dotPos.x}% - ${DOT_SIZE / 2}px)`,
                                                top: `calc(${dotPos.y}% - ${DOT_SIZE / 2}px)`,
                                                background: '#10b981',
                                            } }, "hit"))] }), missed && (_jsx(motion.div, { initial: { opacity: 0.3 }, animate: { opacity: 0 }, transition: { duration: 0.5 }, className: "absolute inset-0 bg-red-400 rounded-3xl pointer-events-none" }, "miss-flash")), !clicked && (_jsx(motion.div, { className: "absolute bottom-0 left-0 h-1 bg-blue-400 rounded-full", initial: { width: '100%' }, animate: { width: '0%' }, transition: { duration: MOVE_INTERVAL / 1000, ease: 'linear' } }, `${dotPos.x}-${dotPos.y}-timer`))] })] }))] }) }));
}
