@echo off
title MAXX STREAM - Servidor OTP
color 0B

:: Mata qualquer processo antigo na porta 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo  ========================================
echo   MAXX STREAM - Servidor OTP
echo   Iniciando na porta 3001...
echo  ========================================
echo.
cd /d "%~dp0"
node otp-server.js
echo.
echo  Servidor encerrado. Pressione qualquer tecla...
pause > nul
