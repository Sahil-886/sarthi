import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { motion } from 'framer-motion';

interface GameScore {
    game: string;
    score: number;
    fullMark?: number;
}

interface PerformanceRadarChartProps {
    scores: GameScore[];
}

const GAME_LABELS: Record<string, string> = {
    reaction_speed: 'Reaction',
    memory_pattern: 'Memory',
    focus_tracking: 'Focus',
    emotional_recognition: 'Emotion',
    decision_making: 'Decision',
    persistence_challenge: 'Persistence',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-3 text-sm">
            <p className="font-bold text-stone-700">{payload[0]?.payload?.game}</p>
            <p className="text-amber-600 font-medium">Score: {payload[0]?.value?.toFixed(0)}/100</p>
        </div>
    );
};

export default function PerformanceRadarChart({ scores }: PerformanceRadarChartProps) {
    if (!scores || scores.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-stone-400 text-sm">
                Play all 6 games to see your performance radar!
            </div>
        );
    }

    const data = scores.map((s) => ({
        game: GAME_LABELS[s.game] || s.game,
        score: Math.round(s.score),
        fullMark: 100,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full"
        >
            <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#fde68a" />
                    <PolarAngleAxis
                        dataKey="game"
                        tick={{ fill: '#78716c', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#a8a29e', fontSize: 10 }}
                        axisLine={false}
                    />
                    <Radar
                        name="Cognitive Score"
                        dataKey="score"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.25}
                        strokeWidth={2}
                        dot={{ fill: '#d97706', r: 4 }}
                        activeDot={{ r: 6, fill: '#d97706' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#78716c' }} />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
