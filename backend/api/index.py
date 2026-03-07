import sys
import os

# Add the parent directory to sys.path so 'app' can be found
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from main import app

# Vercel needs the app object to be exported
# This file serves as the entry point for Vercel Serverless Functions
