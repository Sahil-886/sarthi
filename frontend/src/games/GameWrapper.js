import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
// Game ID → canonical backend game_id mapping
const GAME_ID_MAP = {
    reaction_speed: 'reaction_speed',
    memory_pattern: 'memory_pattern',
    focus_tracking: 'focus_tracking',
    emotional_recognition: 'emotional_recognition',
    decision_making: 'decision_making',
    persistence_challenge: 'persistence_challenge',
};
export default function GameWrapper() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [stage, setStage] = useState('game');
    const [metrics, setMetrics] = useState({ score: 0 });
    const [result, setResult] = useState(null);
    const handleGameComplete = useCallback((score, extra) => {
        const newMetrics = { score };
        // Handle extra metrics based on game type
        // This mapping depends on how each game component calls onComplete
        if (typeof extra === 'number') {
            if (gameId === 'reaction_speed')
                newMetrics.reactionTime = extra;
            else if (gameId === 'persistence_challenge')
                newMetrics.levelReached = extra;
            else
                newMetrics.accuracy = extra;
        }
        else if (typeof extra === 'object' && extra !== null) {
            newMetrics.accuracy = extra.accuracy;
            newMetrics.reactionTime = extra.reactionTime;
            newMetrics.mistakes = extra.mistakes;
            newMetrics.completionTime = extra.completionTime;
            newMetrics.levelReached = extra.levelReached;
        }
        setMetrics(newMetrics);
        setStage('questions');
    }, [gameId]);
    const handleQuestionsComplete = (qResult) => {
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
        const onComplete = (score, extra) => handleGameComplete(score, extra);
        switch (gameId) {
            case 'reaction_speed':
                return _jsx(ReactionGame, { onComplete: onComplete, onBack: handleBack });
            case 'memory_pattern':
                return _jsx(MemoryGame, { onComplete: onComplete, onBack: handleBack });
            case 'focus_tracking':
                return _jsx(FocusGame, { onComplete: onComplete, onBack: handleBack });
            case 'emotional_recognition':
                return _jsx(EmotionGame, { onComplete: onComplete, onBack: handleBack });
            case 'decision_making':
                return _jsx(DecisionGame, { onComplete: onComplete, onBack: handleBack });
            case 'persistence_challenge':
                return _jsx(PersistenceGame, { onComplete: onComplete, onBack: handleBack });
            default:
                return (_jsx("div", { className: "flex items-center justify-center min-h-screen font-sans", children: _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-gray-500 text-xl mb-4", children: ["Game not found: ", gameId] }), _jsx("button", { onClick: handleBack, className: "text-purple-600 underline", children: "Go back" })] }) }));
        }
    };
    if (stage === 'game')
        return renderGame();
    if (stage === 'questions') {
        return (_jsx(PostGameQuestions, { gameId: GAME_ID_MAP[gameId || ''] || (gameId ?? 'reaction_speed'), score: metrics.score, accuracy: metrics.accuracy, reactionTime: metrics.reactionTime, mistakes: metrics.mistakes, completionTime: metrics.completionTime, levelReached: metrics.levelReached, onComplete: handleQuestionsComplete }));
    }
    if (stage === 'result' && result) {
        return (_jsx(GameResult, { gameType: gameId || '', score: result.score, stressScore: result.stressScore, stressLevel: result.stressLevel, onPlayAgain: handlePlayAgain }));
    }
    return null;
}
