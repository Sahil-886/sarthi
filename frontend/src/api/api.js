import client from './client';
export const api = {
    // Fixes: Centralized Dashboard API Functions
    getStressScore: async () => {
        return await client.getCurrentStressScore();
    },
    getGameHistory: async () => {
        return await client.getGameHistory();
    },
    submitGameScore: async (gameScore) => {
        return await client.submitGameScore(gameScore);
    },
    getQuestionsForGame: async (gameId) => {
        return await client.getQuestionsForGame(gameId);
    },
    submitGameQuestions: async (data) => {
        return await client.submitGameQuestions(data);
    },
    getStressTrend: async (days = 30) => {
        return await client.getStressHistory(days);
    },
    clearStressHistory: async () => {
        return await client.clearHistory();
    },
    getAnalytics: async () => {
        return await client.getStressAnalytics();
    },
    sendAlert: async (type) => {
        return await client.sendAlert(type);
    },
    submitGame: async (data) => {
        return await client.submitGame(data);
    },
};
export default api;
