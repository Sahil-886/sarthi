#!/bin/bash

# Sathi Platform - Quick Start Script
# Run this script from the project root directory

echo "🚀 Starting Sathi Platform..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo -e "${BLUE}📁 Project Structure:${NC}"
echo "  Backend: $(pwd)/backend"
echo "  Frontend: $(pwd)/frontend"
echo ""

# Start Backend
echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
cd backend

# Check if requirements are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env created (update with your settings)${NC}"
fi

echo -e "${GREEN}✅ Backend ready${NC}"
echo "   Starting: python main.py"
echo "   Server: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

# Start Frontend
echo -e "${BLUE}🔧 Starting Frontend Server...${NC}"
cd ../frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Creating .env from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env created${NC}"
fi

echo -e "${GREEN}✅ Frontend ready${NC}"
echo "   Starting: npm run dev"
echo "   App: http://localhost:5173"
echo ""

echo -e "${GREEN}✅ All systems ready!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "   1. Open two terminal windows"
echo "   2. In Terminal 1, run: cd backend && python main.py"
echo "   3. In Terminal 2, run: cd frontend && npm run dev"
echo "   4. Open http://localhost:5173 in your browser"
echo "   5. Sign up and explore the platform!"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   Setup Guide: SETUP.md"
echo "   Full README: README.md"
echo "   Implementation Summary: IMPLEMENTATION_SUMMARY.md"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
