import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DecisionGameProps {
    onComplete: (score: number, extra?: any) => void;
    onBack: () => void;
}

const QUESTIONS = [
    { prompt: 'You find a wallet with €200 and an ID.', a: 'Return it', b: 'Keep the money', correct: 'A' },
    { prompt: 'Your friend asks you to cover for their lie.', a: 'Agree to help', b: 'Stay honest', correct: 'B' },
    { prompt: 'You can skip a meeting if you work overtime later.', a: 'Skip the meeting', b: 'Attend normally', correct: 'A' },
    { prompt: 'A colleague takes credit for your idea.', a: 'Confront them calmly', b: 'Say nothing', correct: 'A' },
    { prompt: 'You see someone drop litter in the park.', a: 'Ignore them', b: 'Politely ask them to pick it up', correct: 'B' },
    { prompt: 'A shortcut will save 20 mins but breaks a small rule.', a: 'Take the shortcut', b: 'Follow the rules', correct: 'B' },
    { prompt: 'Your team is behind deadline. Do you?', a: 'Work overtime', b: 'Re-scope deliverables', correct: 'B' },
    { prompt: 'A friend needs help moving — you have plans.', a: 'Cancel your plans', b: 'Politely decline', correct: 'A' },
    { prompt: 'You receive extra change by mistake at a store.', a: 'Keep it quietly', b: 'Return it to the cashier', correct: 'B' },
    { prompt: 'You\'re asked to give honest feedback on bad work.', a: 'Be gently honest', b: 'Only say positives', correct: 'A' },
];

const TIME_PER_Q = 5;

export default function DecisionGame({ onComplete, onBack }: DecisionGameProps) {
    const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(0);

    const stopTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const nextQuestion = (newScore: number, idx: number) => {
        stopTimer();
        if (idx + 1 >= QUESTIONS.length) {
            setTimeout(() => onComplete(Math.round(newScore), { accuracy: 100 }), 1000);
        } else {
            setTimeout(() => {
                setCurrent(idx + 1);
                setAnswered(null);
                startTimer(idx + 1, newScore);
            }, 900);
        }
    };

    const startTimer = (idx: number, currentScore: number) => {
        stopTimer();
        startTimeRef.current = performance.now();
        timerRef.current = setTimeout(() => {
            setAnswered('timeout');
            nextQuestion(currentScore, idx);
        }, TIME_PER_Q * 1000);
    };

    const handleAnswer = (choice: 'A' | 'B') => {
        if (answered) return;
        stopTimer();
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const speedBonus = Math.max(0, 1 - elapsed / TIME_PER_Q);
        const q = QUESTIONS[current];
        const isCorrect = choice === q.correct;
        const pointsGained = isCorrect ? (50 + Math.round(speedBonus * 50)) : 0;
        const newScore = score + pointsGained;
        setScore(newScore);
        setAnswered(choice);
        nextQuestion(newScore, current);
    };

    const startGame = () => {
        setPhase('playing');
        setCurrent(0);
        setScore(0);
        setAnswered(null);
        startTimer(0, 0);
    };

    useEffect(() => () => stopTimer(), []);

    const q = QUESTIONS[current];

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-orange-50 to-white py-10 px-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium">← Back</button>
                    <h1 className="text-2xl font-bold text-gray-800">⚖️ Decision Making</h1>
                    <div className="text-sm text-gray-500">{phase === 'playing' ? `${current + 1}/${QUESTIONS.length}` : ''}</div>
                </div>

                <div className="w-full bg-orange-100 rounded-full h-2 mb-8">
                    <motion.div className="bg-orange-500 h-2 rounded-full" animate={{ width: `${(current / QUESTIONS.length) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>

                {phase === 'intro' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-6xl mb-4">⚖️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Decision Making</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">Read each scenario and pick the best choice under time pressure. Faster decisions earn bonus points!</p>
                        <div className="bg-orange-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">10 questions • 5 seconds per question • Speed bonus</div>
                        <motion.button onClick={startGame} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-semibold text-lg hover:bg-orange-600 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {phase === 'playing' && (
                    <AnimatePresence mode="popLayout">
                        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, scale: 0.95 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl shadow-lg p-8">

                            {/* Smooth CSS-driven Timer bar (no React re-renders) */}
                            <div className="mb-6 relative">
                                <div className="flex justify-between text-sm text-gray-500 mb-2">
                                    <span>Time Remaining</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        key={`timer-${current}`}
                                        initial={{ width: '100%', backgroundColor: '#10b981' }}
                                        animate={!answered ? { width: '0%', backgroundColor: '#ef4444' } : {}}
                                        transition={{ duration: TIME_PER_Q, ease: 'linear' }}
                                        className="h-3 rounded-full"
                                    />
                                </div>
                            </div>

                            <p className="text-gray-800 font-semibold text-xl mb-8 leading-snug">{q.prompt}</p>

                            <div className="flex flex-col gap-4">
                                {(['A', 'B'] as const).map(choice => {
                                    const label = choice === 'A' ? q.a : q.b;
                                    const isCorrect = choice === q.correct;
                                    const isSelected = answered === choice;
                                    let cls = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300';

                                    if (answered) {
                                        if (isSelected && isCorrect) cls = 'bg-green-100 border-green-500 text-green-800 shadow-sm';
                                        else if (isSelected && !isCorrect) cls = 'bg-red-50 border-red-400 text-red-800 opacity-90';
                                        else if (isCorrect) cls = 'bg-green-50 border-green-300 text-green-700 outline outline-2 outline-green-400 opacity-90';
                                        else cls = 'bg-gray-50 border-gray-200 text-gray-400 opacity-50';
                                    }

                                    return (
                                        <motion.button
                                            key={choice}
                                            onClick={() => handleAnswer(choice)}
                                            disabled={!!answered}
                                            className={`w-full py-5 px-6 rounded-2xl border-2 font-medium text-left transition-all duration-200 text-lg ${cls}`}
                                            whileHover={{ scale: !answered ? 1.01 : 1 }}
                                            whileTap={{ scale: !answered ? 0.99 : 1 }}
                                        >
                                            <span className="font-bold opacity-50 mr-3">{choice}.</span>
                                            {label}
                                        </motion.button>
                                    );
                                })}
                                {answered === 'timeout' && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-500 font-semibold mt-4">
                                        ⏱ Time's up!
                                    </motion.p>
                                )}
                            </div>

                            <div className="mt-8 text-center pt-4 border-t border-gray-100">
                                <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Current Score</span>
                                <div className="text-orange-500 font-bold text-3xl mt-1">{score}</div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
