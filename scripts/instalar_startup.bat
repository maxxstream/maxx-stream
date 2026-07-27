@echo off
title MAXX STREAM - Inicializacao Automatica
cd /d "%~dp0"
set TASK_NAME=MAXXSTREAM_Server
set SCRIPT_PATH=%~dp0start-server.vbs

echo ========================================
echo   Instalando inicializacao automatica
echo ========================================
echo.

:: Remove tarefa antiga se existir
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    schtasks /Delete /TN "%TASK_NAME%" /F >nul
    echo Tarefa antiga removida.
)

:: Cria tarefa no Task Scheduler - inicia ao fazer login
schtasks /Create /SC ONLOGON /TN "%TASK_NAME%" /TR "wscript.exe \"%SCRIPT_PATH%\"" /IT /RL HIGHEST /F

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Instalado com sucesso!
    echo ========================================
    echo.
    echo  O servidor MAXX STREAM vai iniciar
    echo  automaticamente quando voce fizer login.
    echo.
    echo  Para iniciar agora, execute:
    echo     start-server.vbs
    echo.
    echo  Acesse: http://localhost:5000
) else (
    echo.
    echo [ERRO] Execute como Administrador!
    echo  Clique com o botao direito neste arquivo
    echo  e selecione "Executar como administrador".
)

echo.
pause
