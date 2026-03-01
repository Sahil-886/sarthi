import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── LOCAL DATA ───────────────────────────────────────────────────────────────

const VIDEOS = [
  { id: 1, title: '5-Minute Meditation for Stress Relief', youtubeId: 'inpok4MKVLM', category: 'Meditation' },
  { id: 2, title: 'Breathing Technique for Anxiety', youtubeId: 'odADwWzHR24', category: 'Anxiety' },
  { id: 3, title: 'How to Stop Overthinking', youtubeId: 'ZToicYcHIOU', category: 'Overthinking' },
  { id: 4, title: 'Body Scan Meditation for Sleep', youtubeId: '15q-N-_kkrU', category: 'Sleep' },
  { id: 5, title: 'Morning Mindfulness Routine', youtubeId: 'U9YKY7fdwyg', category: 'Mindfulness' },
  { id: 6, title: 'Guided Visualization for Calm', youtubeId: '86m4RC_ADEY', category: 'Relaxation' },
];

const BOOKS = [
  {
    id: 1, title: 'The Power of Now', author: 'Eckhart Tolle', emoji: '⚡',
    description: 'A guide to spiritual enlightenment and living in the present moment.',
    category: 'Mindfulness', link: 'https://www.amazon.in/dp/8190105914',
  },
  {
    id: 2, title: 'Atomic Habits', author: 'James Clear', emoji: '🔁',
    description: 'Tiny changes that lead to remarkable results in your daily life.',
    category: 'Self-Improvement', link: 'https://www.amazon.in/dp/1847941834',
  },
  {
    id: 3, title: 'Feeling Good', author: 'David Burns', emoji: '😊',
    description: 'The clinically proven CBT-based approach to beating depression.',
    category: 'Depression', link: 'https://www.amazon.in/dp/0380810336',
  },
  {
    id: 4, title: 'The Anxiety and Worry Workbook', author: 'Clark & Beck', emoji: '🧘',
    description: 'Evidence-based techniques to break free from anxiety and worry.',
    category: 'Anxiety', link: 'https://www.amazon.in/dp/1606234358',
  },
  {
    id: 5, title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', emoji: '🌅',
    description: 'A Holocaust survivor\'s account of finding purpose in suffering.',
    category: 'Purpose', link: 'https://www.amazon.in/dp/8172234627',
  },
  {
    id: 6, title: 'The Midnight Library', author: 'Matt Haig', emoji: '📚',
    description: 'A life-affirming novel about regret, hope and infinite possibility.',
    category: 'Hope', link: 'https://www.amazon.in/dp/0525559477',
  },
];

// ── BREATHING CONFIG ──────────────────────────────────────────────────────────

const BREATHING_PHASES: Array<{ label: string; duration: number; scale: number; color: string }> = [
  { label: 'Inhale…', duration: 4000, scale: 1.45, color: '#6ee7b7' },
  { label: 'Hold…', duration: 4000, scale: 1.45, color: '#93c5fd' },
  { label: 'Exhale…', duration: 6000, scale: 1.0, color: '#c4b5fd' },
];

// ── TAB CONFIG ────────────────────────────────────────────────────────────────

type Tab = 'videos' | 'breathing' | 'books';
const TABS: { id: Tab; label: string; activeClass: string }[] = [
  { id: 'videos', label: '🎥 Videos', activeClass: 'bg-orange-500 text-white' },
  { id: 'breathing', label: '🌬️ Breathing', activeClass: 'bg-emerald-500 text-white' },
  { id: 'books', label: '📚 Books', activeClass: 'bg-amber-500 text-white' },
];

// ── BREATHING EXERCISE COMPONENT ──────────────────────────────────────────────

