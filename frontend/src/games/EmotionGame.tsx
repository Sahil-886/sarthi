import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionGameProps {
    onComplete: (score: number) => void;
    onBack: () => void;
}

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

function shuffleOptions(options: string[]) {
    return [...options].sort(() => Math.random() - 0.5);
}

export default function EmotionGame({ onComplete, onBack }: EmotionGameProps) {
    const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
    const [questions] = useState(() => EMOTIONS.map(e => ({ ...e, options: shuffleOptions(e.options) })));
    const [current, setCurrent] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleAnswer = (option: string) => {
        if (selected) return;
        setSelected(option);
        setShowResult(true);
        const isCorrect = option === questions[current].label;
        if (isCorrect) setCorrect(c => c + 1);

        setTimeout(() => {
            setShowResult(false);
            setSelected(null);
            if (current + 1 >= questions.length) {
                const score = Math.round(((isCorrect ? correct + 1 : correct) / questions.length) * 100);
                onComplete(score);
            } else {
                setCurrent(c => c + 1);
            }
        }, 1100);
    };

    const q = questions[current];
    const OPTION_COLORS = ['bg-purple-100 text-purple-700 border-purple-200', 'bg-pink-100 text-pink-700 border-pink-200', 'bg-blue-100 text-blue-700 border-blue-200', 'bg-green-100 text-green-700 border-green-200'];

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-yellow-50 to-white py-10 px-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-purple-600 hover:text-purple-800 font-medium">← Back</button>
                    <h1 className="text-2xl font-bold text-gray-800">😊 Emotion Recognition</h1>
                    <div className="text-sm text-gray-500">{current + 1}/{questions.length}</div>
                </div>

                <div className="w-full bg-yellow-100 rounded-full h-2 mb-8">
                    <motion.div className="bg-yellow-500 h-2 rounded-full" animate={{ width: `${(current / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>

                {phase === 'intro' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-6xl mb-4">😊😢😠😨</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Emotion Recognition</h2>
                        <p className="text-gray-500 mb-6 leading-relaxed">An emoji will appear. Select the emotion it expresses from 4 options.</p>
                        <div className="bg-yellow-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">10 questions • Score based on correct answers</div>
                        <motion.button onClick={() => setPhase('playing')} className="w-full py-4 bg-yellow-500 text-white rounded-2xl font-semibold text-lg hover:bg-yellow-600 transition" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            Start Game
                        </motion.button>
                    </motion.div>
                )}

                {phase === 'playing' && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-3xl shadow-lg p-8 text-center"
                        >
                            <motion.div
                                className="text-8xl mb-6 select-none"
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                            >
                                {q.emoji}
                            </motion.div>
                            <p className="text-gray-500 text-lg mb-6 font-medium">What emotion is this?</p>

                            <div className="grid grid-cols-2 gap-3">
                                {q.options.map((option, i) => {
                                    const isCorrect = option === q.label;
                                    const isSelected = selected === option;
                                    let borderCls = '';
                                    if (showResult && isSelected && isCorrect) borderCls = 'bg-green-100 border-green-500 text-green-700 scale-105';
                                    else if (showResult && isSelected && !isCorrect) borderCls = 'bg-red-100 border-red-500 text-red-700';
                                    else if (showResult && isCorrect) borderCls = 'bg-green-50 border-green-400 text-green-600';

                                    return (
                                        <motion.button
                                            key={option}
                                            onClick={() => handleAnswer(option)}
                                            disabled={!!selected}
                                            className={`py-4 px-3 rounded-2xl border-2 font-semibold text-base transition-all duration-200 ${borderCls || OPTION_COLORS[i]}`}
                                            whileHover={{ scale: !selected ? 1.04 : 1 }}
                                            whileTap={{ scale: !selected ? 0.96 : 1 }}
                                        >
                                            {option}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex justify-center gap-2">
                                {questions.map((_, i) => (
                                    <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < current ? 'bg-yellow-400' : i === current ? 'bg-yellow-600 scale-125' : 'bg-gray-200'}`} />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
