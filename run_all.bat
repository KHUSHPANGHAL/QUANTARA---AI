@echo off
title Quantara AI Full Stack Launcher
echo ========================================================
echo   Starting Quantara AI Full Stack Terminal
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Quantara Backend (FastAPI)" cmd /k "cd /d C:\Quantara\Quantara_ai-main && call C:\Users\khush\anaconda3\Scripts\activate.bat && python web_app/server.py"

echo [2/2] Starting Next.js Production Server on http://localhost:3000 ...
start "Quantara Frontend (Next.js 14)" cmd /k "cd /d C:\Quantara\Quantara_ai-main\frontend && set PATH=C:\Quantara\nodejs;%%PATH%% && npm run start -- -p 3000"

echo.
echo Both servers are launching!
echo Frontend: http://localhost:3000
echo Dashboard: http://localhost:3000/dashboard
echo API Status: http://127.0.0.1:8000/api/status
echo.
pause

