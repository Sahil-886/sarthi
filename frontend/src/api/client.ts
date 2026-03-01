import axios, { AxiosInstance } from 'axios';
import { PermissionConsent, GameScore, AIMessage } from '../types';

class APIClient {
  private client: AxiosInstance;
  private getTokenFn: (() => Promise<string | null>) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api',
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  setGetTokenFn(fn: () => Promise<string | null>) {
    this.getTokenFn = fn;
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(async (config: any) => {
      if (this.getTokenFn) {
        try {
          const token = await this.getTokenFn();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.error("Failed to fetch Clerk session token", e);
        }
      }
      return config;
    });

    // Clerk handles 401 redirects mostly natively via <SignedOut>,
    // but we still want Axios to cleanly reject.
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => Promise.reject(error)
    );
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  async getCurrentUser() {
    // Optional: Synchronize Clerk with Local DB
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // ── Permissions ──────────────────────────────────────────────────────────
  async setPermissions(permissions: PermissionConsent) {
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

  async selectStressCategories(categories: string[]) {
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

  async getGameDetails(gameId: string) {
    const response = await this.client.get(`/games/${gameId}`);
    return response.data;
  }

  async submitGameScore(gameScore: { game_name: string; score: number; accuracy?: number; response_time?: number; answers?: Record<string, any> }): Promise<GameScore> {
    const response = await this.client.post('/games/score', gameScore);
    return response.data;
  }

  async submitGame(data: {
    game_type: string;
    score: number;
    accuracy?: number;
    reaction_time?: number;
    mistakes?: number;
    completion_time?: number;
    level_reached?: number;
    answers: { stress_level: number; frustration: boolean };
  }): Promise<{
    game_score_id: number;
    stress_score: number;
    stress_level: string;
    cognitive_score: number;
    focus: number;
    memory: number;
    decision: number;
    emotion: number;
    message: string
  }> {
    const response = await this.client.post('/games/submit', data);
    return response.data;
  }

  async getQuestionsForGame(gameId: string) {
    const response = await this.client.get(`/games/questions/${gameId}`);
    return response.data;
  }

  async submitGameQuestions(data: {
    game_id: string;
    game_score_id?: number;
    answers: Array<{ question_id: string; answer: number }>;
  }) {
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
  async predictStress(data: {
    game_type: string;
    metrics: { reaction_time?: number; accuracy?: number; mistakes?: number; completion_time?: number; level_reached?: number };
    answers: { stress_level: number; frustration: boolean };
    history?: number[];
  }): Promise<{
    stress_level: number; stress_label: string; stress_score: number;
    confidence: number; cognitive_score: number;
    probabilities: { low: number; moderate: number; high: number };
    anomaly: { is_anomaly: boolean; severity: string; z_score: number; message: string };
    model: string;
  }> {
    const response = await this.client.post('/ml/predict-stress', data);
    return response.data;
  }

  async getUserBaseline(): Promise<{ baseline_mean: number | null; trend: string; recent_avg: number; deviation: number | null; sessions_used: number }> {
    const response = await this.client.get('/ml/user-baseline');
    return response.data;
  }

  // ── Scores / Analytics ───────────────────────────────────────────────────
  async getCurrentStressScore() {
    const response = await this.client.get('/scores/current');
    return response.data;
  }

  async getStressHistory(days: number = 30) {
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

  async updateUserPhone(phone: string) {
    const response = await this.client.patch('/user/profile', { phone_number: phone });
    return response.data;
  }

  // ── Support ──────────────────────────────────────────────────────────────
  async getHelplines(): Promise<{ helplines: { name: string; phone: string; description: string }[] }> {
    const response = await this.client.get('/support/helpline');
    return response.data;
  }

  async getSupportContact(): Promise<{ name: string; phone: string; whatsapp: string; email: string; hours: string; message: string }> {
    const response = await this.client.get('/support/contact');
    return response.data;
  }

  async sendAlert(type: 'stress' | 'risk'): Promise<{ queued: boolean; has_user_phone: boolean; has_friend_phone: boolean }> {
    const response = await this.client.post('/support/send-alert', { type });
    return response.data;
  }
  async chatWithCompanion(message: string, language: string = 'en', generateAvatar: boolean = false): Promise<AIMessage> {
    const response = await this.client.post('/ai-companion/chat', { message, language, generate_avatar: generateAvatar });
    return response.data;
  }

  async getConversationHistory(limit: number = 50) {
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

  async completeHabit(habitId: number) {
    const response = await this.client.post('/habits/complete', { habit_id: habitId });
    return response.data;
  }

  async generateAvatarVideo(text: string) {
    const response = await this.client.post('/ai-companion/avatar', { text });
    return response.data;
  }

  async generateVoice(text: string): Promise<Blob> {
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
