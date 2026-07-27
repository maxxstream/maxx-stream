# ============================================================
#  MAXX STREAM — Instalador Automático do Node.js + Backend
# ============================================================
Write-Host "`n🚀 MAXX STREAM — Instalação Automática" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# ── 1. Verificar se Node já está instalado ──
$nodeOk = $null
try { $nodeOk = node --version 2>$null } catch {}

if ($nodeOk) {
    Write-Host "✅ Node.js já instalado: $nodeOk" -ForegroundColor Green
} else {
    Write-Host "📥 Baixando e instalando Node.js LTS..." -ForegroundColor Yellow
    
    # Download do instalador Node.js LTS
    $url  = "https://nodejs.org/dist/v20.15.0/node-v20.15.0-x64.msi"
    $dest = "$env:TEMP\node_installer.msi"
    
    Write-Host "   Baixando de $url ..."
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    
    Write-Host "   Instalando... (aguarde)"
    Start-Process msiexec.exe -ArgumentList "/i `"$dest`" /qn /norestart" -Wait
    
    # Atualiza PATH na sessão atual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    $v = node --version 2>$null
    if ($v) {
        Write-Host "✅ Node.js instalado com sucesso: $v" -ForegroundColor Green
    } else {
        Write-Host "❌ Instalação falhou. Instale manualmente em: https://nodejs.org" -ForegroundColor Red
        exit 1
    }
}

# ── 2. Instalar dependências do backend ──
Write-Host "`n📦 Instalando dependências do servidor OTP..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências." -ForegroundColor Red
    exit 1
}

# ── 3. Verificar se .env está configurado ──
Write-Host "`n🔍 Verificando configurações do .env..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".env"
$envContent = Get-Content $envPath -Raw

if ($envContent -match "seuemail@gmail.com") {
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: Você ainda não configurou o arquivo .env!" -ForegroundColor Red
    Write-Host "   Abra o arquivo: $envPath" -ForegroundColor Yellow
    Write-Host "   E preencha com seu Gmail e credenciais do Twilio." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 Siga o guia em: INSTALAR.md" -ForegroundColor Cyan
    Pause
    # Abre o .env no bloco de notas para edição
    notepad $envPath
} else {
    Write-Host "✅ Arquivo .env configurado!" -ForegroundColor Green
    
    # ── 4. Iniciar o servidor ──
    Write-Host "`n🚀 Iniciando servidor OTP na porta 3001..." -ForegroundColor Cyan
    Write-Host "   (Mantenha esta janela aberta enquanto usa o site)`n" -ForegroundColor Yellow
    node otp-server.js
}
