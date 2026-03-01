import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// ── LOCAL DATA ───────────────────────────────────────────────────────────────
const VIDEOS = [
    { id: 1, title: '5-Minute Meditation for Stress Relief', youtubeId: 'inpok4MKVLM', category: 'Meditation' },
    { id: 2, title: 'Breathing Technique for Anxiety', youtubeId: 'odADwWzHR24', category: 'Anxiety' },
    { id: 3, title: 'How to Stop Overthinking', youtubeId: 'ZToicYcHIOU', category: 'Overthinking' },
    { id: 4, title: 'Body Scan Meditation for Sleep', youtubeId: '15q-N-_kkrU', category: 'Sleep' },
    { id: 5, title: 'Morning Mindfulness Routine', youtubeId: 'U9YKY7fdwyg', category: 'Mindfulness' },
    { id: 6, title: 'Guided Visualization for Calm', youtubeId: '86m4RC_ADEY', category: 'Relaxation' },
];
const BOOKS = [
    {
        id: 1, title: 'The Power of Now', author: 'Eckhart Tolle', emoji: '⚡',
        description: 'A guide to spiritual enlightenment and living in the present moment.',
        category: 'Mindfulness', link: 'https://www.amazon.in/dp/8190105914',
    },
    {
        id: 2, title: 'Atomic Habits', author: 'James Clear', emoji: '🔁',
        description: 'Tiny changes that lead to remarkable results in your daily life.',
        category: 'Self-Improvement', link: 'https://www.amazon.in/dp/1847941834',
    },
    {
        id: 3, title: 'Feeling Good', author: 'David Burns', emoji: '😊',
        description: 'The clinically proven CBT-based approach to beating depression.',
        category: 'Depression', link: 'https://www.amazon.in/dp/0380810336',
    },
    {
        id: 4, title: 'The Anxiety and Worry Workbook', author: 'Clark & Beck', emoji: '🧘',
        description: 'Evidence-based techniques to break free from anxiety and worry.',
        category: 'Anxiety', link: 'https://www.amazon.in/dp/1606234358',
    },
    {
        id: 5, title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', emoji: '🌅',
        description: 'A Holocaust survivor\'s account of finding purpose in suffering.',
        category: 'Purpose', link: 'https://www.amazon.in/dp/8172234627',
    },
    {
        id: 6, title: 'The Midnight Library', author: 'Matt Haig', emoji: '📚',
        description: 'A life-affirming novel about regret, hope and infinite possibility.',
        category: 'Hope', link: 'https://www.amazon.in/dp/0525559477',
    },
];
// ── BREATHING CONFIG ──────────────────────────────────────────────────────────
const BREATHING_PHASES = [
    { label: 'Inhale…', duration: 4000, scale: 1.45, color: '#6ee7b7' },
    { label: 'Hold…', duration: 4000, scale: 1.45, color: '#93c5fd' },
    { label: 'Exhale…', duration: 6000, scale: 1.0, color: '#c4b5fd' },
];
const TABS = [
    { id: 'videos', label: '🎥 Videos', activeClass: 'bg-orange-500 text-white' },
    { id: 'breathing', label: '🌬️ Breathing', activeClass: 'bg-emerald-500 text-white' },
    { id: 'books', label: '📚 Books', activeClass: 'bg-amber-500 text-white' },
];
// ── BREATHING EXERCISE COMPONENT ──────────────────────────────────────────────
function BreathingExercise() {
    const [running, setRunning] = useState(false);
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef(null);
    const tickRef = useRef(null);
    const phase = BREATHING_PHASES[phaseIdx];
    const nextPhase = useCallback((currentIdx) => {
        const next = (currentIdx + 1) % BREATHING_PHASES.length;
        setPhaseIdx(next);
        setSeconds(0);
        timerRef.current = setTimeout(() => nextPhase(next), BREATHING_PHASES[next].duration);
    }, []);
    const start = () => {
        setRunning(true);
        setPhaseIdx(0);
        setSeconds(0);
        timerRef.current = setTimeout(() => nextPhase(0), BREATHING_PHASES[0].duration);
        tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    };
    const stop = () => {
        setRunning(false);
        setPhaseIdx(0);
        setSeconds(0);
        if (timerRef.current)
            clearTimeout(timerRef.current);
        if (tickRef.current)
            clearInterval(tickRef.current);
    };
    useEffect(() => {
        if (running) {
            if (tickRef.current)
                clearInterval(tickRef.current);
            tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => { if (tickRef.current)
            clearInterval(tickRef.current); };
    }, [phaseIdx, running]);
    useEffect(() => () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
        if (tickRef.current)
            clearInterval(tickRef.current);
    }, []);
    const totalSec = Math.round(phase.duration / 1000);
    const progress = totalSec > 0 ? Math.min(seconds / totalSec, 1) : 0;
    return (_jsxs(motion.div, { className: "flex flex-col items-center justify-center py-12 px-4", initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsx("h2", { className: "text-xl font-bold text-stone-700 mb-1", children: "4-4-6 Breathing Exercise" }), _jsx("p", { className: "text-stone-400 text-sm mb-10", children: "Inhale 4s \u00B7 Hold 4s \u00B7 Exhale 6s" }), _jsxs("div", { className: "relative flex items-center justify-center mb-10", children: [running && (_jsx(motion.div, { className: "absolute rounded-full opacity-20", style: { width: 260, height: 260, background: phase.color }, animate: { scale: running ? [1, 1.15, 1] : 1 }, transition: { duration: phase.duration / 1000, repeat: Infinity, ease: 'easeInOut' } })), _jsx(motion.div, { className: "rounded-full flex items-center justify-center shadow-xl cursor-pointer select-none", style: {
                            width: 180, height: 180,
                            background: `radial-gradient(circle at 35% 35%, ${phase.color}, #3b82f6)`,
                        }, animate: { scale: running ? phase.scale : 1 }, transition: { duration: phase.duration / 1000, ease: 'easeInOut' }, onClick: running ? stop : start, children: _jsx("div", { className: "text-center text-white", children: running ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-2xl font-bold", children: phase.label }), _jsxs("div", { className: "text-sm opacity-80 mt-1", children: [totalSec - Math.min(seconds, totalSec), "s"] })] })) : (_jsx("div", { className: "text-3xl", children: "\uD83E\uDEC1" })) }) })] }), running && (_jsx("div", { className: "w-64 h-1.5 bg-stone-200 rounded-full mb-8 overflow-hidden", children: _jsx(motion.div, { className: "h-full rounded-full", style: { background: phase.color }, animate: { width: `${progress * 100}%` }, transition: { duration: 0.5 } }) })), running && (_jsx("div", { className: "flex gap-3 mb-8", children: BREATHING_PHASES.map((p, i) => (_jsx("div", { className: `w-3 h-3 rounded-full transition-all ${i === phaseIdx ? 'scale-125' : 'opacity-30'}`, style: { background: p.color } }, i))) })), _jsx(motion.button, { onClick: running ? stop : start, className: `px-8 py-3 rounded-2xl font-bold text-white shadow-md transition ${running ? 'bg-red-400 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-600'}`, whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 }, children: running ? '⏹ Stop' : '▶ Start Breathing Exercise' }), !running && (_jsx("p", { className: "text-stone-400 text-xs mt-4", children: "Click the circle or the button to begin \u00B7 Click again to stop" })), _jsx("div", { className: "mt-10 grid grid-cols-3 gap-4 max-w-lg w-full", children: [
                    { emoji: '😌', label: 'Reduces Anxiety', sub: 'Calms your nervous system' },
                    { emoji: '💤', label: 'Better Sleep', sub: 'Lowers cortisol levels' },
                    { emoji: '🎯', label: 'Improves Focus', sub: 'Increases oxygen to brain' },
                ].map((b, i) => (_jsxs("div", { className: "bg-white rounded-2xl p-4 text-center border border-stone-100 shadow-sm", children: [_jsx("div", { className: "text-2xl mb-1", children: b.emoji }), _jsx("div", { className: "text-xs font-bold text-stone-700", children: b.label }), _jsx("div", { className: "text-xs text-stone-400 mt-0.5", children: b.sub })] }, i))) })] }));
}
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TherapyHome() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('videos');
    return (_jsx("div", { className: "min-h-screen py-10 px-4", style: { background: 'linear-gradient(135deg, #fef9f0, #ecfdf5)' }, children: _jsxs("div", { className: "max-w-5xl mx-auto", children: [_jsxs("div", { className: "flex items-start justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-black text-stone-800 mb-1", children: "Therapy at Home \uD83C\uDF3F" }), _jsx("p", { className: "text-stone-500", children: "Videos, breathing exercises and books for mental wellness" })] }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "px-4 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-100 transition text-sm font-medium", children: "\u2190 Dashboard" })] }), _jsx("div", { className: "flex gap-2 mb-8", children: TABS.map(tab => (_jsx(motion.button, { onClick: () => setActiveTab(tab.id), className: `px-5 py-2.5 rounded-xl font-semibold text-sm transition ${activeTab === tab.id ? tab.activeClass + ' shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`, whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 }, children: tab.label }, tab.id))) }), _jsxs(AnimatePresence, { mode: "wait", children: [activeTab === 'videos' && (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 gap-6", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, children: VIDEOS.map(video => (_jsxs(motion.div, { className: "bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-lg transition", whileHover: { y: -4 }, children: [_jsx("div", { className: "relative w-full", style: { paddingTop: '56.25%' }, children: _jsx("iframe", { className: "absolute inset-0 w-full h-full", src: `https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`, title: video.title, frameBorder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, loading: "lazy" }) }), _jsxs("div", { className: "p-4", children: [_jsx("span", { className: "text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium", children: video.category }), _jsx("h3", { className: "text-sm font-bold text-stone-800 mt-2", children: video.title })] })] }, video.id))) }, "videos")), activeTab === 'breathing' && (_jsx(motion.div, { className: "bg-white rounded-3xl border border-stone-100 shadow-sm", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, children: _jsx(BreathingExercise, {}) }, "breathing")), activeTab === 'books' && (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, children: BOOKS.map(book => (_jsxs(motion.div, { className: "bg-white rounded-2xl border border-stone-100 p-5 flex flex-col shadow-sm hover:shadow-lg hover:border-amber-200 transition", whileHover: { y: -4 }, children: [_jsx("div", { className: "w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl mb-3", children: book.emoji }), _jsx("h3", { className: "text-base font-bold text-stone-800", children: book.title }), _jsxs("p", { className: "text-xs text-stone-400 font-medium mb-2", children: ["by ", book.author] }), _jsx("p", { className: "text-sm text-stone-500 leading-relaxed flex-1 mb-4", children: book.description }), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-stone-100", children: [_jsx("span", { className: "text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-medium", children: book.category }), _jsx("a", { href: book.link, target: "_blank", rel: "noopener noreferrer", className: "px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition", children: "View Book \u2192" })] })] }, book.id))) }, "books"))] })] }) }));
}
