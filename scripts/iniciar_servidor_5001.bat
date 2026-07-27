@echo off
title MAXX STREAM - Porta 5001
cd /d "C:\Users\heros\Downloads\iptv maxx stream"
set PORT=5001
start "" /B "C:\Program Files\nodejs\node.exe" backend/src/server.js
echo Servidor MAXX STREAM iniciado na porta 5001!
echo Acesse: http://localhost:5001
