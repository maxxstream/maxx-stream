$serviceName = "MAXXSTREAM"
$nodePath = (Get-Command node).Source
$workDir = "C:\Users\heros\Downloads\iptv maxx stream\backend"
$nssmPath = "C:\Users\heros\Downloads\iptv maxx stream\nssm.exe"

if (-not (Test-Path $nssmPath)) {
    Write-Host "Baixando NSSM..." -ForegroundColor Yellow
    $zip = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath "$env:TEMP\nssm" -Force
    if (Test-Path "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe") {
        Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" $nssmPath
    } else {
        Copy-Item "$env:TEMP\nssm\nssm-2.24\win32\nssm.exe" $nssmPath
    }
}

if (-not (Test-Path $nssmPath)) {
    Write-Host "ERRO: Nao foi possivel baixar NSSM. Baixe manualmente de https://nssm.cc/download" -ForegroundColor Red
    exit 1
}

Write-Host "Removendo servico antigo se existir..." -ForegroundColor Yellow
& $nssmPath stop $serviceName 2>$null
& $nssmPath remove $serviceName confirm 2>$null

Write-Host "Instalando servico MAXX STREAM..." -ForegroundColor Green
& $nssmPath install $serviceName $nodePath "src/server.js"
& $nssmPath set $serviceName AppDirectory $workDir
& $nssmPath set $serviceName AppStdout "$workDir\..\logs\output.log"
& $nssmPath set $serviceName AppStderr "$workDir\..\logs\error.log"
& $nssmPath set $serviceName AppRotateFiles 1
& $nssmPath set $serviceName AppRotateOnline 1
& $nssmPath set $serviceName Start SERVICE_AUTO_START
& $nssmPath set $serviceName DisplayName "MAXX STREAM Server"
& $nssmPath set $serviceName Description "Servidor IPTV MAXX STREAM - 24/7"
& $nssmPath set $serviceName ObjectName LocalSystem
& $nssmPath set $serviceName AppNoConsole 1
& $nssmPath set $serviceName AppRestartDelay 5000

Start-Sleep -Seconds 1
& $nssmPath start $serviceName

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servico instalado e iniciado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nome: $serviceName"
Write-Host "  Roda 24/7 (mesmo sem ninguem logado)"
Write-Host "  Acesse: http://localhost:5000"
Write-Host "========================================"
