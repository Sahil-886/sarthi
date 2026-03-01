import client from './client';
import { GameScore } from '../types';

export const api = {
    // Fixes: Centralized Dashboard API Functions
    getStressScore: async () => {
        return await client.getCurrentStressScore();
    },

    getGameHistory: async () => {
        return await client.getGameHistory();
    },

    submitGameScore: async (gameScore: { game_name: string; score: number; accuracy?: number; response_time?: number; answers?: Record<string, any> }): Promise<GameScore> => {
        return await client.submitGameScore(gameScore);
    },

    getQuestionsForGame: async (gameId: string) => {
        return await client.getQuestionsForGame(gameId);
    },

    submitGameQuestions: async (data: {
        game_id: string;
        game_score_id?: number;
        answers: Array<{ question_id: string; answer: number }>;
    }) => {
        return await client.submitGameQuestions(data);
    },

    getStressTrend: async (days: number = 30) => {
        return await client.getStressHistory(days);
    },

    clearStressHistory: async () => {
        return await client.clearHistory();
    },

    getAnalytics: async () => {
        return await client.getStressAnalytics();
    },

    sendAlert: async (type: 'stress' | 'risk') => {
        return await client.sendAlert(type);
    },

    submitGame: async (data: {
        game_type: string;
        score: number;
        accuracy?: number;
        reaction_time?: number;
        mistakes?: number;
        completion_time?: number;
        level_reached?: number;
        answers: { stress_level: number; frustration: boolean };
    }) => {
        return await client.submitGame(data);
    },
};

export default api;
