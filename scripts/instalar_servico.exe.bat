@echo off
title MAXX STREAM - Instalar Servico
cd /d "C:\Users\heros\Downloads\iptv maxx stream"

:: Auto-elevar para admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Instalando servico MAXX STREAM...
echo.

:: Garantir que NSSM existe
if not exist "nssm.exe" (
    echo Baixando NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TEMP%\nssm.zip' -UseBasicParsing; Expand-Archive '%TEMP%\nssm.zip' '%TEMP%\nssm_extract' -Force; Copy-Item '%TEMP%\nssm_extract\nssm-2.24\win64\nssm.exe' 'nssm.exe'"
)

set NAME=MAXXSTREAM
set NODE=C:\Program Files\nodejs\node.exe
set WORKDIR=C:\Users\heros\Downloads\iptv maxx stream\backend

:: Para o servico antigo se existir
nssm.exe stop %NAME% >nul 2>&1
nssm.exe remove %NAME% confirm >nul 2>&1
timeout /t 2 /nobreak >nul

:: Instalar
nssm.exe install %NAME% "%NODE%" "src/server.js"
nssm.exe set %NAME% AppDirectory "%WORKDIR%"
nssm.exe set %NAME% AppStdout "C:\Users\heros\Downloads\iptv maxx stream\logs\output.log"
nssm.exe set %NAME% AppStderr "C:\Users\heros\Downloads\iptv maxx stream\logs\error.log"
nssm.exe set %NAME% AppRotateFiles 1
nssm.exe set %NAME% AppRotateOnline 1
nssm.exe set %NAME% Start SERVICE_AUTO_START
nssm.exe set %NAME% DisplayName "MAXX STREAM Server"
nssm.exe set %NAME% Description "Servidor IPTV MAXX STREAM - 24/7"
nssm.exe set %NAME% ObjectName LocalSystem
nssm.exe set %NAME% AppNoConsole 1
nssm.exe set %NAME% AppRestartDelay 5000

:: Iniciar
timeout /t 2 /nobreak >nul
nssm.exe start %NAME%

echo.
echo ========================================
echo   Servico instalado e iniciado!
echo ========================================
echo   Nome: %NAME%
echo   Roda 24/7 (mesmo sem ninguem logado)
echo   Acesse: http://localhost:5000
echo ========================================
echo.
pause
