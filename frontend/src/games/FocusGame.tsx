import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FocusGameProps {
    onComplete: (score: number, extra?: any) => void;
    onBack: () => void;
}

const TOTAL_ATTEMPTS = 10;
const DOT_SIZE = 60;
const MOVE_INTERVAL = 1400;

export default function FocusGame({ onComplete, onBack }: FocusGameProps) {
    const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
    const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
    const [hits, setHits] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [clicked, setClicked] = useState(false);
    const [missed, setMissed] = useState(false);
    const areaRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
            if (timerRef.current) clearInterval(timerRef.current);
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

    const handleDotClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phase !== 'playing' || clicked) return;
        setClicked(true);
        hitsRef.current += 1;
        setHits(h => h + 1);
    };

    const handleAreaClick = () => {
        if (phase !== 'playing' || clicked) {
            setMissed(true);
        }
    };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium">← Back</button>
                    <h1 className="text-2xl font-bold text-gray-800">🎯 Focus Tracking</h1>
                    <div className="text-sm text-gray-500">
                        {phase === 'playing' ? `${attempt}/${TOTAL_ATTEMPTS}` : ''}
                    </div>
                </div>

                <div className="w-full bg-blue-100 rounded-full h-2 mb-8">
                    <motion.div className="bg-blue-500 h-2 rounded-full" animate={{ width: `${(attempt / TOTAL_ATTEMPTS) * 100}%` }} transition={{ duration: 0.3 }} />
                </div>

                {phase === 'intro' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Focus Tracking</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            A purple dot will appear in a box. Click it before it moves!<br />
                            10 attempts — stay focused!
                        </p>
                        <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">
                            10 attempts • Dot moves every 1.4 seconds
                        </div>
                        <motion.button onClick={startGame} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-lg hover:bg-blue-600 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {phase === 'playing' && (
                    <div>
                        <div className="flex justify-between mb-4">
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold">✓ {hits} Hits</div>
                            <div className="bg-red-100 text-red-500 px-4 py-2 rounded-xl font-semibold">✗ {attempt - hits} Missed</div>
                        </div>

                        <div
                            ref={areaRef}
                            onClick={handleAreaClick}
                            className="relative bg-white rounded-3xl shadow-xl border-2 border-blue-200 overflow-hidden"
                            style={{ height: 320, cursor: 'crosshair' }}
                        >
                            <AnimatePresence>
                                {!clicked && (
                                    <motion.div
                                        key={`${dotPos.x}-${dotPos.y}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        onClick={handleDotClick}
                                        className="absolute cursor-pointer rounded-full shadow-lg flex items-center justify-center"
                                        style={{
                                            width: DOT_SIZE,
                                            height: DOT_SIZE,
                                            left: `calc(${dotPos.x}% - ${DOT_SIZE / 2}px)`,
                                            top: `calc(${dotPos.y}% - ${DOT_SIZE / 2}px)`,
                                            background: 'radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed)',
                                            boxShadow: '0 0 20px #7c3aed88',
                                        }}
                                    >
                                        <span className="text-white text-xl">●</span>
                                    </motion.div>
                                )}
                                {clicked && (
                                    <motion.div
                                        key="hit"
                                        initial={{ scale: 0.5, opacity: 1 }}
                                        animate={{ scale: 2.5, opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute rounded-full"
                                        style={{
                                            width: DOT_SIZE,
                                            height: DOT_SIZE,
                                            left: `calc(${dotPos.x}% - ${DOT_SIZE / 2}px)`,
                                            top: `calc(${dotPos.y}% - ${DOT_SIZE / 2}px)`,
                                            background: '#10b981',
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {missed && (
                                <motion.div
                                    key="miss-flash"
                                    initial={{ opacity: 0.3 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 bg-red-400 rounded-3xl pointer-events-none"
                                />
                            )}

                            {!clicked && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-1 bg-blue-400 rounded-full"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: MOVE_INTERVAL / 1000, ease: 'linear' }}
                                    key={`${dotPos.x}-${dotPos.y}-timer`}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
