import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const COLORS = ['#7c3aed', '#ec4899', '#0ea5e9', '#10b981'];
const COLOR_NAMES = ['Purple', 'Pink', 'Blue', 'Green'];
const COLOR_LIGHT = ['#ede9fe', '#fce7f3', '#e0f2fe', '#d1fae5'];
const MAX_ROUNDS = 8;
export default function MemoryGame({ onComplete, onBack }) {
    const [phase, setPhase] = useState('intro');
    const [sequence, setSequence] = useState([]);
    const [userInput, setUserInput] = useState([]);
    const [highlighted, setHighlighted] = useState(null);
    const [round, setRound] = useState(0);
    const [correctRounds, setCorrectRounds] = useState(0);
    const [feedbackOk, setFeedbackOk] = useState(true);
    const [showFeedback, setShowFeedback] = useState(false);
    const playSequence = useCallback(async (seq) => {
        setPhase('showing');
        setHighlighted(null);
        await new Promise(r => setTimeout(r, 600));
        for (let i = 0; i < seq.length; i++) {
            setHighlighted(seq[i]);
            await new Promise(r => setTimeout(r, 600));
            setHighlighted(null);
            await new Promise(r => setTimeout(r, 300));
        }
        setPhase('input');
        setUserInput([]);
    }, []);
    const startNextRound = useCallback((currentRound, seq) => {
        const newSeq = [...seq, Math.floor(Math.random() * 4)];
        setSequence(newSeq);
        setRound(currentRound + 1);
        playSequence(newSeq);
    }, [playSequence]);
    const handleStart = () => {
        const firstSeq = [Math.floor(Math.random() * 4)];
        setSequence(firstSeq);
        setRound(1);
        setCorrectRounds(0);
        playSequence(firstSeq);
    };
    const handleColorClick = (idx) => {
        if (phase !== 'input')
            return;
        const newInput = [...userInput, idx];
        setUserInput(newInput);
        setHighlighted(idx);
        setTimeout(() => setHighlighted(null), 200);
        const pos = newInput.length - 1;
        if (newInput[pos] !== sequence[pos]) {
            // Wrong
            setFeedbackOk(false);
            setShowFeedback(true);
            setPhase('feedback');
            setTimeout(() => {
                setShowFeedback(false);
                const score = (correctRounds / MAX_ROUNDS) * 100;
                onComplete(Math.round(score));
            }, 1800);
            return;
        }
        if (newInput.length === sequence.length) {
            const newCorrect = correctRounds + 1;
            setCorrectRounds(newCorrect);
            setFeedbackOk(true);
            setShowFeedback(true);
            setTimeout(() => {
                setShowFeedback(false);
                if (round >= MAX_ROUNDS) {
                    onComplete(Math.round((newCorrect / MAX_ROUNDS) * 100));
                }
                else {
                    startNextRound(round, sequence);
                }
            }, 1000);
        }
    };
    return (_jsx("div", { className: "flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-50 to-white py-10 px-4", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("button", { onClick: onBack, className: "text-purple-600 hover:text-purple-800 font-medium", children: "\u2190 Back" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\uD83C\uDFAF Memory Pattern" }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Round ", round, "/", MAX_ROUNDS] })] }), _jsx("div", { className: "w-full bg-purple-100 rounded-full h-2 mb-8", children: _jsx(motion.div, { className: "bg-pink-500 h-2 rounded-full", animate: { width: `${(round / MAX_ROUNDS) * 100}%` }, transition: { duration: 0.4 } }) }), phase === 'intro' && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-3xl p-8 shadow-lg text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83E\uDDE0" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-3", children: "Memory Pattern" }), _jsx("p", { className: "text-gray-500 mb-6 leading-relaxed", children: "Watch the color sequence, then repeat it. Each round adds one more step!" }), _jsx("div", { className: "bg-pink-50 rounded-2xl p-4 mb-6 text-sm text-gray-600", children: "Up to 8 rounds \u2022 One wrong move ends the game" }), _jsx("div", { className: "grid grid-cols-2 gap-3 mb-6", children: COLORS.map((c, i) => (_jsx("div", { className: "rounded-2xl py-4 text-white font-semibold text-center", style: { backgroundColor: c }, children: COLOR_NAMES[i] }, i))) }), _jsx(motion.button, { onClick: handleStart, className: "w-full py-4 bg-pink-500 text-white rounded-2xl font-semibold text-lg hover:bg-pink-600 transition", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Start Game" })] })), (phase === 'showing' || phase === 'input' || phase === 'feedback') && (_jsxs("div", { className: "text-center", children: [_jsxs(AnimatePresence, { mode: "wait", children: [phase === 'showing' && (_jsx(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "text-gray-600 text-lg mb-4", children: "\uD83D\uDC40 Watch the sequence\u2026" }, "watch")), phase === 'input' && (_jsxs(motion.p, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "text-purple-700 text-lg font-semibold mb-4", children: ["Tap the sequence! (", userInput.length, "/", sequence.length, ")"] }, "repeat")), showFeedback && feedbackOk && (_jsx(motion.p, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { opacity: 0 }, className: "text-green-600 text-xl font-bold mb-4", children: "\u2713 Correct!" }, "ok")), showFeedback && !feedbackOk && (_jsx(motion.p, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { opacity: 0 }, className: "text-red-500 text-xl font-bold mb-4", children: "\u2717 Wrong! Game over." }, "fail"))] }), _jsx("div", { className: "grid grid-cols-2 gap-4 mt-2", children: COLORS.map((color, idx) => (_jsx(motion.button, { onClick: () => handleColorClick(idx), disabled: phase !== 'input', className: "rounded-3xl py-12 font-bold text-xl text-white shadow-lg transition relative overflow-hidden", style: {
                                    backgroundColor: highlighted === idx ? color : COLOR_LIGHT[idx],
                                    color: highlighted === idx ? 'white' : color,
                                    border: `3px solid ${color}`,
                                }, whileHover: { scale: phase === 'input' ? 1.04 : 1 }, whileTap: { scale: 0.94 }, animate: { scale: highlighted === idx ? 1.06 : 1, boxShadow: highlighted === idx ? `0 0 30px ${color}88` : 'none' }, children: COLOR_NAMES[idx] }, idx))) }), _jsx("div", { className: "mt-6 flex justify-center gap-2", children: sequence.map((_s, i) => (_jsx("div", { className: "w-4 h-4 rounded-full border-2", style: { backgroundColor: i < userInput.length ? COLORS[sequence[i]] : 'transparent', borderColor: COLORS[sequence[i]] } }, i))) })] }))] }) }));
}
