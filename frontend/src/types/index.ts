export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PermissionConsent {
  data_processing: boolean;
  ai_companion: boolean;
  emergency_alert: boolean;
  privacy_policy: boolean;
}

export interface GameScore {
  id: number;
  user_id: number;
  game_name: string;
  score: number;
  accuracy?: number;
  response_time?: number;
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  duration: number;
  questions: string[];
}

export interface StressLog {
  id: number;
  user_id: number;
  stress_level: 'low' | 'moderate' | 'high';
  stress_score: number;
  created_at: string;
}

export interface AIMessage {
  user_message: string;
  ai_response: string;
  emotion_detected?: string;
  language: string;
  risk_level?: string;
  helpline_required?: boolean;
  consultants?: Array<{
    id: number;
    name: string;
    specialization: string;
    phone: string;
    email?: string | null;
    availability?: string;
    location?: string;
  }>;
  voice_url?: string;
  avatar_video?: string;
  avatar_video_url?: string;
  created_at?: string;
}
