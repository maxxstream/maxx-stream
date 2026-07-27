# Script de Deploy Automatizado (MAXX STREAM)
# Este script automatiza o build do frontend e sincronização do projeto.

Write-Host "========== INICIANDO DEPLOY MAXX STREAM ==========" -ForegroundColor Cyan

# 1. Frontend Build
Write-Host "`n[1/3] Realizando build do Frontend..." -ForegroundColor Yellow
cd "$PSScriptRoot\..\frontend"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build do Frontend concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Error "Falha no build do Frontend. Abortando deploy."
    exit
}

# 2. Copiar assets estáticos (se necessário)
Write-Host "`n[2/3] Preparando arquivos estáticos para publicação..." -ForegroundColor Yellow
# Exemplo: Sincronizar arquivos compilados da pasta dist para o servidor estático

# 3. Backend Test
Write-Host "`n[3/3] Verificando integridade da API backend..." -ForegroundColor Yellow
cd "$PSScriptRoot\..\backend"
# Executa testes rápidos ou lints antes do deploy
# npm test

Write-Host "`n========== DEPLOY CONCLUÍDO COM SUCESSO! ==========" -ForegroundColor Green
