import axios from 'axios';
class APIClient {
    constructor() {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "getTokenFn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.client = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api',
            headers: { 'Content-Type': 'application/json' },
        });
        this.setupInterceptors();
    }
    setGetTokenFn(fn) {
        this.getTokenFn = fn;
    }
    setupInterceptors() {
        this.client.interceptors.request.use(async (config) => {
            if (this.getTokenFn) {
                try {
                    const token = await this.getTokenFn();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                catch (e) {
                    console.error("Failed to fetch Clerk session token", e);
                }
            }
            return config;
        });
        // Clerk handles 401 redirects mostly natively via <SignedOut>,
        // but we still want Axios to cleanly reject.
        this.client.interceptors.response.use((response) => response, (error) => Promise.reject(error));
    }
    // ── Auth ─────────────────────────────────────────────────────────────────
    async getCurrentUser() {
        // Optional: Synchronize Clerk with Local DB
        const response = await this.client.get('/auth/me');
        return response.data;
    }
    // ── Permissions ──────────────────────────────────────────────────────────
    async setPermissions(permissions) {
        const response = await this.client.post('/permissions/consent', permissions);
        return response.data;
    }
    async getPermissions() {
        const response = await this.client.get('/permissions/consent');
        return response.data;
    }
    // ── Stress Categories ────────────────────────────────────────────────────
    async getAvailableCategories() {
        const response = await this.client.get('/stress/categories/available');
        return response.data;
    }
    async selectStressCategories(categories) {
        const response = await this.client.post('/stress/categories/select', { categories });
        return response.data;
    }
    async getUserStressCategories() {
        const response = await this.client.get('/stress/categories/my-categories');
        return response.data;
    }
    // ── Games ────────────────────────────────────────────────────────────────
    async getGames() {
        const response = await this.client.get('/games/list');
        return response.data;
    }
    async getGameDetails(gameId) {
        const response = await this.client.get(`/games/${gameId}`);
        return response.data;
    }
    async submitGameScore(gameScore) {
        const response = await this.client.post('/games/score', gameScore);
        return response.data;
    }
    async submitGame(data) {
        const response = await this.client.post('/games/submit', data);
        return response.data;
    }
    async getQuestionsForGame(gameId) {
        const response = await this.client.get(`/games/questions/${gameId}`);
        return response.data;
    }
    async submitGameQuestions(data) {
        const response = await this.client.post('/games/questions/submit', data);
        return response.data;
    }
    async getGameHistory() {
        const response = await this.client.get('/games/history');
        return response.data;
    }
    async getGameStats() {
        const response = await this.client.get('/games/stats');
        return response.data;
    }
    // ── ML Prediction ────────────────────────────────────────────────────────
    async predictStress(data) {
        const response = await this.client.post('/ml/predict-stress', data);
        return response.data;
    }
    async getUserBaseline() {
        const response = await this.client.get('/ml/user-baseline');
        return response.data;
    }
    // ── Scores / Analytics ───────────────────────────────────────────────────
    async getCurrentStressScore() {
        const response = await this.client.get('/scores/current');
        return response.data;
    }
    async getStressHistory(days = 30) {
        const response = await this.client.get('/scores/history', { params: { days } });
        return response.data;
    }
    async clearHistory() {
        const response = await this.client.delete('/scores/clear');
        return response.data;
    }
    async getStressAnalytics() {
        const response = await this.client.get('/scores/analytics');
        return response.data;
    }
    async updateUserPhone(phone) {
        const response = await this.client.patch('/user/profile', { phone_number: phone });
        return response.data;
    }
    // ── Support ──────────────────────────────────────────────────────────────
    async getHelplines() {
        const response = await this.client.get('/support/helpline');
        return response.data;
    }
    async getSupportContact() {
        const response = await this.client.get('/support/contact');
        return response.data;
    }
    async sendAlert(type) {
        const response = await this.client.post('/support/send-alert', { type });
        return response.data;
    }
    async chatWithCompanion(message, language = 'en', generateAvatar = false) {
        const response = await this.client.post('/ai-companion/chat', { message, language, generate_avatar: generateAvatar });
        return response.data;
    }
    async getConversationHistory(limit = 50) {
        const response = await this.client.get('/ai-companion/history', { params: { limit } });
        return response.data;
    }
    async clearConversationHistory() {
        const response = await this.client.delete('/ai-companion/history');
        return response.data;
    }
    async getStreak() {
        const response = await this.client.get('/streak/current');
        return response.data;
    }
    async getXP() {
        const response = await this.client.get('/gamification/xp');
        return response.data;
    }
    async getHabitsToday() {
        const response = await this.client.get('/habits/today');
        return response.data;
    }
    async completeHabit(habitId) {
        const response = await this.client.post('/habits/complete', { habit_id: habitId });
        return response.data;
    }
    async generateAvatarVideo(text) {
        const response = await this.client.post('/ai-companion/avatar', { text });
        return response.data;
    }
    async generateVoice(text) {
        const response = await this.client.post('/ai-companion/voice', null, {
            params: { text },
            responseType: 'blob'
        });
        return response.data;
    }
    // ── Therapy ──────────────────────────────────────────────────────────────
    async getTherapyBooks() {
        const response = await this.client.get('/therapy/books');
        return response.data;
    }
    async getTherapyVideos() {
        const response = await this.client.get('/therapy/videos');
        return response.data;
    }
    async getBreathingTechniques() {
        const response = await this.client.get('/therapy/breathing-techniques');
        return response.data;
    }
}
export default new APIClient();