function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = BREATHING_PHASES[phaseIdx];

  const nextPhase = useCallback((currentIdx: number) => {
    const next = (currentIdx + 1) % BREATHING_PHASES.length;
    setPhaseIdx(next);
    setSeconds(0);
    timerRef.current = setTimeout(() => nextPhase(next), BREATHING_PHASES[next].duration);
  }, []);

  const start = () => {
    setRunning(true);
    setPhaseIdx(0);
    setSeconds(0);
    timerRef.current = setTimeout(() => nextPhase(0), BREATHING_PHASES[0].duration);
    tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stop = () => {
    setRunning(false);
    setPhaseIdx(0);
    setSeconds(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  useEffect(() => {
    if (running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phaseIdx, running]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const totalSec = Math.round(phase.duration / 1000);
  const progress = totalSec > 0 ? Math.min(seconds / totalSec, 1) : 0;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-xl font-bold text-stone-700 mb-1">4-4-6 Breathing Exercise</h2>
      <p className="text-stone-400 text-sm mb-10">Inhale 4s · Hold 4s · Exhale 6s</p>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Outer ripple */}
        {running && (
          <motion.div
            className="absolute rounded-full opacity-20"
            style={{ width: 260, height: 260, background: phase.color }}
            animate={{ scale: running ? [1, 1.15, 1] : 1 }}
            transition={{ duration: phase.duration / 1000, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* Main circle */}
        <motion.div
          className="rounded-full flex items-center justify-center shadow-xl cursor-pointer select-none"
          style={{
            width: 180, height: 180,
            background: `radial-gradient(circle at 35% 35%, ${phase.color}, #3b82f6)`,
          }}
          animate={{ scale: running ? phase.scale : 1 }}
          transition={{ duration: phase.duration / 1000, ease: 'easeInOut' }}
          onClick={running ? stop : start}
        >
          <div className="text-center text-white">
            {running ? (
              <>
                <div className="text-2xl font-bold">{phase.label}</div>
                <div className="text-sm opacity-80 mt-1">{totalSec - Math.min(seconds, totalSec)}s</div>
              </>
            ) : (
              <div className="text-3xl">🫁</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Progress bar */}
      {running && (
        <div className="w-64 h-1.5 bg-stone-200 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: phase.color }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Phase dots */}
      {running && (
        <div className="flex gap-3 mb-8">
          {BREATHING_PHASES.map((p, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${i === phaseIdx ? 'scale-125' : 'opacity-30'}`}
              style={{ background: p.color }}
            />
          ))}
        </div>
      )}

      <motion.button
        onClick={running ? stop : start}
        className={`px-8 py-3 rounded-2xl font-bold text-white shadow-md transition ${running ? 'bg-red-400 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-600'}`}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        {running ? '⏹ Stop' : '▶ Start Breathing Exercise'}
      </motion.button>

      {!running && (
        <p className="text-stone-400 text-xs mt-4">Click the circle or the button to begin · Click again to stop</p>
      )}

      {/* Technique tips */}
      <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg w-full">
        {[
          { emoji: '😌', label: 'Reduces Anxiety', sub: 'Calms your nervous system' },
          { emoji: '💤', label: 'Better Sleep', sub: 'Lowers cortisol levels' },
          { emoji: '🎯', label: 'Improves Focus', sub: 'Increases oxygen to brain' },
        ].map((b, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 text-center border border-stone-100 shadow-sm">
            <div className="text-2xl mb-1">{b.emoji}</div>
            <div className="text-xs font-bold text-stone-700">{b.label}</div>
            <div className="text-xs text-stone-400 mt-0.5">{b.sub}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function TherapyHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('videos');

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #fef9f0, #ecfdf5)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-stone-800 mb-1">Therapy at Home 🌿</h1>
            <p className="text-stone-500">Videos, breathing exercises and books for mental wellness</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-100 transition text-sm font-medium"
          >
            ← Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${activeTab === tab.id ? tab.activeClass + ' shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* VIDEOS TAB */}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {VIDEOS.map(video => (
                <motion.div
                  key={video.id}
                  className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-lg transition"
                  whileHover={{ y: -4 }}
                >
                  {/* YouTube embed */}
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{video.category}</span>
                    <h3 className="text-sm font-bold text-stone-800 mt-2">{video.title}</h3>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* BREATHING TAB */}
          {activeTab === 'breathing' && (
            <motion.div
              key="breathing"
              className="bg-white rounded-3xl border border-stone-100 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BreathingExercise />
            </motion.div>
          )}

          {/* BOOKS TAB */}
          {activeTab === 'books' && (
            <motion.div
              key="books"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {BOOKS.map(book => (
                <motion.div
                  key={book.id}
                  className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col shadow-sm hover:shadow-lg hover:border-amber-200 transition"
                  whileHover={{ y: -4 }}
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl mb-3">{book.emoji}</div>
                  <h3 className="text-base font-bold text-stone-800">{book.title}</h3>
                  <p className="text-xs text-stone-400 font-medium mb-2">by {book.author}</p>
                  <p className="text-sm text-stone-500 leading-relaxed flex-1 mb-4">{book.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-medium">{book.category}</span>
                    <a
                      href={book.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition"
                    >
                      View Book →
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
