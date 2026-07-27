@echo off
title MAXX STREAM - Servidor
cd /d "%~dp0backend"
echo ========================================
echo   MAXX STREAM - Servidor Iniciando...
echo ========================================
echo   API: http://localhost:5000
echo   OTP: http://localhost:3001
echo ========================================
start "" http://localhost:5000
node src/server.js
