import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PersistenceGameProps {
    onComplete: (score: number, extra?: any) => void;
    onBack: () => void;
}

const LEVELS = 5;
const INITIAL_FILL_RATE = 0.8; // % per 100ms
const DRAIN_RATES = [0.6, 0.9, 1.3, 1.8, 2.5]; // increasing drain per level

export default function PersistenceGame({ onComplete, onBack }: PersistenceGameProps) {
    const [phase, setPhase] = useState<'intro' | 'playing' | 'levelUp' | 'fail' | 'done'>('intro');
    const [fill, setFill] = useState(0);
    const [level, setLevel] = useState(1);
    const [highestLevel, setHighestLevel] = useState(0);
    const [holding, setHolding] = useState(false);
    const holdingRef = useRef(false);
    const fillRef = useRef(0);
    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    const DRAIN = DRAIN_RATES[Math.min(level - 1, DRAIN_RATES.length - 1)];
    const TARGET = 100;
    const FAIL_THRESHOLD = 0;

    const startAnimation = () => {
        const tick = (time: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = time - lastTimeRef.current;
            lastTimeRef.current = time;

            if (holdingRef.current) {
                fillRef.current = Math.min(TARGET, fillRef.current + INITIAL_FILL_RATE * (dt / 16));
            } else {
                fillRef.current = Math.max(FAIL_THRESHOLD, fillRef.current - DRAIN * (dt / 16));
            }
            setFill(fillRef.current);

            if (fillRef.current >= TARGET) {
                if (animRef.current) cancelAnimationFrame(animRef.current);
                if (level >= LEVELS) {
                    setHighestLevel(LEVELS);
                    setPhase('done');
                    setTimeout(() => onComplete(100), 800);
                } else {
                    setHighestLevel(level);
                    holdingRef.current = false;
                    setHolding(false);
                    setPhase('levelUp');
                }
                return;
            }
            if (fillRef.current <= FAIL_THRESHOLD && !holdingRef.current) {
                if (animRef.current) cancelAnimationFrame(animRef.current);
                setHighestLevel(prev => Math.max(prev, level - 1));
                setPhase('fail');
                return;
            }
            animRef.current = requestAnimationFrame(tick);
        };
        lastTimeRef.current = 0;
        animRef.current = requestAnimationFrame(tick);
    };

    const startLevel = (lvl: number) => {
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
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
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

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-green-50 to-white py-10 px-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium">← Back</button>
                    <h1 className="text-2xl font-bold text-gray-800">💪 Persistence</h1>
                    {phase === 'playing' && <div className="text-sm text-gray-500">Level {level}/{LEVELS}</div>}
                </div>

                <div className="w-full bg-green-100 rounded-full h-2 mb-8">
                    <motion.div className="bg-green-500 h-2 rounded-full" animate={{ width: `${((level - 1) / LEVELS) * 100}%` }} />
                </div>

                {phase === 'intro' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-6xl mb-4">💪</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Persistence Challenge</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            Press and hold the button to fill the bar to 100%. Release and it drains!<br />
                            The drain gets faster each level. Reach level {LEVELS}!
                        </p>
                        <div className="bg-green-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">5 levels • Fill bar to 100% to advance</div>
                        <motion.button onClick={() => startLevel(1)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold text-lg hover:bg-green-600 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {phase === 'playing' && (
                    <div className="text-center">
                        <div className="mb-2 text-gray-600 text-sm font-medium">
                            Level {level} — Drain rate: {DRAIN.toFixed(1)}x
                        </div>

                        {/* Fill bar */}
                        <div className="bg-gray-100 rounded-2xl h-16 mb-8 overflow-hidden relative border-2 border-gray-200 mx-4">
                            <motion.div
                                className="h-full rounded-2xl"
                                style={{ width: `${fill}%`, backgroundColor: fillColor, transition: 'background-color 0.3s' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-800 font-bold text-xl">{Math.round(fill)}%</span>
                            </div>
                        </div>

                        <motion.button
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onTouchStart={e => { e.preventDefault(); handlePressStart(); }}
                            onTouchEnd={handlePressEnd}
                            className="w-48 h-48 rounded-full text-white text-2xl font-bold shadow-2xl select-none mx-auto flex items-center justify-center"
                            style={{
                                background: holding
                                    ? 'radial-gradient(circle, #4ade80, #16a34a)'
                                    : 'radial-gradient(circle, #86efac, #22c55e)',
                                boxShadow: holding ? '0 0 40px #16a34a88' : '0 8px 32px #22c55e44',
                            }}
                            animate={{ scale: holding ? 0.93 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            {holding ? '⚡ Charging!' : 'HOLD'}
                        </motion.button>

                        <p className="mt-6 text-gray-500 text-sm">
                            {holding ? 'Filling…' : 'Press & hold to fill'}
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {phase === 'levelUp' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-3xl shadow-lg p-8 text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">Level {level} Complete!</h2>
                            <p className="text-gray-500 mb-6">Get ready for level {level + 1} — it gets faster!</p>
                            <motion.button onClick={() => startLevel(level + 1)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold text-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                Next Level →
                            </motion.button>
                        </motion.div>
                    )}

                    {phase === 'fail' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-3xl shadow-lg p-8 text-center">
                            <div className="text-6xl mb-4">😤</div>
                            <h2 className="text-2xl font-bold text-red-500 mb-2">Level {level} Failed!</h2>
                            <p className="text-gray-500 mb-2">You reached level <strong>{highestLevel}</strong> out of {LEVELS}.</p>
                            <p className="text-gray-500 mb-6 text-sm">Score: {finalScore}/100</p>
                            <div className="flex gap-3">
                                <motion.button onClick={() => startLevel(level)} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-semibold" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                    Retry Level
                                </motion.button>
                                <motion.button onClick={() => onComplete(finalScore, { levelReached: highestLevel })} className="flex-1 py-4 border-2 border-gray-300 text-gray-600 rounded-2xl font-semibold" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                    Submit Score
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {phase === 'done' && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-lg p-8 text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">Perfect Score!</h2>
                            <p className="text-gray-500 mb-6">You completed all {LEVELS} levels! Incredible persistence!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
