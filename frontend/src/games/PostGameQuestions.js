import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
const STRESS_LEVEL_CONFIG = {
    low: { color: '#10b981', bg: '#ecfdf5', label: '😊 Low', bar: 'bg-emerald-400' },
    moderate: { color: '#f59e0b', bg: '#fffbeb', label: '😐 Moderate', bar: 'bg-amber-400' },
    high: { color: '#f97316', bg: '#fff7ed', label: '😤 High', bar: 'bg-orange-400' },
};
const LIKERT_LABELS = ['', 'Not at all', 'Rarely', 'Sometimes', 'Often', 'Very Often'];
const LIKERT_COLORS = ['', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
export default function PostGameQuestions({ gameId, score, accuracy, reactionTime, mistakes, completionTime, levelReached, onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await api.getQuestionsForGame(gameId);
                setQuestions(res.questions || []);
            }
            catch {
                // Fallback: show generic 2-question set
                setQuestions([
                    { id: 'question_overwhelm', text: 'How stressed did you feel during this activity?', scale_low: 'Not at all', scale_high: 'Very Often', reverse: false },
                    { id: 'question_frustration', text: 'Did you feel frustrated at any point?', scale_low: 'Not at all', scale_high: 'Very Often', reverse: false },
                ]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [gameId]);
    const handleAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        // Auto-advance after short delay
        setTimeout(() => {
            if (currentQ < questions.length - 1) {
                setCurrentQ(q => q + 1);
            }
        }, 350);
    };
    const allAnswered = questions.length > 0 && questions.every(q => answers[q.id] !== undefined);
    const handleSubmit = async () => {
        if (!allAnswered || submitting)
            return;
        setSubmitting(true);
        try {
            // Map answers to the format expected by the backend formula
            const stressLevel = answers['question_overwhelm'] || answers['stress_level'] || 3;
            const frustration = !!(answers['question_frustration'] > 3);
            const res = await api.submitGame({
                game_type: gameId,
                score,
                accuracy,
                reaction_time: reactionTime,
                mistakes,
                completion_time: completionTime,
                level_reached: levelReached,
                answers: {
                    stress_level: stressLevel,
                    frustration: frustration
                }
            });
            setResult(res);
        }
        catch (e) {
            console.error("Submission failed:", e);
            // Fallback locally
            const vals = Object.values(answers);
            const sum = vals.reduce((a, b) => a + b, 0);
            const pct = vals.length > 0 ? Math.round((sum - vals.length) / (vals.length * 4) * 100) : 0;
            setResult({
                stress_score: pct,
                stress_level: pct <= 33 ? 'low' : pct <= 66 ? 'moderate' : 'high',
                cognitive_score: 70,
                message: "Sync failed, saved locally."
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleContinue = () => {
        if (result) {
            onComplete({
                stressScore: result.stress_score,
                stressLevel: result.stress_level,
                stressPercentage: result.stress_score, // use stress_score as percentage
                riskFlag: result.stress_score > 85,
                riskMessage: result.stress_score > 85 ? "Significant stress detected. Consider talking to Sarthi 🌸" : undefined,
            });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-purple-100", children: _jsx(motion.div, { animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 1, ease: 'linear' }, className: "w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full" }) }));
    }
    // ── Result View ──────────────────────────────────────────────────────────
    if (result) {
        const cfg = STRESS_LEVEL_CONFIG[result.stress_level] || STRESS_LEVEL_CONFIG.moderate;
        const pct = result.stress_percentage ?? 0;
        return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 px-4 py-10", children: _jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', bounce: 0.35 }, className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 text-center", children: [_jsx("div", { className: "text-white/70 text-sm font-medium mb-1", children: "Check-In Complete" }), _jsx("div", { className: "text-white text-4xl font-black", children: Math.round(score) }), _jsx("div", { className: "text-white/70 text-sm mt-1", children: "game score" })] }), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "text-stone-500 text-sm mb-2 font-medium", children: "Psychological Stress Level" }), _jsx("div", { className: "inline-flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold mb-4", style: { background: cfg.bg, color: cfg.color }, children: cfg.label }), _jsxs("div", { className: "relative h-4 bg-stone-100 rounded-full overflow-hidden", children: [_jsx(motion.div, { className: `h-full rounded-full ${cfg.bar}`, initial: { width: 0 }, animate: { width: `${pct}%` }, transition: { duration: 1.2, ease: 'easeOut' } }), _jsxs("div", { className: "absolute top-0 h-full flex items-center pl-3 text-white text-xs font-bold", style: { left: `${Math.min(pct, 85)}%` }, children: [Math.round(pct), "%"] })] }), _jsxs("div", { className: "flex justify-between mt-1 text-xs text-stone-400", children: [_jsx("span", { children: "Low (0\u201330%)" }), _jsx("span", { children: "Moderate (31\u201360%)" }), _jsx("span", { children: "Severe (81\u2013100%)" })] })] }), result.risk_flag && result.risk_message && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex gap-3", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDC9B" }), _jsx("p", { className: "text-rose-700 text-sm", children: result.risk_message })] })), _jsx("div", { className: "bg-purple-50 rounded-2xl p-4 mb-6 text-center", children: _jsxs("p", { className: "text-purple-700 text-sm font-medium", children: [pct <= 30 && "You're doing great! Low stress detected. Keep it up 🌟", pct > 30 && pct <= 60 && "Moderate stress detected. Taking short breaks may help 🌿", pct > 60 && pct <= 80 && "High stress signs detected. Be kind to yourself today 💛", pct > 80 && "Significant stress detected. Consider talking to Sarthi 🌸"] }) }), _jsx(motion.button, { onClick: handleContinue, className: "w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg", whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, children: "Continue \uD83C\uDFAF" })] })] }) }) }));
    }
    // ── Question View ────────────────────────────────────────────────────────
    const q = questions[currentQ];
    const progress = Math.round(((currentQ + (answers[q?.id] !== undefined ? 1 : 0)) / questions.length) * 100);
    return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 px-4 py-10", children: _jsx(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-indigo-600 px-6 pt-6 pb-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("div", { className: "text-white font-bold text-lg", children: "\uD83E\uDDE0 Quick Check-In" }), _jsxs("div", { className: "text-white/80 text-sm font-medium", children: [currentQ + 1, " / ", questions.length] })] }), _jsx("div", { className: "h-2 bg-white/20 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full bg-white rounded-full", animate: { width: `${progress}%` }, transition: { duration: 0.4 } }) }), _jsx("div", { className: "mt-2 text-white/60 text-xs", children: "Two short questions to help track your wellbeing \uD83D\uDC9B" })] }), _jsxs("div", { className: "p-6", children: [_jsx(AnimatePresence, { mode: "wait", children: q && (_jsxs(motion.div, { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25 }, children: [_jsx("p", { className: "text-stone-700 font-semibold text-lg mb-6 leading-relaxed", children: q.text }), _jsx("div", { className: "grid grid-cols-5 gap-2 mb-4", children: [1, 2, 3, 4, 5].map(val => {
                                                const selected = answers[q.id] === val;
                                                const color = LIKERT_COLORS[val];
                                                return (_jsx(motion.button, { onClick: () => handleAnswer(q.id, val), className: "relative flex flex-col items-center py-4 rounded-2xl border-2 font-bold text-xl transition-all", style: {
                                                        borderColor: selected ? color : '#e2e8f0',
                                                        background: selected ? color : 'white',
                                                        color: selected ? 'white' : '#94a3b8',
                                                        boxShadow: selected ? `0 4px 16px ${color}55` : 'none',
                                                    }, whileHover: { scale: 1.08, y: -2 }, whileTap: { scale: 0.93 }, children: val }, val));
                                            }) }), _jsxs("div", { className: "flex justify-between text-xs text-stone-400 mb-6 px-1", children: [_jsx("span", { children: q.scale_low }), _jsx("span", { children: q.scale_high })] }), _jsx(AnimatePresence, { children: answers[q.id] && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "text-center mb-4", children: _jsx("span", { className: "inline-block px-4 py-1.5 rounded-full text-sm font-semibold", style: {
                                                        background: `${LIKERT_COLORS[answers[q.id]]}15`,
                                                        color: LIKERT_COLORS[answers[q.id]],
                                                    }, children: LIKERT_LABELS[answers[q.id]] }) })) })] }, q.id)) }), _jsxs("div", { className: "flex gap-3 mt-2", children: [currentQ > 0 && (_jsx(motion.button, { onClick: () => setCurrentQ(q => q - 1), className: "flex-none px-5 py-3 bg-stone-100 text-stone-600 rounded-2xl font-semibold", whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 }, children: "\u2190 Back" })), currentQ < questions.length - 1 ? (_jsx(motion.button, { onClick: () => setCurrentQ(q => q + 1), disabled: !answers[q?.id], className: "flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-semibold disabled:opacity-40", whileHover: { scale: answers[q?.id] ? 1.02 : 1 }, whileTap: { scale: 0.97 }, children: "Next \u2192" })) : (_jsx(motion.button, { onClick: handleSubmit, disabled: !allAnswered || submitting, className: "flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold disabled:opacity-40 shadow-lg", whileHover: { scale: allAnswered ? 1.02 : 1 }, whileTap: { scale: 0.97 }, children: submitting ? 'Submitting…' : 'Submit & See Results ✨' }))] })] })] }) }) }));
}
