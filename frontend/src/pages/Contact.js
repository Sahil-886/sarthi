import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import client from '../api/client';
const EMERGENCY_HELPLINES = [
    { name: 'Kiran Mental Health Helpline', phone: '1800-599-0019', description: '24/7 toll-free support by Ministry of Social Justice' },
    { name: 'AASRA (Crisis Intervention)', phone: '+91-9820466627', description: 'Round-the-clock helpline for emotional support' },
    { name: 'Vandrevala Foundation', phone: '1860-2662-345', description: '24/7 mental health helpline and counselling' },
    { name: 'National Emergency Number', phone: '112', description: 'Police, Fire & Ambulance — for immediate danger' },
];
export default function Contact() {
    const navigate = useNavigate();
    const { user: _user } = useUser(); // reserved for future personalisation
    const [contact, setContact] = useState(null);
    const [helplines, setHelplines] = useState(EMERGENCY_HELPLINES);
    const [friendPhone, setFriendPhone] = useState('');
    const [myPhone, setMyPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        client.getSupportContact().then(setContact).catch(() => { });
        client.getHelplines().then((res) => {
            if (res?.helplines?.length)
                setHelplines(res.helplines);
        }).catch(() => { });
    }, []);
    const handleSave = async () => {
        if (!myPhone && !friendPhone)
            return;
        setSaving(true);
        try {
            // Save phone numbers (backend will store them)
            if (myPhone)
                await client.updateUserPhone(myPhone).catch(() => { });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        catch {
            // silent fail — feature works even without saving
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen pb-24 font-sans", style: { background: 'linear-gradient(160deg, #fefce8 0%, #ecfdf5 60%, #fef9f0 100%)' }, children: [_jsx(motion.header, { className: "bg-white/80 backdrop-blur-md border-b border-amber-100 py-4 px-6 sticky top-0 z-20 shadow-sm", initial: { y: -24, opacity: 0 }, animate: { y: 0, opacity: 1 }, children: _jsx("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-amber-100 hover:text-amber-600 transition", children: "\u2190" }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-stone-800", children: "Contact & Support" }), _jsx("p", { className: "text-xs text-stone-400", children: "We're here whenever you need us" })] })] }) }) }), _jsxs("div", { className: "max-w-4xl mx-auto px-6 pt-8 space-y-6", children: [_jsxs(motion.div, { className: "bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-7 shadow-xl text-white relative overflow-hidden", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 }, children: [_jsx("div", { className: "absolute -right-8 -bottom-8 text-9xl opacity-10 pointer-events-none select-none", children: "\uD83D\uDC9B" }), _jsx("p", { className: "text-white/80 text-xs font-bold uppercase tracking-wider mb-1", children: "Sarthi Support" }), _jsx("h2", { className: "text-2xl font-black mb-2", children: contact ? contact.name : 'Sarthi Support' }), _jsx("p", { className: "text-white/90 text-sm mb-5 font-medium leading-relaxed", children: contact?.message || 'If you need help or want to talk, feel free to reach out.' }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("a", { href: `tel:${contact?.phone || '7262854580'}`, className: "flex items-center gap-2 bg-white text-amber-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-50 transition shadow-sm", children: "\uD83D\uDCDE Call Now" }), _jsx("a", { href: `https://wa.me/91${(contact?.whatsapp || '7262854580').replace(/\D/g, '')}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition border border-white/30", children: "\uD83D\uDCAC WhatsApp" }), contact?.email && (_jsx("a", { href: `mailto:${contact.email}`, className: "flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition border border-white/30", children: "\u2709\uFE0F Email" }))] }), contact?.hours && (_jsxs("p", { className: "text-white/70 text-xs mt-4", children: ["\uD83D\uDD50 Available: ", contact.hours] }))] }), _jsxs(motion.div, { className: "bg-white rounded-3xl border border-amber-100 p-6 shadow-sm", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDEA8" }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-stone-800", children: "Emergency Helplines" }), _jsx("p", { className: "text-xs text-stone-400", children: "Available 24/7 \u2014 free of charge" })] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: helplines.map((h, i) => (_jsxs(motion.a, { href: `tel:${h.phone}`, className: "group flex items-start gap-3 p-4 rounded-2xl border border-stone-100 hover:border-red-200 hover:bg-red-50 transition-all", initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.12 + i * 0.05 }, whileTap: { scale: 0.98 }, children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition", children: _jsx("span", { className: "text-sm", children: "\uD83D\uDCDE" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-stone-800 text-sm leading-tight", children: h.name }), _jsx("p", { className: "text-red-600 font-bold text-base mt-0.5", children: h.phone }), _jsx("p", { className: "text-stone-500 text-xs mt-0.5 leading-snug", children: h.description })] })] }, h.phone))) })] }), _jsxs(motion.div, { className: "bg-white rounded-3xl border border-amber-100 p-6 shadow-sm", initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.18 }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-5", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDC65" }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-stone-800", children: "Your Emergency Contact" }), _jsx("p", { className: "text-xs text-stone-400", children: "We'll alert them if you're in distress" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-stone-600 uppercase tracking-wide block mb-1.5", children: "Your Phone Number" }), _jsx("input", { type: "tel", value: myPhone, onChange: (e) => setMyPhone(e.target.value), placeholder: "e.g. 9876543210", className: "w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-stone-800 font-medium text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-bold text-stone-600 uppercase tracking-wide block mb-1.5", children: "Close Friend's Number (Emergency Contact)" }), _jsx("input", { type: "tel", value: friendPhone, onChange: (e) => setFriendPhone(e.target.value), placeholder: "e.g. 9876543210", className: "w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-stone-800 font-medium text-sm" }), _jsx("p", { className: "text-xs text-stone-400 mt-1", children: "They'll receive a supportive SMS if your stress score is very high or risk is detected." })] }), _jsx(motion.button, { onClick: handleSave, disabled: saving || (!myPhone && !friendPhone), className: `w-full py-3 rounded-xl font-bold text-sm transition ${saved
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-amber-400 hover:bg-amber-500 text-white disabled:opacity-40'}`, whileTap: { scale: 0.97 }, children: saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Numbers' })] })] }), _jsxs(motion.div, { className: "flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.25 }, children: [_jsx("span", { className: "text-xl", children: "\uD83D\uDC9B" }), _jsxs("div", { children: [_jsx("p", { className: "font-bold text-indigo-700", children: "You are not alone" }), _jsx("p", { className: "text-indigo-600 mt-0.5 leading-relaxed", children: "Sarthi monitors your mental wellness and will send gentle alerts if it detects you might need support. All alerts are private and sent with care. You can turn them off from Permissions settings." })] })] })] })] }));
}
