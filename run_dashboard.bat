@echo off
title Quantara AI - Institutional Dashboard Server
cd /d "%~dp0"
echo =====================================================================
echo Starting Quantara AI Institutional Web Dashboard...
echo Open your browser at: http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo =====================================================================
python web_app/server.py
if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start.
    echo Installing missing dependencies from requirements.txt...
    pip install -r requirements.txt
    echo Retrying server start...
    python web_app/server.py
    pause
)
