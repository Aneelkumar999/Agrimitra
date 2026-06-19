#!/usr/bin/env python3
import subprocess
import time
import os

# Change to backend directory
os.chdir('/home/anil/Documents/ AgriMitra v2.0/backend')

# Activate virtual environment
activate_script = '/home/anil/Documents/ AgriMitra v2.0/backend/venv/bin/activate'

# Start the server
print("Starting FastAPI server on http://127.0.0.1:8000")
print("Press Ctrl+C to stop")
print()

subprocess.run(['source', activate_script, '&&', 'uvicorn', 'main:app', '--reload'])