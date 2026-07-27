@echo off
title MAXX STREAM - Instalar Servico Windows
cd /d "%~dp0"
set SERVICE_NAME=MAXXSTREAM
set NODE_PATH=
set WORKING_DIR=%~dp0backend

:: Verifica se ja existe o servico
sc query %SERVICE_NAME% >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [AVISO] O servico %SERVICE_NAME% ja esta instalado.
    echo.
    echo  Opcoes:
    echo   1 - Reinstalar (remover e instalar novamente)
    echo   2 - Apenas iniciar o servico
    echo   3 - Sair
    echo.
    choice /c 123 /n /m "Escolha (1/2/3): "
    if errorlevel 3 exit /b
    if errorlevel 2 (
        sc start %SERVICE_NAME%
        echo Servico iniciado!
        exit /b
    )
    if errorlevel 1 (
        sc stop %SERVICE_NAME% >nul 2>&1
        sc delete %SERVICE_NAME% >nul 2>&1
        echo Servico antigo removido.
    )
)

:: Encontra o node.exe
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b
)

for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
echo Node.js encontrado em: %NODE_PATH%

:: Verifica se o nssm existe
if not exist "%~dp0nssm.exe" (
    echo Baixando NSSM (Non-Sucking Service Manager)...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TEMP%\nssm.zip'"
    powershell -Command "Expand-Archive -Path '%TEMP%\nssm.zip' -DestinationPath '%TEMP%\nssm' -Force"
    copy /Y "%TEMP%\nssm\nssm-2.24\win64\nssm.exe" "%~dp0nssm.exe" >nul 2>&1
    if not exist "%~dp0nssm.exe" (
        copy /Y "%TEMP%\nssm\nssm-2.24\win32\nssm.exe" "%~dp0nssm.exe" >nul 2>&1
    )
)

if not exist "%~dp0nssm.exe" (
    echo [ERRO] Nao foi possivel baixar o NSSM.
    echo Baixe manualmente de: https://nssm.cc/download
    echo Coloque o nssm.exe na pasta ao lado deste script.
    pause
    exit /b
)

:: Instala o servico
echo.
echo ========================================
echo   Instalando servico %SERVICE_NAME%...
echo ========================================
echo.

"%~dp0nssm.exe" install %SERVICE_NAME% "%NODE_PATH%" "src\server.js"
"%~dp0nssm.exe" set %SERVICE_NAME% AppDirectory "%WORKING_DIR%"
"%~dp0nssm.exe" set %SERVICE_NAME% AppStdout "%WORKING_DIR%\..\logs\output.log"
"%~dp0nssm.exe" set %SERVICE_NAME% AppStderr "%WORKING_DIR%\..\logs\error.log"
"%~dp0nssm.exe" set %SERVICE_NAME% AppRotateFiles 1
"%~dp0nssm.exe" set %SERVICE_NAME% AppRotateOnline 1
"%~dp0nssm.exe" set %SERVICE_NAME% Start SERVICE_AUTO_START
"%~dp0nssm.exe" set %SERVICE_NAME% DisplayName "MAXX STREAM Server"
"%~dp0nssm.exe" set %SERVICE_NAME% Description "Servidor IPTV MAXX STREAM - Inicia automaticamente com o Windows 24/7"
"%~dp0nssm.exe" set %SERVICE_NAME% ObjectName LocalSystem
"%~dp0nssm.exe" set %SERVICE_NAME% AppNoConsole 1
"%~dp0nssm.exe" set %SERVICE_NAME% AppRestartDelay 5000

:: Inicia o servico
sc start %SERVICE_NAME%

echo.
echo ========================================
echo   Servico instalado e iniciado!
echo ========================================
echo.
echo  Nome do servico: %SERVICE_NAME%
echo  Diretorio: %WORKING_DIR%
echo.
echo  O servidor vai iniciar automaticamente
echo  ao ligar o Windows (mesmo sem login).
echo.
echo  Acesse: http://localhost:5000
echo.
echo  Para gerenciar o servico:
echo    - services.msc (Servicos do Windows)
echo    - ou execute este script novamente
echo.
pause
