import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import { AIMessage } from '../types';
import Avatar3D from '../components/Avatar3D';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Emotion → emoji map
const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊', sad: '😢', angry: '😠', anxious: '😰',
  stressed: '😤', lonely: '🥺', frustrated: '😤', neutral: '😐',
};

// Sarthi's Voice — Indian-accent Browser TTS with graceful fallback
function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onBoundary?: (event: any) => void
) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // Sarthi voice settings — warm, soft, natural Indian cadence
  utterance.rate = 0.90;   // slightly slower for thoughtful Indian-English pacing
  utterance.pitch = 1.25;  // warm feminine pitch
  utterance.volume = 1.0;

  const selectVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    // 1. Explicit female Indian / female English voices (strictly NO male voices)
    const FEMALE_PREFERRED = [
      'microsoft heera',          // Windows Indian English female ✅
      'veena',                    // macOS Indian English female ✅
      'google uk english female', // Chrome UK female ✅
      'samantha',                 // macOS US female ✅
      'victoria',                 // macOS US female ✅
      'karen',                    // macOS AU female ✅
      'moira',                    // macOS IE female ✅
      'tessa',                    // macOS ZA female ✅
      'fiona',                    // macOS EN-GB female ✅
      'serena',                   // macOS female ✅
    ];

    let selected: SpeechSynthesisVoice | null = null;

    // Try exact preferred list first
    for (const name of FEMALE_PREFERRED) {
      selected = voices.find(v => v.name.toLowerCase().includes(name)) || null;
      if (selected) break;
    }

    // Fallback 1: any en-IN female voice
    if (!selected) {
      selected = voices.find(v => v.lang === 'en-IN' && /female|woman|girl/i.test(v.name)) || null;
    }

    // Fallback 2: any English female
    if (!selected) {
      selected = voices.find(v => v.lang.startsWith('en') && /female|woman|girl/i.test(v.name)) || null;
    }

    // Fallback 3: any voice that sounds female by name
    if (!selected) {
      selected = voices.find(v => /female|woman|girl|heera|veena|samantha|victoria|karen|moira|tessa/i.test(v.name)) || null;
    }

    if (selected) {
      utterance.voice = selected;
    } else {
      // Last resort: raise pitch significantly to feminize any voice
      utterance.pitch = 1.6;
    }
  };

  selectVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onBoundary) utterance.onboundary = onBoundary;

  window.speechSynthesis.speak(utterance);
}

// Typing dots component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-stone-100 w-fit">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-amber-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// Emergency / Safety Card functionality removed to simplify UI as requested.

// Audio Analyzer Hook for Lip Sync
function useAudioAnalyzer(active: boolean) {
  const [volume, setVolume] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active) {
      setVolume(0);
      return;
    }

    let animationFrame: number;
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        dataArrayRef.current = dataArray;

        const updateVolume = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const avg = sum / dataArrayRef.current.length;
          setVolume(avg);
          animationFrame = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) {
        console.error('Audio analyzer failed:', err);
      }
    };

    initAudio();
    return () => {
      cancelAnimationFrame(animationFrame);
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, [active]);

  return volume;
}

