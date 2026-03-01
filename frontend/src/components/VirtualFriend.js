import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * VirtualFriend — D-ID Talking Avatar Video Player
 * ================================================
 * Displays a realistic talking avatar with a video-call style UI.
 * Shows loading state while the D-ID video is generating,
 * auto-plays when ready, and falls back gracefully if avatar fails.
 */
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Animated "speaking" sound bars
function SpeakingIndicator() {
    return (_jsx("div", { className: "flex items-end gap-[3px] h-5", children: [0.6, 1, 0.7, 1, 0.5].map((h, i) => (_jsx(motion.div, { className: "w-[3px] bg-emerald-400 rounded-full", style: { height: `${h * 100}%` }, animate: { scaleY: [1, h * 1.6, 0.5, 1] }, transition: { duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' } }, i))) }));
}
// Pulsing ring for "connecting" state
function ConnectingRing() {
    return (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: [0, 1, 2].map(i => (_jsx(motion.div, { className: "absolute rounded-full border border-white/30", style: { width: 120 + i * 50, height: 120 + i * 50 }, animate: { scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }, transition: { duration: 2, repeat: Infinity, delay: i * 0.4 } }, i))) }));
}
export default function VirtualFriend({ videoUrl, loading, onCallEnd, avatarName = 'Sarthi', }) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    // Auto-play when new URL arrives
    useEffect(() => {
        if (videoUrl && videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                setHasPlayed(true);
            }).catch(console.warn);
        }
    }, [videoUrl]);
    // Call-duration counter while connected
    useEffect(() => {
        const t = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const handleReplay = () => {
        videoRef.current?.play();
        setIsPlaying(true);
    };
    return (_jsxs("div", { className: "relative w-full flex items-center justify-center overflow-hidden", style: {
            background: 'linear-gradient(180deg, #0f0c24 0%, #1a1040 60%, #2a1060 100%)',
            borderRadius: '1.5rem',
            minHeight: 320,
            maxHeight: 400,
        }, children: [_jsx("div", { className: "absolute inset-0 pointer-events-none overflow-hidden rounded-3xl", children: Array.from({ length: 30 }).map((_, i) => (_jsx(motion.div, { className: "absolute w-px h-px bg-white rounded-full", style: { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }, animate: { opacity: [0, 1, 0] }, transition: { duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4 } }, i))) }), _jsx(AnimatePresence, { children: loading && (_jsxs(motion.div, { className: "absolute inset-0 flex flex-col items-center justify-center z-20", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children: [_jsx(ConnectingRing, {}), _jsx("div", { className: "relative z-10 w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl", children: _jsx("img", { src: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg", alt: avatarName, className: "w-full h-full object-cover" }) }), _jsxs(motion.div, { className: "mt-4 flex items-center gap-2", animate: { opacity: [0.5, 1, 0.5] }, transition: { duration: 1.5, repeat: Infinity }, children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-400" }), _jsx("p", { className: "text-white/80 text-sm font-medium", children: "Preparing response\u2026" })] })] })) }), videoUrl && (_jsx(motion.div, { className: "relative z-10 w-full h-full flex items-center justify-center", initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 }, children: _jsx("video", { ref: videoRef, src: videoUrl, className: "w-full h-full object-cover rounded-2xl", style: { maxHeight: 380 }, onPlay: () => setIsPlaying(true), onEnded: () => setIsPlaying(false), playsInline: true, crossOrigin: "anonymous" }) })), !videoUrl && !loading && (_jsxs("div", { className: "relative z-10 flex flex-col items-center", children: [_jsx(ConnectingRing, {}), _jsx("div", { className: "w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-400/50 shadow-2xl", children: _jsx("img", { src: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg", alt: avatarName, className: "w-full h-full object-cover" }) }), _jsx("p", { className: "mt-4 text-white/60 text-sm", children: "Send a message to start talking" })] })), _jsxs("div", { className: "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 rounded-t-2xl", style: { background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)' }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#4ade80]" }), _jsx("span", { className: "text-white text-sm font-semibold", children: avatarName })] }), _jsxs("div", { className: "flex items-center gap-3", children: [isPlaying && _jsx(SpeakingIndicator, {}), _jsx("span", { className: "text-white/60 text-xs font-mono", children: formatTime(callDuration) })] })] }), _jsxs("div", { className: "absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 rounded-b-2xl", style: { background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)' }, children: [_jsx("div", { className: "flex items-center gap-2", children: hasPlayed && !isPlaying && (_jsx(motion.button, { onClick: handleReplay, className: "w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition", whileTap: { scale: 0.9 }, title: "Replay", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" }) }) })) }), onCallEnd && (_jsxs(motion.button, { onClick: onCallEnd, className: "flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 transition text-white text-xs font-bold shadow-lg", whileTap: { scale: 0.92 }, children: [_jsx("svg", { className: "w-3.5 h-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a16 16 0 0114 14" }) }), "End Avatar"] }))] })] }));
}
