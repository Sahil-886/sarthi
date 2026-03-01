import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
} from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
    session: number;
    stress_score: number;
    cognitive_score?: number;
    label?: string;
}

interface StressTrajectoryChartProps {
    data: DataPoint[];
    showCognitive?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-3 text-sm">
            <p className="font-bold text-stone-700 mb-1">Session {label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} style={{ color: entry.color }} className="font-medium">
                    {entry.name}: {entry.value?.toFixed(1)}
                </p>
            ))}
        </div>
    );
};

export default function StressTrajectoryChart({ data, showCognitive = true }: StressTrajectoryChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-stone-400 text-sm">
                No session data yet. Play some games to see your trend!
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full"
        >
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" vertical={false} />
                    <XAxis
                        dataKey="session"
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Session', position: 'insideBottom', offset: -2, fill: '#78716c', fontSize: 11 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#78716c' }} />

                    {/* Reference zones */}
                    <ReferenceLine y={40} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Low', fill: '#10b981', fontSize: 10 }} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'High', fill: '#ef4444', fontSize: 10 }} />

                    <Area
                        type="monotone"
                        dataKey="stress_score"
                        name="Stress Score"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#stressGrad)"
                        dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#d97706' }}
                    />
                    {showCognitive && (
                        <Area
                            type="monotone"
                            dataKey="cognitive_score"
                            name="Cognitive Score"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#cogGrad)"
                            dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#059669' }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
