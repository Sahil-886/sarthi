import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import Avatar3D from '../components/Avatar3D';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
// Emotion → emoji map
const EMOTION_EMOJI = {
    happy: '😊', sad: '😢', angry: '😠', anxious: '😰',
    stressed: '😤', lonely: '🥺', frustrated: '😤', neutral: '😐',
};
// Sarthi's Voice — Indian-accent Browser TTS with graceful fallback
function speak(text, onStart, onEnd, onBoundary) {
    if (!window.speechSynthesis)
        return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Sarthi voice settings — warm, soft, natural Indian cadence
    utterance.rate = 0.90; // slightly slower for thoughtful Indian-English pacing
    utterance.pitch = 1.25; // warm feminine pitch
    utterance.volume = 1.0;
    const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length)
            return;
        // 1. Explicit female Indian / female English voices (strictly NO male voices)
        const FEMALE_PREFERRED = [
            'microsoft heera', // Windows Indian English female ✅
            'veena', // macOS Indian English female ✅
            'google uk english female', // Chrome UK female ✅
            'samantha', // macOS US female ✅
            'victoria', // macOS US female ✅
            'karen', // macOS AU female ✅
            'moira', // macOS IE female ✅
            'tessa', // macOS ZA female ✅
            'fiona', // macOS EN-GB female ✅
            'serena', // macOS female ✅
        ];
        let selected = null;
        // Try exact preferred list first
        for (const name of FEMALE_PREFERRED) {
            selected = voices.find(v => v.name.toLowerCase().includes(name)) || null;
            if (selected)
                break;
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
        }
        else {
            // Last resort: raise pitch significantly to feminize any voice
            utterance.pitch = 1.6;
        }
    };
    selectVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = selectVoice;
    }
    if (onStart)
        utterance.onstart = onStart;
    if (onEnd)
        utterance.onend = onEnd;
    if (onBoundary)
        utterance.onboundary = onBoundary;
    window.speechSynthesis.speak(utterance);
}
// Typing dots component
function TypingIndicator() {
    return (_jsx("div", { className: "flex items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-stone-100 w-fit", children: [0, 1, 2].map(i => (_jsx(motion.div, { className: "w-2 h-2 bg-amber-400 rounded-full", animate: { y: [0, -6, 0] }, transition: { duration: 0.6, repeat: Infinity, delay: i * 0.15 } }, i))) }));
}
// Emergency / Safety Card functionality removed to simplify UI as requested.
// Audio Analyzer Hook for Lip Sync
function useAudioAnalyzer(active) {
    const [volume, setVolume] = useState(0);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const sourceRef = useRef(null);
    const audioContextRef = useRef(null);
    useEffect(() => {
        if (!active) {
            setVolume(0);
            return;
        }
        let animationFrame;
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
                    if (!analyserRef.current || !dataArrayRef.current)
                        return;
                    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                    let sum = 0;
                    for (let i = 0; i < dataArrayRef.current.length; i++) {
                        sum += dataArrayRef.current[i];
                    }
                    const avg = sum / dataArrayRef.current.length;
                    setVolume(avg);
                    animationFrame = requestAnimationFrame(updateVolume);
                };
                updateVolume();
            }
            catch (err) {
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
function useVoiceEmotion(active, onEmotion) {
    useEffect(() => {
        if (!active)
            return;
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
            }
            catch (err) {
                console.error("Voice emotion detection failed:", err);
            }
        }, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, [active, onEmotion]);
}
export default function AICompanion() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState('en');
    const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice on by default for better experience
    const [avatarEnabled, setAvatarEnabled] = useState(false);
    const [avatarState, setAvatarState] = useState('idle');
    const [isTalking, setIsTalking] = useState(false);
    const [talkingIntensity, setTalkingIntensity] = useState(0);
    const [currentEmotion, setCurrentEmotion] = useState('neutral');
    const [helplines, setHelplines] = useState([]);
    const containerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    // Voice Recognition State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    // Audio Analyzer for User Input
    const userVolume = useAudioAnalyzer(isListening);
    // Voice Emotion Detection
    useVoiceEmotion(isListening, (emotion) => {
        setCurrentEmotion(emotion);
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
            }
            catch {
                console.error('Init failed');
            }
        };
        init();
        // Pre-load voices
        window.speechSynthesis?.getVoices();
    }, []);
    // Ultra-Real Audio Sync logic
    const analyzeAudio = async (url) => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
                if (audioCtx.state === 'closed')
                    return;
                analyser.getByteFrequencyData(dataArray);
                const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setTalkingIntensity(volume / 128); // Normalize roughly to 0-1
                requestAnimationFrame(updateIntensity);
            };
            updateIntensity();
        }
        catch (err) {
            console.error("Audio Sync Error:", err);
            setIsTalking(false);
            setAvatarState('idle');
        }
    };
    const handleSend = useCallback(async (e, overrideMsg) => {
        if (e)
            e.preventDefault();
        const msg = overrideMsg !== undefined ? overrideMsg : input.trim();
        if (!msg || loading)
            return;
        setInput('');
        setLoading(true);
        // Optimistically show user bubble
        const optimisticUserMsg = {
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
                setCurrentEmotion(response.emotion_detected);
            }
            if (voiceEnabled && response.ai_response && !response.avatar_video_url) {
                // Try Ultra-Real Backend Voice
                try {
                    const vBlob = await client.generateVoice(response.ai_response);
                    if (vBlob && vBlob.size > 0) {
                        const voiceUrl = URL.createObjectURL(vBlob);
                        analyzeAudio(voiceUrl);
                    }
                    else {
                        // Fallback to browser TTS with word-level boundary events for lip-sync
                        speak(response.ai_response, () => { setIsTalking(true); setAvatarState('speaking'); }, () => { setIsTalking(false); setAvatarState('idle'); setTalkingIntensity(0); }, (event) => {
                            // Approximate mouth opening based on charIndex/length/etc or just pulse
                            if (event.name === 'word') {
                                setTalkingIntensity(0.5 + Math.random() * 0.5);
                                setTimeout(() => setTalkingIntensity(0), 100);
                            }
                        });
                    }
                }
                catch (vErr) {
                    speak(response.ai_response, () => { setIsTalking(true); setAvatarState('speaking'); }, () => { setIsTalking(false); setAvatarState('idle'); });
                }
            }
            else {
                setAvatarState('idle');
            }
        }
        catch (err) {
            console.error('Chat failed:', err);
            setMessages(prev => [...prev.slice(0, -1), {
                    user_message: msg,
                    ai_response: "I'm having a little trouble right now. Please try again in a moment 💛",
                    language,
                    helpline_required: false,
                    created_at: new Date().toISOString(),
                }]);
        }
        finally {
            setLoading(false);
            setTimeout(() => {
                inputRef.current?.focus({ preventScroll: true });
                scrollToBottom();
            }, 100);
        }
    }, [input, loading, language, avatarEnabled, voiceEnabled, scrollToBottom]);
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
            recognitionRef.current.onresult = (event) => {
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
        }
        else {
            setIsListening(true);
            setAvatarState('listening');
            transcriptRef.current = '';
            recognitionRef.current?.start();
        }
    };
    const handleClearChat = async () => {
        if (messages.length === 0)
            return;
        if (!window.confirm('Clear all chat history? This cannot be undone.'))
            return;
        try {
            await client.clearConversationHistory();
            setMessages([]);
            window.speechSynthesis?.cancel();
        }
        catch (err) {
            console.error('Clear chat failed:', err);
        }
    };
    return (_jsxs("div", { className: "h-screen flex flex-col overflow-hidden", style: { background: 'linear-gradient(135deg, #fef9f0 0%, #fff0d4 100%)' }, children: [_jsx(motion.header, { className: "py-4 px-6 shadow-sm flex-shrink-0", style: { background: 'linear-gradient(135deg, #92400e, #b45309)' }, initial: { y: -30, opacity: 0 }, animate: { y: 0, opacity: 1 }, children: _jsxs("div", { className: "max-w-3xl mx-auto flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-xl shadow", children: "\uD83C\uDF38" }), _jsxs("div", { children: [_jsx("h1", { className: "text-white font-bold text-xl", children: "Sarthi \uD83C\uDF38" }), _jsx("p", { className: "text-amber-200 text-xs", children: "Your caring companion \u00B7 Always here \uD83D\uDC9B" })] })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [messages.length > 0 && (_jsx("button", { onClick: handleClearChat, className: "px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-red-500/60 transition", children: "\uD83D\uDDD1\uFE0F Clear" })), _jsxs("button", { onClick: () => setAvatarEnabled(v => !v), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${avatarEnabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/20 text-white'}`, children: ["\uD83D\uDC69\u200D\uD83D\uDCBC ", avatarEnabled ? 'Avatar On' : 'Avatar Off'] }), _jsxs("button", { onClick: () => {
                                        setVoiceEnabled(v => !v);
                                        if (voiceEnabled)
                                            window.speechSynthesis?.cancel();
                                    }, className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${voiceEnabled ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/20 text-white'}`, children: ["\uD83D\uDD0A ", voiceEnabled ? 'Voice On' : 'Voice Off'] }), _jsx("button", { onClick: () => navigate('/dashboard'), className: "px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition", children: "Dashboard" })] })] }) }), _jsx("div", { className: "max-w-3xl w-full mx-auto px-6 pt-4 flex-shrink-0", children: _jsx("div", { className: "flex gap-2", children: [['en', '🇬🇧 English'], ['hi', '🇮🇳 Hindi'], ['hinglish', '🤝 Hinglish']].map(([val, label]) => (_jsx("button", { onClick: () => setLanguage(val), className: `px-3 py-1 rounded-full text-xs font-medium transition ${language === val ? 'bg-amber-600 text-white shadow' : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-400'}`, children: label }, val))) }) }), _jsx("div", { className: "max-w-3xl w-full mx-auto px-6 py-3 flex-shrink-0", children: _jsxs("div", { className: "flex justify-between items-center bg-white/40 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/50 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-stone-500 text-xs font-bold uppercase tracking-wider", children: "Predictive Mood:" }), _jsxs(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200", children: [_jsx("span", { className: "text-sm", children: EMOTION_EMOJI[currentEmotion] || '😐' }), _jsx("span", { className: "text-amber-900 text-xs font-bold capitalize", children: currentEmotion })] }, currentEmotion)] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isTalking ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}` }), _jsx("span", { className: "text-[10px] text-stone-400 font-medium uppercase", children: isTalking ? 'AI Talking' : 'Idle' })] })] }) }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("div", { className: `max-w-3xl w-full mx-auto px-6 mt-4 flex-shrink-0 transition-all duration-500 ${avatarEnabled ? 'opacity-100 scale-100 h-[420px]' : 'opacity-0 scale-95 h-0 pointer-events-none overflow-hidden'}`, children: _jsx("div", { className: "relative w-full h-full overflow-hidden shadow-2xl", style: {
                                background: 'radial-gradient(circle at 50% 50%, #fff9f2 0%, #fff4e6 50%, #ffe8cc 100%)',
                                borderRadius: '2rem',
                                border: '4px solid white'
                            }, children: _jsxs(Suspense, { fallback: _jsx("div", { className: "w-full h-full flex items-center justify-center bg-stone-50", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-amber-200 rounded-full" }), _jsx("p", { className: "text-stone-400 text-sm font-medium", children: "Preparing your friend..." })] }) }), children: [_jsxs(Canvas, { shadows: true, dpr: [1, 2], gl: {
                                            antialias: true,
                                            toneMapping: THREE.ACESFilmicToneMapping,
                                            outputColorSpace: THREE.SRGBColorSpace,
                                        }, camera: { position: [0, 2, 4], fov: 40 }, children: [_jsx("ambientLight", { intensity: 0.7 }), _jsx("directionalLight", { position: [5, 10, 5], intensity: 0.8 }), _jsx("pointLight", { position: [-5, 5, 2], intensity: 0.5 }), _jsx(Avatar3D, { state: avatarState, isTalking: isTalking, talkingIntensity: talkingIntensity, emotion: currentEmotion, userVolume: userVolume, isListening: isListening }), _jsx(OrbitControls, { enableZoom: false, enablePan: false, minPolarAngle: Math.PI / 2.5, maxPolarAngle: Math.PI / 1.8, target: [0, 2.2, 0] })] }), isTalking && (_jsxs("div", { className: "absolute top-4 right-6 flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-sm", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }), _jsx("span", { className: "text-emerald-700 text-xs font-bold uppercase tracking-wider", children: "Speaking" })] })), _jsx("button", { onClick: () => setAvatarEnabled(false), className: "absolute bottom-4 right-6 px-4 py-2 bg-stone-800/80 hover:bg-stone-900 text-white text-xs font-bold rounded-full backdrop-blur-sm transition", children: "Hide Avatar" })] }) }) }), _jsx("div", { ref: containerRef, className: "flex-1 max-w-3xl w-full mx-auto px-6 py-6 overflow-y-auto flex flex-col", style: { overflowAnchor: 'none', scrollBehavior: 'smooth' }, children: _jsx("div", { className: "mt-auto space-y-4", children: _jsx(AnimatePresence, { initial: false, children: messages.length === 0 && !loading ? (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-white/60 backdrop-blur-md rounded-2xl p-8 text-center border border-white max-w-md mx-auto", children: [_jsx("div", { className: "text-4xl mb-4", children: "\u2728" }), _jsx("h3", { className: "text-lg font-bold text-stone-800 mb-2", children: "Welcome to Sarthi \uD83C\uDF38" }), _jsx("p", { className: "text-stone-600 text-sm", children: "I'm here to listen. Tell me anything \uD83D\uDC9B" })] })) : (_jsxs(_Fragment, { children: [messages.map((msg, i) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, className: `flex ${msg.ai_response ? 'justify-start' : 'justify-end'}`, children: [msg.user_message && (_jsx("div", { className: "max-w-[85%] bg-amber-600 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm text-sm", children: msg.user_message })), msg.ai_response && (_jsxs("div", { className: "max-w-[90%] flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-lg", children: EMOTION_EMOJI[msg.emotion_detected || 'neutral'] || '🌸' }), _jsxs("div", { className: "bg-white/80 backdrop-blur-sm text-stone-800 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-white/50 text-sm", children: [msg.ai_response, msg.helpline_required && helplines.length > 0 && (_jsxs("div", { className: "mt-3 p-3 bg-red-50 border border-red-100 rounded-xl", children: [_jsx("p", { className: "text-red-800 text-[10px] font-bold mb-1", children: "\u2764\uFE0F Support Available:" }), helplines.map((h, j) => (_jsxs("p", { className: "text-red-900 text-[10px] font-bold", children: [h.name, ": ", h.phone] }, j)))] }))] })] }))] }, msg.created_at || i))), loading && (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs animate-bounce", children: "\uD83C\uDF38" }), _jsx(TypingIndicator, {})] })), _jsx("div", { ref: messagesEndRef }), _jsx("div", { className: "h-4" })] })) }) }) })] }), _jsx("footer", { className: "w-full bg-white/40 backdrop-blur-xl border-t border-white/50 pb-safe", children: _jsxs("div", { className: "max-w-3xl mx-auto px-6 py-4", children: [_jsxs("form", { onSubmit: handleSend, className: "flex gap-3 items-center", children: [_jsx("button", { type: "button", onClick: toggleListening, className: `w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' : 'bg-white text-stone-600 shadow-sm border border-stone-100'}`, children: _jsx("span", { className: "text-xl", children: isListening ? '⏹️' : '🎤' }) }), _jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { ref: inputRef, type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: isListening ? 'Listening...' : "Tell Sarthi anything...", className: "w-full pl-6 pr-14 py-3.5 bg-white/80 rounded-2xl border border-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-700" }), _jsx("button", { disabled: !input.trim() || loading, type: "submit", className: `absolute right-2 top-1.5 w-10 h-10 rounded-xl flex items-center justify-center transition ${input.trim() && !loading ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-200 text-stone-400'}`, children: "\u2794" })] })] }), _jsxs("p", { className: "text-center text-[10px] text-stone-400 mt-2", children: ["In crisis? Call ", _jsx("strong", { children: "1800-599-0019" }), ". Sarthi is here to listen."] })] }) })] }));
}
