# Sathi - Smart Mental Wellbeing Platform

A comprehensive AI-powered mental wellness application combining cognitive games, stress prediction, AI companionship, and therapeutic resources.

## Project Structure

```
sathi/
├── backend/                 # FastAPI backend server
│   ├── app/
│   │   ├── core/           # Configuration, database, security
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routes/         # API endpoints
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── main.py            # Application entry point
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── api/           # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── index.html         # HTML template
│   ├── package.json       # NPM dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS config
│
└── README.md             # This file
```

## Features

### 1. **Authentication & Onboarding**
- User registration with close friend contact information
- Secure login with JWT tokens
- Permission and privacy consent management
- Stress category personalization

### 2. **Dashboard**
- Real-time stress score visualization
- Quick access to all features
- Current wellness status

### 3. **Cognitive Games** (6 games included)
- Reaction Speed
- Memory Pattern
- Focus Tracking
- Emotional Recognition
- Decision Making
- Persistence Challenge

Each game includes:
- Performance tracking
- Psychological question responses
- Score recording and analytics

### 4. **AI Companion**
- Multilingual support (English, Hindi, Hinglish)
- Emotion detection
- Personalized responses with memory
- Voice interaction (placeholder for integration)
- Avatar video support (placeholder for integration)

### 5. **Stress Prediction Engine**
- Analyzes game performance
- Processes emotional signals from conversations
- Generates stress scores: Low/Moderate/High
- Visual stress meter

### 6. **Therapy at Home**
- **Books**: Recommended therapy and self-help books
- **Videos**: Mental health and wellness videos
- **Breathing Techniques**: Guided exercises
  - Box Breathing
  - 4-7-8 Breathing
  - Alternate Nostril Breathing
  - Belly Breathing

### 7. **Score & Analytics**
- Historical trend charts
- Game performance statistics
- Stress metrics (average, peak, minimum)
- 30-day history tracking

### 8. **Emergency Alert System**
- SMS notifications via Twilio (when integrated)
- Close friend alert on high stress detection
- Consent-based notifications

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Database**: PostgreSQL (with SQLAlchemy ORM)
- **Authentication**: JWT + bcrypt
- **AI/NLP**: HuggingFace Transformers, Sentence Transformers
- **Vector Memory**: ChromaDB
- **Optional APIs**: OpenAI, ElevenLabs, D-ID, Twilio

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, can use SQLite for development)

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Run migrations** (when needed):
```bash
alembic upgrade head
```

4. **Start the server**:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

3. **Start development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Permissions
- `POST /api/permissions/consent` - Set permissions
- `GET /api/permissions/consent` - Get permissions

### Stress Categories
- `GET /api/stress/categories/available` - List categories
- `POST /api/stress/categories/select` - Select categories
- `GET /api/stress/categories/my-categories` - Get user's categories

### Games
- `GET /api/games/list` - List all games
- `GET /api/games/{game_id}` - Get game details
- `POST /api/games/score` - Submit game score
- `GET /api/games/history` - Get game history
- `GET /api/games/stats` - Get game statistics

### AI Companion
- `POST /api/ai-companion/chat` - Chat with AI
- `GET /api/ai-companion/history` - Get conversation history

### Therapy
- `GET /api/therapy/books` - List therapy books
- `GET /api/therapy/videos` - List therapy videos
- `GET /api/therapy/breathing-techniques` - List breathing techniques

### Scores & Analytics
- `GET /api/scores/current` - Current stress score
- `GET /api/scores/history` - Stress history
- `GET /api/scores/analytics` - Analytics data

## Development Workflow

### Adding a New Feature

1. **Backend**:
   - Create model in `app/models/`
   - Create schema in `app/schemas/`
   - Create route in `app/routes/`
   - Add business logic in `app/services/` if needed

2. **Frontend**:
   - Create page component in `src/pages/`
   - Add types in `src/types/`
   - Update API client in `src/api/client.ts`
   - Update routing in `src/App.tsx`

### Database Schema

Key tables:
- `users` - User accounts
- `user_permissions` - Privacy consent
- `stress_categories` - User-selected stress types
- `game_scores` - Game performance data
- `stress_logs` - Historical stress assessments
- `ai_conversations` - Chat history

## Integration Checklist

- [ ] PostgreSQL database setup
- [ ] OpenAI API key (for advanced AI features)
- [ ] ElevenLabs API (for voice synthesis)
- [ ] D-ID API (for avatar videos)
- [ ] Twilio (for SMS alerts)
- [ ] HuggingFace models (for emotion detection)
- [ ] Email service configuration
- [ ] Production secret key
- [ ] CORS configuration for production

## Environment Variables

### Backend (.env)
```
DEBUG=False
SECRET_KEY=<your-secret-key>
DATABASE_URL=postgresql://user:password@localhost:5432/sathi_db
OPENAI_API_KEY=<your-openai-key>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
```

## Production Deployment

### Backend
```bash
# Build and run with Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### Frontend
```bash
# Build optimized bundle
npm run build

# Deploy dist/ folder to static hosting
```

## Security Considerations

✅ Implemented:
- JWT authentication
- Password hashing with bcrypt
- CORS middleware
- Token-based API protection

⚠️ To Implement:
- Rate limiting
- Input validation and sanitization
- HTTPS/TLS in production
- Database encryption
- API key management
- OWASP compliance

## Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/new-feature`
4. Open Pull Request

## License

This project is proprietary and confidential.

## Support

For issues, questions, or feature requests, please contact the development team.

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Active Development
