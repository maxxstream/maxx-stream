@echo off
title MAXX STREAM - Servidor
cd /d "%~dp0backend"
echo ========================================
echo   MAXX STREAM - Iniciando servidor...
echo ========================================
echo.
echo  Acesse: http://localhost:5000
echo.
start http://localhost:5000
node src/server.js
pause