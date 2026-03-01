import { motion, AnimatePresence } from 'framer-motion';

interface AnomalyBadgeProps {
    isAnomaly: boolean;
    severity: string;           // 'spike_high' | 'spike_low' | 'moderate' | 'none'
    message: string;
    zScore?: number;
}

export default function AnomalyBadge({ isAnomaly, severity, message, zScore }: AnomalyBadgeProps) {
    if (!isAnomaly || severity === 'none') return null;

    const configs = {
        spike_high: {
            icon: '⚠️',
            bg: 'bg-red-50',
            border: 'border-red-200',
            title: 'Stress Spike Detected',
            titleColor: 'text-red-700',
            textColor: 'text-red-600',
        },
        spike_low: {
            icon: '🎉',
            bg: 'bg-green-50',
            border: 'border-green-200',
            title: 'Big Improvement!',
            titleColor: 'text-green-700',
            textColor: 'text-green-600',
        },
        moderate: {
            icon: '📊',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            title: 'Pattern Change',
            titleColor: 'text-amber-700',
            textColor: 'text-amber-600',
        },
    };

    const cfg = configs[severity as keyof typeof configs] || configs.moderate;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-4 flex items-start gap-3`}
            >
                <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                <div>
                    <p className={`font-bold text-sm ${cfg.titleColor}`}>{cfg.title}</p>
                    <p className={`text-sm mt-0.5 ${cfg.textColor}`}>{message}</p>
                    {zScore !== undefined && Math.abs(zScore) > 0.1 && (
                        <p className="text-xs text-stone-400 mt-1">
                            Z-score: {zScore > 0 ? '+' : ''}{zScore.toFixed(2)} σ from your average
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
