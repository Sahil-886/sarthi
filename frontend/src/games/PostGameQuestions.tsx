import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';

interface Question {
    id: string;
    text: string;
    scale_low: string;
    scale_high: string;
    reverse: boolean;
}

interface PostGameQuestionsProps {
    gameId: string;
    score: number;
    accuracy?: number;
    reactionTime?: number;
    mistakes?: number;
    completionTime?: number;
    levelReached?: number;
    onComplete: (result: {
        stressScore: number;
        stressLevel: string;
        stressPercentage: number;
        riskFlag: boolean;
        riskMessage?: string;
    }) => void;
}

const STRESS_LEVEL_CONFIG = {
    low: { color: '#10b981', bg: '#ecfdf5', label: '😊 Low', bar: 'bg-emerald-400' },
    moderate: { color: '#f59e0b', bg: '#fffbeb', label: '😐 Moderate', bar: 'bg-amber-400' },
    high: { color: '#f97316', bg: '#fff7ed', label: '😤 High', bar: 'bg-orange-400' },
};

const LIKERT_LABELS = ['', 'Not at all', 'Rarely', 'Sometimes', 'Often', 'Very Often'];
const LIKERT_COLORS = ['', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

export default function PostGameQuestions({
    gameId, score, accuracy, reactionTime, mistakes, completionTime, levelReached, onComplete
}: PostGameQuestionsProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [currentQ, setCurrentQ] = useState(0);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await api.getQuestionsForGame(gameId);
                setQuestions(res.questions || []);
            } catch {
                // Fallback: show generic 2-question set
                setQuestions([
                    { id: 'question_overwhelm', text: 'How stressed did you feel during this activity?', scale_low: 'Not at all', scale_high: 'Very Often', reverse: false },
                    { id: 'question_frustration', text: 'Did you feel frustrated at any point?', scale_low: 'Not at all', scale_high: 'Very Often', reverse: false },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [gameId]);

    const handleAnswer = (questionId: string, value: number) => {
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
        if (!allAnswered || submitting) return;
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
        } catch (e) {
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
        } finally {
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
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-purple-100">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full"
                />
            </div>
        );
    }

    // ── Result View ──────────────────────────────────────────────────────────
    if (result) {
        const cfg = STRESS_LEVEL_CONFIG[result.stress_level as keyof typeof STRESS_LEVEL_CONFIG] || STRESS_LEVEL_CONFIG.moderate;
        const pct = result.stress_percentage ?? 0;

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 px-4 py-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.35 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 text-center">
                            <div className="text-white/70 text-sm font-medium mb-1">Check-In Complete</div>
                            <div className="text-white text-4xl font-black">{Math.round(score)}</div>
                            <div className="text-white/70 text-sm mt-1">game score</div>
                        </div>

                        <div className="p-8">
                            {/* Stress Meter */}
                            <div className="text-center mb-6">
                                <div className="text-stone-500 text-sm mb-2 font-medium">Psychological Stress Level</div>
                                <div
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold mb-4"
                                    style={{ background: cfg.bg, color: cfg.color }}
                                >
                                    {cfg.label}
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${cfg.bar}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                    />
                                    <div
                                        className="absolute top-0 h-full flex items-center pl-3 text-white text-xs font-bold"
                                        style={{ left: `${Math.min(pct, 85)}%` }}
                                    >
                                        {Math.round(pct)}%
                                    </div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-stone-400">
                                    <span>Low (0–30%)</span>
                                    <span>Moderate (31–60%)</span>
                                    <span>Severe (81–100%)</span>
                                </div>
                            </div>

                            {/* Risk Alert */}
                            {result.risk_flag && result.risk_message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex gap-3"
                                >
                                    <span className="text-2xl">💛</span>
                                    <p className="text-rose-700 text-sm">{result.risk_message}</p>
                                </motion.div>
                            )}

                            {/* Insight */}
                            <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-center">
                                <p className="text-purple-700 text-sm font-medium">
                                    {pct <= 30 && "You're doing great! Low stress detected. Keep it up 🌟"}
                                    {pct > 30 && pct <= 60 && "Moderate stress detected. Taking short breaks may help 🌿"}
                                    {pct > 60 && pct <= 80 && "High stress signs detected. Be kind to yourself today 💛"}
                                    {pct > 80 && "Significant stress detected. Consider talking to Sarthi 🌸"}
                                </p>
                            </div>

                            <motion.button
                                onClick={handleContinue}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue 🎯
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Question View ────────────────────────────────────────────────────────
    const q = questions[currentQ];
    const progress = Math.round(((currentQ + (answers[q?.id] !== undefined ? 1 : 0)) / questions.length) * 100);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Progress Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 pt-6 pb-4">
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-white font-bold text-lg">🧠 Quick Check-In</div>
                            <div className="text-white/80 text-sm font-medium">
                                {currentQ + 1} / {questions.length}
                            </div>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white rounded-full"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                        <div className="mt-2 text-white/60 text-xs">
                            Two short questions to help track your wellbeing 💛
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Question */}
                        <AnimatePresence mode="wait">
                            {q && (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <p className="text-stone-700 font-semibold text-lg mb-6 leading-relaxed">
                                        {q.text}
                                    </p>

                                    {/* Likert Scale Buttons */}
                                    <div className="grid grid-cols-5 gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map(val => {
                                            const selected = answers[q.id] === val;
                                            const color = LIKERT_COLORS[val];
                                            return (
                                                <motion.button
                                                    key={val}
                                                    onClick={() => handleAnswer(q.id, val)}
                                                    className="relative flex flex-col items-center py-4 rounded-2xl border-2 font-bold text-xl transition-all"
                                                    style={{
                                                        borderColor: selected ? color : '#e2e8f0',
                                                        background: selected ? color : 'white',
                                                        color: selected ? 'white' : '#94a3b8',
                                                        boxShadow: selected ? `0 4px 16px ${color}55` : 'none',
                                                    }}
                                                    whileHover={{ scale: 1.08, y: -2 }}
                                                    whileTap={{ scale: 0.93 }}
                                                >
                                                    {val}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Scale labels */}
                                    <div className="flex justify-between text-xs text-stone-400 mb-6 px-1">
                                        <span>{q.scale_low}</span>
                                        <span>{q.scale_high}</span>
                                    </div>

                                    {/* Selected label */}
                                    <AnimatePresence>
                                        {answers[q.id] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-center mb-4"
                                            >
                                                <span
                                                    className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                                                    style={{
                                                        background: `${LIKERT_COLORS[answers[q.id]]}15`,
                                                        color: LIKERT_COLORS[answers[q.id]],
                                                    }}
                                                >
                                                    {LIKERT_LABELS[answers[q.id]]}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-2">
                            {currentQ > 0 && (
                                <motion.button
                                    onClick={() => setCurrentQ(q => q - 1)}
                                    className="flex-none px-5 py-3 bg-stone-100 text-stone-600 rounded-2xl font-semibold"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    ← Back
                                </motion.button>
                            )}

                            {currentQ < questions.length - 1 ? (
                                <motion.button
                                    onClick={() => setCurrentQ(q => q + 1)}
                                    disabled={!answers[q?.id]}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-semibold disabled:opacity-40"
                                    whileHover={{ scale: answers[q?.id] ? 1.02 : 1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Next →
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered || submitting}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold disabled:opacity-40 shadow-lg"
                                    whileHover={{ scale: allAnswered ? 1.02 : 1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {submitting ? 'Submitting…' : 'Submit & See Results ✨'}
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
