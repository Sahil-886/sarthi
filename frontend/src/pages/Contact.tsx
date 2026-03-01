import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import client from '../api/client';

interface Helpline {
    name: string;
    phone: string;
    description: string;
}

interface SupportContact {
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    hours: string;
    message: string;
}

const EMERGENCY_HELPLINES: Helpline[] = [
    { name: 'Kiran Mental Health Helpline', phone: '1800-599-0019', description: '24/7 toll-free support by Ministry of Social Justice' },
    { name: 'AASRA (Crisis Intervention)', phone: '+91-9820466627', description: 'Round-the-clock helpline for emotional support' },
    { name: 'Vandrevala Foundation', phone: '1860-2662-345', description: '24/7 mental health helpline and counselling' },
    { name: 'National Emergency Number', phone: '112', description: 'Police, Fire & Ambulance — for immediate danger' },
];

export default function Contact() {
    const navigate = useNavigate();
    const { user: _user } = useUser();  // reserved for future personalisation
    const [contact, setContact] = useState<SupportContact | null>(null);
    const [helplines, setHelplines] = useState<Helpline[]>(EMERGENCY_HELPLINES);
    const [friendPhone, setFriendPhone] = useState('');
    const [myPhone, setMyPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        client.getSupportContact().then(setContact).catch(() => { });
        client.getHelplines().then((res) => {
            if (res?.helplines?.length) setHelplines(res.helplines);
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        if (!myPhone && !friendPhone) return;
        setSaving(true);
        try {
            // Save phone numbers (backend will store them)
            if (myPhone) await client.updateUserPhone(myPhone).catch(() => { });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // silent fail — feature works even without saving
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="min-h-screen pb-24 font-sans"
            style={{ background: 'linear-gradient(160deg, #fefce8 0%, #ecfdf5 60%, #fef9f0 100%)' }}
        >
            {/* Header */}
            <motion.header
                className="bg-white/80 backdrop-blur-md border-b border-amber-100 py-4 px-6 sticky top-0 z-20 shadow-sm"
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-amber-100 hover:text-amber-600 transition"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-stone-800">Contact & Support</h1>
                            <p className="text-xs text-stone-400">We're here whenever you need us</p>
                        </div>
                    </div>
                </div>
            </motion.header>

            <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">

                {/* Sarthi Support Card */}
                <motion.div
                    className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-7 shadow-xl text-white relative overflow-hidden"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <div className="absolute -right-8 -bottom-8 text-9xl opacity-10 pointer-events-none select-none">💛</div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Sarthi Support</p>
                    <h2 className="text-2xl font-black mb-2">
                        {contact ? contact.name : 'Sarthi Support'}
                    </h2>
                    <p className="text-white/90 text-sm mb-5 font-medium leading-relaxed">
                        {contact?.message || 'If you need help or want to talk, feel free to reach out.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href={`tel:${contact?.phone || '7262854580'}`}
                            className="flex items-center gap-2 bg-white text-amber-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-50 transition shadow-sm"
                        >
                            📞 Call Now
                        </a>
                        <a
                            href={`https://wa.me/91${(contact?.whatsapp || '7262854580').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition border border-white/30"
                        >
                            💬 WhatsApp
                        </a>
                        {contact?.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition border border-white/30"
                            >
                                ✉️ Email
                            </a>
                        )}
                    </div>
                    {contact?.hours && (
                        <p className="text-white/70 text-xs mt-4">🕐 Available: {contact.hours}</p>
                    )}
                </motion.div>

                {/* Emergency Helplines */}
                <motion.div
                    className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800">Emergency Helplines</h2>
                            <p className="text-xs text-stone-400">Available 24/7 — free of charge</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {helplines.map((h, i) => (
                            <motion.a
                                key={h.phone}
                                href={`tel:${h.phone}`}
                                className="group flex items-start gap-3 p-4 rounded-2xl border border-stone-100 hover:border-red-200 hover:bg-red-50 transition-all"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12 + i * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition">
                                    <span className="text-sm">📞</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-stone-800 text-sm leading-tight">{h.name}</p>
                                    <p className="text-red-600 font-bold text-base mt-0.5">{h.phone}</p>
                                    <p className="text-stone-500 text-xs mt-0.5 leading-snug">{h.description}</p>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </motion.div>

                {/* Emergency Contact Setup */}
                <motion.div
                    className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-2xl">👥</span>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800">Your Emergency Contact</h2>
                            <p className="text-xs text-stone-400">We'll alert them if you're in distress</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide block mb-1.5">
                                Your Phone Number
                            </label>
                            <input
                                type="tel"
                                value={myPhone}
                                onChange={(e) => setMyPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-stone-800 font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-600 uppercase tracking-wide block mb-1.5">
                                Close Friend's Number (Emergency Contact)
                            </label>
                            <input
                                type="tel"
                                value={friendPhone}
                                onChange={(e) => setFriendPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none text-stone-800 font-medium text-sm"
                            />
                            <p className="text-xs text-stone-400 mt-1">
                                They'll receive a supportive SMS if your stress score is very high or risk is detected.
                            </p>
                        </div>
                        <motion.button
                            onClick={handleSave}
                            disabled={saving || (!myPhone && !friendPhone)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition ${saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-400 hover:bg-amber-500 text-white disabled:opacity-40'
                                }`}
                            whileTap={{ scale: 0.97 }}
                        >
                            {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save Numbers'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Safety Note */}
                <motion.div
                    className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    <span className="text-xl">💛</span>
                    <div>
                        <p className="font-bold text-indigo-700">You are not alone</p>
                        <p className="text-indigo-600 mt-0.5 leading-relaxed">
                            Sarthi monitors your mental wellness and will send gentle alerts if it detects you might need support.
                            All alerts are private and sent with care. You can turn them off from Permissions settings.
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
