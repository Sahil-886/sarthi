import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionGameProps {
    onComplete: (score: number, extra?: any) => void;
    onBack: () => void;
}

type Phase = 'intro' | 'waiting' | 'ready' | 'clicked' | 'results';

const ROUNDS = 5;
const MIN_DELAY = 1500;
const MAX_DELAY = 4000;

export default function ReactionGame({ onComplete, onBack }: ReactionGameProps) {
    const [phase, setPhase] = useState<Phase>('intro');
    const [round, setRound] = useState(0);
    const [reactionTimes, setReactionTimes] = useState<number[]>([]);
    const [earlyClickCount, setEarlyClickCount] = useState(0);
    const [lastClickedEarly, setLastClickedEarly] = useState(false);
    const [currentReaction, setCurrentReaction] = useState<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
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
            } else {
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

    return (
        <div className="flex flex-col items-center min-h-screen bg-amber-50 py-10 px-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">⚡ Reaction Speed</h1>
                    <div className="text-sm text-gray-500">Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-purple-100 rounded-full h-2 mb-8">
                    <motion.div
                        className="bg-purple-600 h-2 rounded-full"
                        animate={{ width: `${(round / ROUNDS) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 shadow-lg text-center"
                    >
                        <div className="text-6xl mb-4">⚡</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Reaction Speed Test</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            The circle will turn <span className="text-purple-600 font-semibold">purple</span> after a random delay.<br />
                            Click it as fast as you can! Don't click too early.
                        </p>
                        <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">
                            5 rounds • Score based on average reaction time
                        </div>
                        <motion.button
                            onClick={() => { setRound(0); startRound(); }}
                            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-semibold text-lg hover:bg-purple-700 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {(phase === 'waiting' || phase === 'ready' || phase === 'clicked') && (
                    <div className="text-center">
                        <AnimatePresence mode="wait">
                            {phase === 'waiting' && (
                                <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-gray-500 text-lg mb-6">Wait for it…</motion.p>
                            )}
                            {phase === 'ready' && (
                                <motion.p key="now" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="text-purple-700 text-2xl font-bold mb-6">CLICK NOW! 🎯</motion.p>
                            )}
                            {phase === 'clicked' && !lastClickedEarly && currentReaction !== null && (
                                <motion.p key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-green-600 text-xl font-semibold mb-6">
                                    {Math.round(currentReaction)} ms ✓
                                </motion.p>
                            )}
                            {phase === 'clicked' && lastClickedEarly && (
                                <motion.p key="early" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-red-500 text-xl font-semibold mb-6">
                                    Too early! Try again
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="w-56 h-56 rounded-full mx-auto cursor-pointer shadow-2xl flex items-center justify-center select-none"
                            style={{ backgroundColor: circleColor }}
                            animate={{ scale: phase === 'ready' ? [1, 1.05, 1] : 1 }}
                            transition={{ repeat: phase === 'ready' ? Infinity : 0, duration: 0.5 }}
                            onClick={handleClick}
                        >
                            {phase === 'waiting' && <span className="text-purple-300 text-4xl">●</span>}
                            {phase === 'ready' && <span className="text-white text-4xl">⚡</span>}
                            {phase === 'clicked' && !lastClickedEarly && <span className="text-white text-4xl">✓</span>}
                            {phase === 'clicked' && lastClickedEarly && <span className="text-white text-4xl">✗</span>}
                        </motion.div>

                        {reactionTimes.length > 0 && (
                            <div className="mt-8 bg-white rounded-2xl p-4 shadow-sm">
                                <p className="text-sm text-gray-500 mb-2">Average so far</p>
                                <p className="text-2xl font-bold text-purple-700">{avgTime} ms</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
