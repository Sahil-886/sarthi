import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ReactionGame from './ReactionGame';
import MemoryGame from './MemoryGame';
import FocusGame from './FocusGame';
import EmotionGame from './EmotionGame';
import DecisionGame from './DecisionGame';
import PersistenceGame from './PersistenceGame';
import PostGameQuestions from './PostGameQuestions';
import GameResult from './GameResult';

type Stage = 'game' | 'questions' | 'result';

interface ResultState {
    score: number;
    reactionTime?: number;
    stressScore: number;
    stressLevel: string;
}

interface GameMetrics {
    score: number;
    accuracy?: number;
    reactionTime?: number;
    mistakes?: number;
    completionTime?: number;
    levelReached?: number;
}

// Game ID → canonical backend game_id mapping
const GAME_ID_MAP: Record<string, string> = {
    reaction_speed: 'reaction_speed',
    memory_pattern: 'memory_pattern',
    focus_tracking: 'focus_tracking',
    emotional_recognition: 'emotional_recognition',
    decision_making: 'decision_making',
    persistence_challenge: 'persistence_challenge',
};

export default function GameWrapper() {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();

    const [stage, setStage] = useState<Stage>('game');
    const [metrics, setMetrics] = useState<GameMetrics>({ score: 0 });
    const [result, setResult] = useState<ResultState | null>(null);

    const handleGameComplete = useCallback((score: number, extra?: any) => {
        const newMetrics: GameMetrics = { score };

        // Handle extra metrics based on game type
        // This mapping depends on how each game component calls onComplete
        if (typeof extra === 'number') {
            if (gameId === 'reaction_speed') newMetrics.reactionTime = extra;
            else if (gameId === 'persistence_challenge') newMetrics.levelReached = extra;
            else newMetrics.accuracy = extra;
        } else if (typeof extra === 'object' && extra !== null) {
            newMetrics.accuracy = extra.accuracy;
            newMetrics.reactionTime = extra.reactionTime;
            newMetrics.mistakes = extra.mistakes;
            newMetrics.completionTime = extra.completionTime;
            newMetrics.levelReached = extra.levelReached;
        }

        setMetrics(newMetrics);
        setStage('questions');
    }, [gameId]);

    const handleQuestionsComplete = (qResult: {
        stressScore: number;
        stressLevel: string;
        stressPercentage: number;
        riskFlag: boolean;
        riskMessage?: string;
    }) => {
        setResult({
            score: metrics.score,
            reactionTime: metrics.reactionTime,
            stressScore: qResult.stressScore,
            stressLevel: qResult.stressLevel,
        });
        setStage('result');
    };

    const handlePlayAgain = () => {
        setStage('game');
        setMetrics({ score: 0 });
        setResult(null);
    };

    const handleBack = () => navigate('/games');

    const renderGame = () => {
        // Map onComplete to capture as much data as possible
        const onComplete = (score: number, extra?: any) => handleGameComplete(score, extra);

        switch (gameId) {
            case 'reaction_speed':
                return <ReactionGame onComplete={onComplete} onBack={handleBack} />;
            case 'memory_pattern':
                return <MemoryGame onComplete={onComplete} onBack={handleBack} />;
            case 'focus_tracking':
                return <FocusGame onComplete={onComplete} onBack={handleBack} />;
            case 'emotional_recognition':
                return <EmotionGame onComplete={onComplete} onBack={handleBack} />;
            case 'decision_making':
                return <DecisionGame onComplete={onComplete} onBack={handleBack} />;
            case 'persistence_challenge':
                return <PersistenceGame onComplete={onComplete} onBack={handleBack} />;
            default:
                return (
                    <div className="flex items-center justify-center min-h-screen font-sans">
                        <div className="text-center">
                            <p className="text-gray-500 text-xl mb-4">Game not found: {gameId}</p>
                            <button onClick={handleBack} className="text-purple-600 underline">Go back</button>
                        </div>
                    </div>
                );
        }
    };

    if (stage === 'game') return renderGame();

    if (stage === 'questions') {
        return (
            <PostGameQuestions
                gameId={GAME_ID_MAP[gameId || ''] || (gameId ?? 'reaction_speed')}
                score={metrics.score}
                accuracy={metrics.accuracy}
                reactionTime={metrics.reactionTime}
                mistakes={metrics.mistakes}
                completionTime={metrics.completionTime}
                levelReached={metrics.levelReached}
                onComplete={handleQuestionsComplete}
            />
        );
    }

    if (stage === 'result' && result) {
        return (
            <GameResult
                gameType={gameId || ''}
                score={result.score}
                stressScore={result.stressScore}
                stressLevel={result.stressLevel}
                onPlayAgain={handlePlayAgain}
            />
        );
    }

    return null;
}