// Hook for Voice Emotion Detection (Tone Analysis)
function useVoiceEmotion(active: boolean, onEmotion: (emotion: string) => void) {
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(async () => {
      // In a real scenario, we'd capture a 2-second blob here
      // For this implementation, we'll simulate the call to demonstrate backend integration
      try {
        const mockAudioBlob = new Blob([new Uint8Array(1000)], { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', mockAudioBlob);

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai-companion/voice-emotion`, mockAudioBlob, {
          headers: { 'Content-Type': 'application/octet-stream' }
        });

        if (res.data.emotion) {
          onEmotion(res.data.emotion);
        }
      } catch (err) {
        console.error("Voice emotion detection failed:", err);
      }
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, [active, onEmotion]);
}

export default function AICompanion() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice on by default for better experience
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [isTalking, setIsTalking] = useState(false);
  const [talkingIntensity, setTalkingIntensity] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<'happy' | 'sad' | 'angry' | 'neutral' | 'anxious'>('neutral');
  const [helplines, setHelplines] = useState<{ name: string; phone: string; description: string }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Audio Analyzer for User Input
  const userVolume = useAudioAnalyzer(isListening);

  // Voice Emotion Detection
  useVoiceEmotion(isListening, (emotion) => {
    setCurrentEmotion(emotion as any);
  });

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 50); // Small buffer for DOM update
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const init = async () => {
      try {
        const [historyRes, helplinesRes] = await Promise.all([
          client.getConversationHistory(),
          client.getHelplines(),
        ]);
        setMessages(historyRes.conversations || []);
        setHelplines(helplinesRes.helplines || []);
      } catch {
        console.error('Init failed');
      }
    };
    init();
    // Pre-load voices
    window.speechSynthesis?.getVoices();
  }, []);

  // Ultra-Real Audio Sync logic
  const analyzeAudio = async (url: string) => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.onended = () => {
        setIsTalking(false);
        setTalkingIntensity(0);
        setAvatarState('idle');
        audioCtx.close();
      };

      source.start(0);
      setIsTalking(true);
      setAvatarState('speaking');

      const updateIntensity = () => {
        if (audioCtx.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setTalkingIntensity(volume / 128); // Normalize roughly to 0-1
        requestAnimationFrame(updateIntensity);
      };
      updateIntensity();
    } catch (err) {
      console.error("Audio Sync Error:", err);
      setIsTalking(false);
      setAvatarState('idle');
    }
  };

  const handleSend = useCallback(async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const msg = overrideMsg !== undefined ? overrideMsg : input.trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    // Optimistically show user bubble
    const optimisticUserMsg: AIMessage = {
      user_message: msg,
      ai_response: '',
      language,
      emotion_detected: undefined,
      helpline_required: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const response = await client.chatWithCompanion(msg, language, avatarEnabled);
      setMessages(prev => [...prev.slice(0, -1), { ...response, created_at: response.created_at || new Date().toISOString() }]);

      // Fire silent SMS alert when risk is detected
      if (response.risk_level === 'high' || response.risk_level === 'concern') {
        const alertType = response.risk_level === 'high' ? 'risk' : 'stress';
        client.sendAlert(alertType).catch(() => { }); // silent – never block chat
      }

      if (response.emotion_detected) {
        setCurrentEmotion(response.emotion_detected as any);
      }

      if (voiceEnabled && response.ai_response && !response.avatar_video_url) {
        // Try Ultra-Real Backend Voice
        try {
          const vBlob = await client.generateVoice(response.ai_response);
          if (vBlob && vBlob.size > 0) {
            const voiceUrl = URL.createObjectURL(vBlob);
            analyzeAudio(voiceUrl);
          } else {
            // Fallback to browser TTS with word-level boundary events for lip-sync
            speak(
              response.ai_response,
              () => { setIsTalking(true); setAvatarState('speaking'); },
              () => { setIsTalking(false); setAvatarState('idle'); setTalkingIntensity(0); },
              (event) => {
                // Approximate mouth opening based on charIndex/length/etc or just pulse
                if (event.name === 'word') {
                  setTalkingIntensity(0.5 + Math.random() * 0.5);
                  setTimeout(() => setTalkingIntensity(0), 100);
                }
              }
            );
          }
        } catch (vErr) {
          speak(response.ai_response, () => { setIsTalking(true); setAvatarState('speaking'); }, () => { setIsTalking(false); setAvatarState('idle'); });
        }
      } else {
        setAvatarState('idle');
      }
    } catch (err) {
      console.error('Chat failed:', err);
      setMessages(prev => [...prev.slice(0, -1), {
        user_message: msg,
        ai_response: "I'm having a little trouble right now. Please try again in a moment 💛",
        language,
        helpline_required: false,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
        scrollToBottom();
      }, 100);
    }
  }, [input, loading, language, avatarEnabled, voiceEnabled, scrollToBottom]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        transcriptRef.current = transcript;
        setInput(transcript);
        scrollToBottom();
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        transcriptRef.current = '';
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcriptRef.current) {
          handleSend(undefined, transcriptRef.current);
          transcriptRef.current = '';
        }
      };
    }
  }, [language, handleSend]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setAvatarState('idle');
    } else {
      setIsListening(true);
      setAvatarState('listening');
      transcriptRef.current = '';
      recognitionRef.current?.start();
    }
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      await client.clearConversationHistory();
      setMessages([]);
      window.speechSynthesis?.cancel();
    } catch (err) {
      console.error('Clear chat failed:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #fff0d4 100%)' }}>
      {/* Header */}
      <motion.header
        className="py-4 px-6 shadow-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #92400e, #b45309)' }}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-xl shadow">🌸</div>
            <div>
              <h1 className="text-white font-bold text-xl">Sarthi 🌸</h1>
              <p className="text-amber-200 text-xs">Your caring companion · Always here 💛</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-red-500/60 transition"
              >
                🗑️ Clear
              </button>
            )}
            <button
              onClick={() => setAvatarEnabled(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${avatarEnabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/20 text-white'}`}
            >
              👩‍💼 {avatarEnabled ? 'Avatar On' : 'Avatar Off'}
            </button>
            <button
              onClick={() => {
                setVoiceEnabled(v => !v);
                if (voiceEnabled) window.speechSynthesis?.cancel();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${voiceEnabled ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/20 text-white'}`}
            >
              🔊 {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </motion.header>

      {/* Language picker */}
      <div className="max-w-3xl w-full mx-auto px-6 pt-4 flex-shrink-0">
        <div className="flex gap-2">
          {[['en', '🇬🇧 English'], ['hi', '🇮🇳 Hindi'], ['hinglish', '🤝 Hinglish']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setLanguage(val)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${language === val ? 'bg-amber-600 text-white shadow' : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Predictive Mood Bar */}
      <div className="max-w-3xl w-full mx-auto px-6 py-3 flex-shrink-0">
        <div className="flex justify-between items-center bg-white/40 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/50 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider">Predictive Mood:</span>
            <motion.div
              key={currentEmotion}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200"
            >
              <span className="text-sm">{EMOTION_EMOJI[currentEmotion] || '😐'}</span>
              <span className="text-amber-900 text-xs font-bold capitalize">{currentEmotion}</span>
            </motion.div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isTalking ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
            <span className="text-[10px] text-stone-400 font-medium uppercase">{isTalking ? 'AI Talking' : 'Idle'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Virtual Friend section - Permanently mounted for WebGL stability */}
        <div
          className={`max-w-3xl w-full mx-auto px-6 mt-4 flex-shrink-0 transition-all duration-500 ${avatarEnabled ? 'opacity-100 scale-100 h-[420px]' : 'opacity-0 scale-95 h-0 pointer-events-none overflow-hidden'}`}
        >
          <div
            className="relative w-full h-full overflow-hidden shadow-2xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #fff9f2 0%, #fff4e6 50%, #ffe8cc 100%)',
              borderRadius: '2rem',
              border: '4px solid white'
            }}
          >
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-stone-50">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-amber-200 rounded-full" />
                  <p className="text-stone-400 text-sm font-medium">Preparing your friend...</p>
                </div>
              </div>
            }>
              <Canvas
                shadows
                dpr={[1, 2]}
                gl={{
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  outputColorSpace: THREE.SRGBColorSpace,
                }}
                camera={{ position: [0, 2, 4], fov: 40 }}
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 5]} intensity={0.8} />
                <pointLight position={[-5, 5, 2]} intensity={0.5} />
                <Avatar3D
                  state={avatarState}
                  isTalking={isTalking}
                  talkingIntensity={talkingIntensity}
                  emotion={currentEmotion}
                  userVolume={userVolume}
                  isListening={isListening}
                />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  minPolarAngle={Math.PI / 2.5}
                  maxPolarAngle={Math.PI / 1.8}
                  target={[0, 2.2, 0]}
                />
              </Canvas>
              {isTalking && (
                <div className="absolute top-4 right-6 flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Speaking</span>
                </div>
              )}
              <button
                onClick={() => setAvatarEnabled(false)}
                className="absolute bottom-4 right-6 px-4 py-2 bg-stone-800/80 hover:bg-stone-900 text-white text-xs font-bold rounded-full backdrop-blur-sm transition"
              >
                Hide Avatar
              </button>
            </Suspense>
          </div>
        </div>

        {/* Scrollable Chat area */}
        <div
          ref={containerRef}
          className="flex-1 max-w-3xl w-full mx-auto px-6 py-6 overflow-y-auto flex flex-col"
          style={{ overflowAnchor: 'none', scrollBehavior: 'smooth' }}
        >
          <div className="mt-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages.length === 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/60 backdrop-blur-md rounded-2xl p-8 text-center border border-white max-w-md mx-auto"
                >
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-bold text-stone-800 mb-2">Welcome to Sarthi 🌸</h3>
                  <p className="text-stone-600 text-sm">I'm here to listen. Tell me anything 💛</p>
                </motion.div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.created_at || i}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex ${msg.ai_response ? 'justify-start' : 'justify-end'}`}
                    >
                      {msg.user_message && (
                        <div className="max-w-[85%] bg-amber-600 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                          {msg.user_message}
                        </div>
                      )}
                      {msg.ai_response && (
                        <div className="max-w-[90%] flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-lg">
                            {EMOTION_EMOJI[msg.emotion_detected || 'neutral'] || '🌸'}
                          </div>
                          <div className="bg-white/80 backdrop-blur-sm text-stone-800 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-white/50 text-sm">
                            {msg.ai_response}
                            {msg.helpline_required && helplines.length > 0 && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-red-800 text-[10px] font-bold mb-1">❤️ Support Available:</p>
                                {helplines.map((h, j) => (
                                  <p key={j} className="text-red-900 text-[10px] font-bold">{h.name}: {h.phone}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs animate-bounce">🌸</div>
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  <div className="h-4" />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Input Bar */}
      <footer className="w-full bg-white/40 backdrop-blur-xl border-t border-white/50 pb-safe">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-white text-stone-600 shadow-sm border border-stone-100'}`}
            >
              <span className="text-xl">{isListening ? '⏹️' : '🎤'}</span>
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : "Tell Sarthi anything..."}
                className="w-full pl-6 pr-14 py-3.5 bg-white/80 rounded-2xl border border-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-700"
              />
              <button
                disabled={!input.trim() || loading}
                type="submit"
                className={`absolute right-2 top-1.5 w-10 h-10 rounded-xl flex items-center justify-center transition ${input.trim() && !loading ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-200 text-stone-400'}`}
              >
                ➔
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-stone-400 mt-2">
            In crisis? Call <strong>1800-599-0019</strong>. Sarthi is here to listen.
          </p>
        </div>
      </footer>
    </div>
  );
}
