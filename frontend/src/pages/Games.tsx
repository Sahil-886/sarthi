import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const GAMES = [
  {
    id: 'reaction_speed',
    name: 'Reaction Speed',
    description: 'Click when the circle turns purple. Test your neural response time across 5 rounds.',
    icon: '⚡',
    gradient: 'from-purple-500 to-violet-600',
    light: 'bg-purple-50 border-purple-200',
    duration: '~1 min',
    metric: 'Reaction time',
  },
  {
    id: 'memory_pattern',
    name: 'Memory Pattern',
    description: 'Watch the color sequence flash, then repeat it. Adds one step each round!',
    icon: '🧠',
    gradient: 'from-pink-500 to-rose-600',
    light: 'bg-pink-50 border-pink-200',
    duration: '~2 min',
    metric: 'Pattern accuracy',
  },
  {
    id: 'focus_tracking',
    name: 'Focus Tracking',
    description: 'A dot moves around a box. Click it before it disappears — 10 chances!',
    icon: '🎯',
    gradient: 'from-sky-600 to-blue-700',
    light: 'bg-sky-50 border-sky-200',
    duration: '~1 min',
    metric: 'Hit rate',
  },
  {
    id: 'emotional_recognition',
    name: 'Emotion Recognition',
    description: 'An emoji appears — pick the emotion it represents from 4 options.',
    icon: '😊',
    gradient: 'from-yellow-500 to-amber-600',
    light: 'bg-yellow-50 border-yellow-200',
    duration: '~1 min',
    metric: 'Accuracy %',
  },
  {
    id: 'decision_making',
    name: 'Decision Making',
    description: 'Moral dilemmas under a 5-second countdown. Speed + correct choice = max score.',
    icon: '⚖️',
    gradient: 'from-orange-500 to-red-600',
    light: 'bg-orange-50 border-orange-200',
    duration: '~1 min',
    metric: 'Speed × accuracy',
  },
  {
    id: 'persistence_challenge',
    name: 'Persistence',
    description: 'Press and hold to fill the bar before it drains. 5 levels of increasing difficulty.',
    icon: '💪',
    gradient: 'from-green-500 to-emerald-600',
    light: 'bg-green-50 border-green-200',
    duration: '~2 min',
    metric: 'Level reached',
  },
];

export default function Games() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-amber-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <motion.h1
              className="text-4xl font-black text-gray-900 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Cognitive Games 🎮
            </motion.h1>
            <motion.p
              className="text-gray-500 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Play a game to assess and improve your mental wellbeing.
            </motion.p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-purple-700 border-2 border-purple-200 rounded-xl hover:bg-purple-50 font-medium transition text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer border border-gray-100"
              onClick={() => navigate(`/games/${game.id}`)}
            >
              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${game.gradient} p-6 text-white`}>
                <div className="text-5xl mb-2">{game.icon}</div>
                <h3 className="text-xl font-bold">{game.name}</h3>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{game.description}</p>

                <div className="flex justify-between text-xs text-gray-400 mb-5">
                  <span className="flex items-center gap-1">⏱ {game.duration}</span>
                  <span className="flex items-center gap-1">📊 {game.metric}</span>
                </div>

                <motion.button
                  className={`w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r ${game.gradient} hover:opacity-90 transition`}
                  whileTap={{ scale: 0.97 }}
                  onClick={e => { e.stopPropagation(); navigate(`/games/${game.id}`); }}
                >
                  Play Now →
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm"
        >
          <h4 className="font-semibold text-gray-700 mb-2">💡 How it works</h4>
          <p className="text-gray-500 text-sm leading-relaxed">
            After each game, you'll answer 2 quick wellbeing questions. We combine your game performance
            with your self-report to calculate a personalised stress score, which updates your AI companion's awareness of your mood.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
