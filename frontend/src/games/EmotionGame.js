import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const EMOTIONS = [
    { emoji: '😊', label: 'Happy', options: ['Happy', 'Sad', 'Angry', 'Surprised'] },
    { emoji: '😢', label: 'Sad', options: ['Fearful', 'Sad', 'Happy', 'Angry'] },
    { emoji: '😠', label: 'Angry', options: ['Angry', 'Happy', 'Sad', 'Surprised'] },
    { emoji: '😨', label: 'Fearful', options: ['Sad', 'Surprised', 'Fearful', 'Disgust'] },
    { emoji: '😲', label: 'Surprised', options: ['Happy', 'Surprised', 'Fearful', 'Angry'] },
    { emoji: '🤢', label: 'Disgust', options: ['Disgust', 'Sad', 'Angry', 'Fearful'] },
    { emoji: '😌', label: 'Calm', options: ['Happy', 'Calm', 'Sad', 'Fearful'] },
    { emoji: '😏', label: 'Contempt', options: ['Happy', 'Contempt', 'Angry', 'Surprised'] },
    { emoji: '😰', label: 'Anxious', options: ['Anxious', 'Fearful', 'Sad', 'Angry'] },
    { emoji: '🥳', label: 'Excited', options: ['Excited', 'Happy', 'Surprised', 'Calm'] },
];
function shuffleOptions(options) {
    return [...options].sort(() => Math.random() - 0.5);
}
export default function EmotionGame({ onComplete, onBack }) {
    const [phase, setPhase] = useState('intro');
    const [questions] = useState(() => EMOTIONS.map(e => ({ ...e, options: shuffleOptions(e.options) })));
    const [current, setCurrent] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const handleAnswer = (option) => {
        if (selected)
            return;
        setSelected(option);
        setShowResult(true);
        const isCorrect = option === questions[current].label;
        if (isCorrect)
            setCorrect(c => c + 1);
        setTimeout(() => {
            setShowResult(false);
            setSelected(null);
            if (current + 1 >= questions.length) {
                const score = Math.round(((isCorrect ? correct + 1 : correct) / questions.length) * 100);
                onComplete(score);
            }
            else {
                setCurrent(c => c + 1);
            }
        }, 1100);
    };
    const q = questions[current];
    const OPTION_COLORS = ['bg-purple-100 text-purple-700 border-purple-200', 'bg-pink-100 text-pink-700 border-pink-200', 'bg-blue-100 text-blue-700 border-blue-200', 'bg-green-100 text-green-700 border-green-200'];
    return (_jsx("div", { className: "flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-50 to-white py-10 px-4", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("button", { onClick: onBack, className: "text-purple-600 hover:text-purple-800 font-medium", children: "\u2190 Back" }), _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\uD83D\uDE0A Emotion Recognition" }), _jsxs("div", { className: "text-sm text-gray-500", children: [current + 1, "/", questions.length] })] }), _jsx("div", { className: "w-full bg-yellow-100 rounded-full h-2 mb-8", children: _jsx(motion.div, { className: "bg-yellow-500 h-2 rounded-full", animate: { width: `${(current / questions.length) * 100}%` }, transition: { duration: 0.4 } }) }), phase === 'intro' && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-3xl p-8 shadow-lg text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDE0A\uD83D\uDE22\uD83D\uDE20\uD83D\uDE28" }), _jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-3", children: "Emotion Recognition" }), _jsx("p", { className: "text-gray-500 mb-6 leading-relaxed", children: "An emoji will appear. Select the emotion it expresses from 4 options." }), _jsx("div", { className: "bg-yellow-50 rounded-2xl p-4 mb-6 text-sm text-gray-600", children: "10 questions \u2022 Score based on correct answers" }), _jsx(motion.button, { onClick: () => setPhase('playing'), className: "w-full py-4 bg-yellow-500 text-white rounded-2xl font-semibold text-lg hover:bg-yellow-600 transition", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Start Game" })] })), phase === 'playing' && (_jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.3 }, className: "bg-white rounded-3xl shadow-lg p-8 text-center", children: [_jsx(motion.div, { className: "text-8xl mb-6 select-none", animate: { scale: [1, 1.08, 1] }, transition: { duration: 1.2, repeat: Infinity }, children: q.emoji }), _jsx("p", { className: "text-gray-500 text-lg mb-6 font-medium", children: "What emotion is this?" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: q.options.map((option, i) => {
                                    const isCorrect = option === q.label;
                                    const isSelected = selected === option;
                                    let borderCls = '';
                                    if (showResult && isSelected && isCorrect)
                                        borderCls = 'bg-green-100 border-green-500 text-green-700 scale-105';
                                    else if (showResult && isSelected && !isCorrect)
                                        borderCls = 'bg-red-100 border-red-500 text-red-700';
                                    else if (showResult && isCorrect)
                                        borderCls = 'bg-green-50 border-green-400 text-green-600';
                                    return (_jsx(motion.button, { onClick: () => handleAnswer(option), disabled: !!selected, className: `py-4 px-3 rounded-2xl border-2 font-semibold text-base transition-all duration-200 ${borderCls || OPTION_COLORS[i]}`, whileHover: { scale: !selected ? 1.04 : 1 }, whileTap: { scale: !selected ? 0.96 : 1 }, children: option }, option));
                                }) }), _jsx("div", { className: "mt-6 flex justify-center gap-2", children: questions.map((_, i) => (_jsx("div", { className: `w-2.5 h-2.5 rounded-full transition-all ${i < current ? 'bg-yellow-400' : i === current ? 'bg-yellow-600 scale-125' : 'bg-gray-200'}` }, i))) })] }, current) }))] }) }));
}
