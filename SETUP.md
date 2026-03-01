# Sathi Smart Mental Wellbeing Platform - Setup Guide

## Quick Start

This guide will help you get the Sathi platform running on your local machine.

### System Requirements
- Python 3.9 or higher
- Node.js 18 or higher
- PostgreSQL 12+ (optional, SQLite works for development)
- Git

### Project Root: `/Users/sahildevendramakhamale/Desktop/sathi`

## Step 1: Backend Setup

### 1.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 1.2 Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Key configurations:
- `DATABASE_URL`: PostgreSQL connection string or sqlite:///./sathi.db
- `SECRET_KEY`: Change to a secure random string
- `OPENAI_API_KEY`: Optional, for AI features
- `TWILIO_*`: Optional, for SMS alerts

### 1.3 Initialize Database (if using PostgreSQL)

```bash
# If using Alembic migrations (create tables)
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 1.4 Run Backend Server

```bash
python main.py
```

Server will be available at: `http://localhost:8000`

## Step 2: Frontend Setup

### 2.1 Install Node Dependencies

```bash
cd ../frontend
npm install
```

### 2.2 Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

### 2.3 Run Development Server

```bash
npm run dev
```

Application will be available at: `http://localhost:5173`

## Testing the Application

### Create Test Account
1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill in the form:
   - Name: John Doe
   - Email: test@example.com
   - Password: Test123!
   - Close Friend: Jane Doe
   - Phone: +1234567890
4. Click "Create Account"

### Navigate Through Features
1. **Permissions Page**: Accept all permissions
2. **Stress Categories**: Select stress categories that apply
3. **Dashboard**: View your stress score and access features
4. **Games**: Play cognitive games
5. **AI Companion**: Chat with the AI assistant
6. **Therapy**: Access books, videos, and breathing techniques
7. **View Score**: Check your analytics and history

## API Documentation

### Health Check
```bash
curl http://localhost:8000/health
```

### Authentication Example
```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure_password",
    "close_friend_name": "Jane",
    "close_friend_phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure_password"
  }'
```

## Database Models

The application uses the following main tables:

- **users**: User accounts and profiles
- **user_permissions**: Privacy and consent settings
- **stress_categories**: User's selected stress types
- **game_scores**: Game performance data
- **stress_logs**: Historical stress assessments
- **ai_conversations**: Chat history
- **user_stress_categories**: Junction table

## Customization & Next Steps

### 1. Integrate Real APIs

**OpenAI Integration**:
```python
# In app/services/ai_service.py
import openai

openai.api_key = settings.OPENAI_API_KEY
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": user_message}]
)
```

**Twilio SMS Alerts**:
```python
# In app/services/alert_service.py
from twilio.rest import Client

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
message = client.messages.create(
    from_=settings.TWILIO_PHONE_NUMBER,
    to=user.close_friend_phone,
    body="Your friend might not be feeling well. Please check in."
)
```

**ElevenLabs Voice**:
```python
# In app/services/voice_service.py
import elevenlabs
elevenlabs.set_api_key(settings.ELEVENLABS_API_KEY)
```

### 2. Deploy to Production

**Backend (Heroku/Railway)**:
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

**Frontend (Vercel/Netlify)**:
```bash
npm run build
# Deploy the 'dist' folder
```

### 3. Database Migration to Production

For PostgreSQL setup:
```bash
# Install Alembic
pip install alembic

# Initialize migration environment
alembic init migrations

# Create first migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Troubleshooting

### Port Already in Use
```bash
# Backend (port 8000)
lsof -i :8000
kill -9 <PID>

# Frontend (port 5173)
lsof -i :5173
kill -9 <PID>
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure credentials are correct

### CORS Errors
- Check CORS middleware in `main.py`
- Ensure frontend URL matches allowed origins

### Module Import Errors
- Install all dependencies: `pip install -r requirements.txt`
- Use virtual environment: `python -m venv venv` && `source venv/bin/activate`

## File Structure Reference

```
backend/
├── main.py                 # FastAPI app initialization
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
└── app/
    ├── __init__.py
    ├── core/
    │   ├── config.py      # Settings and configuration
    │   ├── database.py    # Database setup
    │   ├── security.py    # JWT and password handling
    │   └── __init__.py
    ├── models/
    │   ├── user.py        # All database models
    │   └── __init__.py
    ├── schemas/
    │   ├── schemas.py     # Pydantic models
    │   └── __init__.py
    ├── routes/
    │   ├── auth_router.py
    │   ├── permissions_router.py
    │   ├── stress_router.py
    │   ├── games_router.py
    │   ├── ai_companion_router.py
    │   ├── therapy_router.py
    │   ├── scores_router.py
    │   └── __init__.py
    ├── services/
    │   └── __init__.py
    └── utils/
        └── __init__.py

frontend/
├── index.html             # HTML entry point
├── package.json           # npm dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
└── src/
    ├── main.tsx          # React entry point
    ├── App.tsx           # Main component
    ├── index.css         # Global styles
    ├── components/       # Reusable components
    ├── pages/            # Page components
    ├── store/            # Zustand store
    ├── api/              # API client
    └── types/            # TypeScript types
```

## Environment Checklists

### Development Environment
- [ ] Python virtual environment created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env files configured
- [ ] Database initialized
- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 5173)
- [ ] Can create user account
- [ ] Can login successfully

### Production Environment
- [ ] Environment variables set
- [ ] Database migrated
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Secrets manager configured
- [ ] Monitoring set up
- [ ] Backups configured

## Support & Documentation

For detailed information, see:
- Backend API: http://localhost:8000/docs (Swagger UI)
- Project README: See README.md in project root

---

**Version**: 1.0.0
**Last Updated**: February 2026
