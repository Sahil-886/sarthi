import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StressMeter from '../components/StressMeter';

interface GameResultProps {
    gameType: string;
    score: number;
    stressScore: number;
    stressLevel: string;
    onPlayAgain: () => void;
}

const LEVEL_EMOJI: Record<string, string> = { low: '😊', moderate: '😐', high: '😰' };
const LEVEL_COLOR: Record<string, string> = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444' };
const LEVEL_MSG: Record<string, string> = {
    low: 'Great job! You seem relaxed and focused.',
    moderate: "You're doing okay \u2014 take a short break if needed.",
    high: 'You seem stressed. Consider a breathing exercise.',
};

export default function GameResult({ gameType, score, stressScore, stressLevel, onPlayAgain }: GameResultProps) {
    const navigate = useNavigate();
    const level = stressLevel?.toLowerCase() || 'low';

    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex flex-col items-center min-h-screen bg-amber-50 py-10 px-4">
            <div className="w-full max-w-lg">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-white rounded-3xl shadow-xl p-8 text-center"
                >
                    {/* Score ring */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-36 h-36">
                            <svg width="144" height="144" viewBox="0 0 144 144" className="rotate-[-90deg]">
                                <circle cx="72" cy="72" r="60" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                                <motion.circle
                                    cx="72" cy="72" r="60"
                                    fill="none"
                                    stroke={scoreColor}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray="377"
                                    initial={{ strokeDashoffset: 377 }}
                                    animate={{ strokeDashoffset: 377 - (377 * score) / 100 }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black" style={{ color: scoreColor }}>{Math.round(score)}</span>
                                <span className="text-gray-400 text-xs">/ 100</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                        {score >= 70 ? '🎉 Excellent!' : score >= 40 ? '👍 Good Job!' : '💪 Keep Going!'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 capitalize">{gameType.replace(/_/g, ' ')} Complete</p>

                    {/* Stress meter */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{LEVEL_EMOJI[level]}</span>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-700">Stress Assessment</p>
                                <p className="text-xs text-gray-500">{LEVEL_MSG[level]}</p>
                            </div>
                        </div>
                        <StressMeter stressScore={stressScore} />
                    </div>

                    {/* Stress level badge */}
                    <div
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                        style={{ backgroundColor: `${LEVEL_COLOR[level]}22`, color: LEVEL_COLOR[level] }}
                    >
                        Stress: {stressLevel?.charAt(0).toUpperCase() + stressLevel?.slice(1)} ({Math.round(stressScore)}/100)
                    </div>

                    <div className="flex flex-col gap-3">
                        <motion.button
                            onClick={onPlayAgain}
                            className="w-full py-3.5 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Play Again
                        </motion.button>
                        <motion.button
                            onClick={() => navigate('/games')}
                            className="w-full py-3.5 border-2 border-purple-200 text-purple-700 rounded-2xl font-semibold hover:bg-purple-50 transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Other Games
                        </motion.button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-400 text-sm py-2 hover:text-gray-600 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
