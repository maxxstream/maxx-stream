@echo off
title MAXX STREAM
cd /d "%~dp0"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest 'http://localhost:5000/api/health' -TimeoutSec 2 -UseBasicParsing } catch { Write-Host 'Iniciando servidor...'; Start-Process powershell -NoProfile -WindowStyle Hidden -ArgumentList '-Command cd \"' + (Get-Location).Path + '\backend\"; node src/server.js'; Start-Sleep 3 }"
start http://localhost:5000/login.html
