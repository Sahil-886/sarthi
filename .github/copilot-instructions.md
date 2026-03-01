# Sathi - Smart Mental Wellbeing Platform

## Project Overview

Sathi is a comprehensive AI-powered mental wellness platform that combines:
- **Cognitive Games**: 6 interactive games for mental health improvement
- **AI Companion**: Multilingual virtual assistant for emotional support
- **Stress Prediction**: ML-based stress assessment engine
- **Therapy Resources**: Books, videos, and breathing techniques
- **Analytics**: Detailed wellness tracking and historical data
- **Emergency Alerts**: SMS notifications to close friends

## Architecture

### Frontend (React + Vite + TypeScript)
- Modern, responsive UI with Tailwind CSS
- Smooth animations with Framer Motion
- State management with Zustand
- Type-safe with full TypeScript support

### Backend (FastAPI)
- RESTful API with OpenAPI documentation
- JWT authentication with bcrypt
- SQLAlchemy ORM for database abstraction
- Support for PostgreSQL and SQLite
- ChromaDB for vector memory (future)

## Quick Links

- **Setup Guide**: [SETUP.md](../SETUP.md)
- **Main README**: [README.md](../README.md)
- **Backend Code**: [backend/](../backend/)
- **Frontend Code**: [frontend/](../frontend/)

## Getting Started

### 1. Clone & Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

```bash
cd frontend
npm install
npm run dev
```

### 2. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Create Account
- Email: test@example.com
- Password: secure_password
- Follow onboarding flow

## Feature Implementation Status

| Feature | Status | Details |
|---------|--------|---------|
| Login/Signup | ✅ Complete | JWT auth, form validation |
| Permissions | ✅ Complete | Consent management, storage |
| Stress Categories | ✅ Complete | Multi-select, personalization |
| Dashboard | ✅ Complete | Real-time stress score |
| Games | ✅ Complete | 6 games, scoring system |
| AI Companion | ✅ Core Ready | Needs LLM integration |
| Stress Prediction | ✅ Core Ready | Needs ML model training |
| Therapy Resources | ✅ Complete | Books, videos, breathing exercises |
| Score Analytics | ✅ Complete | Charts, history, statistics |
| Emergency Alerts | ⚠️ Ready | Needs Twilio API key |
| Voice Synthesis | ⏳ Pending | Needs ElevenLabs integration |
| Avatar Video | ⏳ Pending | Needs D-ID integration |
| Emotion Detection | ⏳ Pending | Needs HuggingFace model |

## Next Steps

1. **Database Setup**
   - Configure PostgreSQL connection
   - Run migrations
   - Add initial data

2. **API Integrations**
   - OpenAI for advanced AI
   - ElevenLabs for voice
   - D-ID for avatars
   - Twilio for SMS

3. **Frontend Enhancements**
   - Add more game implementations
   - Implement real voice input/output
   - Add avatar display
   - Enhance UI animations

4. **Deployment**
   - Containerize with Docker
   - Set up CI/CD pipeline
   - Deploy to cloud (Heroku, AWS, etc.)
   - Configure production database

## Development Guidelines

### Code Structure
- **Backend**: Feature-based folder structure
- **Frontend**: Component-based folder structure
- **Types**: Shared TypeScript interfaces
- **API Client**: Centralized axios instance

### Adding Features
1. Create backend route in `app/routes/`
2. Create frontend page in `src/pages/`
3. Update types in `src/types/`
4. Update API client in `src/api/client.ts`

### Testing
```bash
# Backend (to implement)
pytest

# Frontend (to implement)
npm test
```

## Troubleshooting

**Port conflicts?**
```bash
# Find and kill process on port
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
kill -9 <PID>
```

**Database issues?**
- Check PostgreSQL is running
- Verify connection string in .env
- Run table creation if needed

**Module not found?**
- Reinstall dependencies
- Use virtual environment

## Project Statistics

- **Backend**: ~1000+ lines (core implementation)
- **Frontend**: ~2000+ lines (React components)
- **Database**: 7 main tables
- **API Endpoints**: 25+ endpoints
- **React Components**: 10+ pages

## Security Notes

✅ Implemented:
- Password hashing (bcrypt)
- JWT authentication
- CORS middleware
- Token-based API protection

⚠️ To Add for Production:
- Rate limiting
- Input validation
- HTTPS enforcement
- Database encryption
- API key rotation

## Contributing

1. Create feature branch
2. Make changes with clear commits
3. Update relevant documentation
4. Test thoroughly
5. Submit pull request

## Support

For questions or issues:
1. Check [SETUP.md](../SETUP.md) for setup help
2. Review API docs at http://localhost:8000/docs
3. Check error logs in terminal

---

**Status**: 🚀 Active Development
**Version**: 1.0.0
**Last Updated**: February 2026
