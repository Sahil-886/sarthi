#!/bin/bash

# 🎉 Sathi Platform - Quick Start Script
# Starts both backend and frontend servers

echo "╔════════════════════════════════════════════════════════╗"
echo "║     SATHI - SMART MENTAL WELLBEING PLATFORM            ║"
echo "║         Starting Backend & Frontend                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}📁 Working Directory: $SCRIPT_DIR${NC}"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: 'backend' directory not found${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: 'frontend' directory not found${NC}"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "backend/.venv" ] && [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing...${NC}"
    cd frontend
    npm install
    cd ..
fi

echo -e "${GREEN}✅ All dependencies ready!${NC}"
echo ""
echo -e "${BLUE}🚀 Starting Services...${NC}"
echo ""

# Start backend in background
echo -e "${YELLOW}Starting Backend (FastAPI on port 8000)...${NC}"
cd backend

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "../.venv" ]; then
    source ../.venv/bin/activate
fi

python main.py > backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo "   📍 http://localhost:8000"
    echo "   📖 API Docs: http://localhost:8000/docs"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "   Check backend.log for details"
    exit 1
fi

cd ..

# Start frontend
echo ""
echo -e "${YELLOW}Starting Frontend (Vite on port 5173)...${NC}"
cd frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo "   📍 http://localhost:5173"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo "   Check frontend.log for details"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                  🎉 ALL SYSTEMS READY!                 ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║"
echo "║  🌐 Frontend:        http://localhost:5173"
echo "║  🔧 Backend API:     http://localhost:8000"
echo "║  📖 API Docs:        http://localhost:8000/docs"
echo "║  🎥 Avatar Feature:  AI Companion → Send Message"
echo "║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Feature Status:"
echo "║  ✅ AI Companion with Avatar Videos (D-ID)"
echo "║  ✅ 6 Cognitive Games"
echo "║  ✅ Mental Wellness Analytics"
echo "║  ✅ Therapy Resources"
echo "║  ✅ Emergency Alert System"
echo "║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  To Stop Services:"
echo "║  Kill Backend:   kill $BACKEND_PID"
echo "║  Kill Frontend:  kill $FRONTEND_PID"
echo "║  Kill All:       kill $BACKEND_PID $FRONTEND_PID"
echo "║"
echo "║  View Logs:"
echo "║  Backend:  tail -f backend/backend.log"
echo "║  Frontend: tail -f frontend/frontend.log"
echo "║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Documentation:"
echo "║  📘 Setup Guide:         SETUP.md"
echo "║  📙 Integration Guide:   D-ID_INTEGRATION.md"
echo "║  📗 Resolution Summary:  RESOLUTION_SUMMARY.md"
echo "║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✨ Sathi Platform is now running!${NC}"
echo ""
echo "Press CTRL+C to stop the servers"
echo ""

# Keep the script running
wait
