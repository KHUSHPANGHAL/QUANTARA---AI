@echo off
title Quantara AI — Next.js 14 Institutional Terminal
echo =====================================================================
echo Starting Quantara Next.js 14 Institutional Terminal...
echo URL: http://localhost:3000
echo Press Ctrl+C in this terminal to stop the server.
echo =====================================================================
set PATH=C:\Quantara\nodejs;%PATH%
cd /d "%~dp0frontend"
call npm run dev
pause

