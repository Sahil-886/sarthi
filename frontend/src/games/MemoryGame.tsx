import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryGameProps {
    onComplete: (score: number) => void;
    onBack: () => void;
}

const COLORS = ['#7c3aed', '#ec4899', '#0ea5e9', '#10b981'];
const COLOR_NAMES = ['Purple', 'Pink', 'Blue', 'Green'];
const COLOR_LIGHT = ['#ede9fe', '#fce7f3', '#e0f2fe', '#d1fae5'];
const MAX_ROUNDS = 8;

type Phase = 'intro' | 'showing' | 'input' | 'feedback' | 'results';

export default function MemoryGame({ onComplete, onBack }: MemoryGameProps) {
    const [phase, setPhase] = useState<Phase>('intro');
    const [sequence, setSequence] = useState<number[]>([]);
    const [userInput, setUserInput] = useState<number[]>([]);
    const [highlighted, setHighlighted] = useState<number | null>(null);
    const [round, setRound] = useState(0);
    const [correctRounds, setCorrectRounds] = useState(0);
    const [feedbackOk, setFeedbackOk] = useState(true);
    const [showFeedback, setShowFeedback] = useState(false);

    const playSequence = useCallback(async (seq: number[]) => {
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

    const startNextRound = useCallback((currentRound: number, seq: number[]) => {
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

    const handleColorClick = (idx: number) => {
        if (phase !== 'input') return;
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
                } else {
                    startNextRound(round, sequence);
                }
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-pink-50 to-white py-10 px-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium">← Back</button>
                    <h1 className="text-2xl font-bold text-gray-800">🎯 Memory Pattern</h1>
                    <div className="text-sm text-gray-500">Round {round}/{MAX_ROUNDS}</div>
                </div>

                <div className="w-full bg-purple-100 rounded-full h-2 mb-8">
                    <motion.div className="bg-pink-500 h-2 rounded-full" animate={{ width: `${(round / MAX_ROUNDS) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>

                {phase === 'intro' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-6xl mb-4">🧠</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Memory Pattern</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">Watch the color sequence, then repeat it. Each round adds one more step!</p>
                        <div className="bg-pink-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">Up to 8 rounds • One wrong move ends the game</div>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {COLORS.map((c, i) => (
                                <div key={i} className="rounded-2xl py-4 text-white font-semibold text-center" style={{ backgroundColor: c }}>
                                    {COLOR_NAMES[i]}
                                </div>
                            ))}
                        </div>
                        <motion.button onClick={handleStart} className="w-full py-4 bg-pink-500 text-white rounded-2xl font-semibold text-lg hover:bg-pink-600 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {(phase === 'showing' || phase === 'input' || phase === 'feedback') && (
                    <div className="text-center">
                        <AnimatePresence mode="wait">
                            {phase === 'showing' && (
                                <motion.p key="watch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-600 text-lg mb-4">
                                    👀 Watch the sequence…
                                </motion.p>
                            )}
                            {phase === 'input' && (
                                <motion.p key="repeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-purple-700 text-lg font-semibold mb-4">
                                    Tap the sequence! ({userInput.length}/{sequence.length})
                                </motion.p>
                            )}
                            {showFeedback && feedbackOk && (
                                <motion.p key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-green-600 text-xl font-bold mb-4">
                                    ✓ Correct!
                                </motion.p>
                            )}
                            {showFeedback && !feedbackOk && (
                                <motion.p key="fail" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-red-500 text-xl font-bold mb-4">
                                    ✗ Wrong! Game over.
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {COLORS.map((color, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => handleColorClick(idx)}
                                    disabled={phase !== 'input'}
                                    className="rounded-3xl py-12 font-bold text-xl text-white shadow-lg transition relative overflow-hidden"
                                    style={{
                                        backgroundColor: highlighted === idx ? color : COLOR_LIGHT[idx],
                                        color: highlighted === idx ? 'white' : color,
                                        border: `3px solid ${color}`,
                                    }}
                                    whileHover={{ scale: phase === 'input' ? 1.04 : 1 }}
                                    whileTap={{ scale: 0.94 }}
                                    animate={{ scale: highlighted === idx ? 1.06 : 1, boxShadow: highlighted === idx ? `0 0 30px ${color}88` : 'none' }}
                                >
                                    {COLOR_NAMES[idx]}
                                </motion.button>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-center gap-2">
                            {sequence.map((_s, i) => (
                                <div
                                    key={i}
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{ backgroundColor: i < userInput.length ? COLORS[sequence[i]] : 'transparent', borderColor: COLORS[sequence[i]] }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
