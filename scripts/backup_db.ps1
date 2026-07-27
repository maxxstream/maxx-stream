# Script do PowerShell para Backup do Banco de Dados PostgreSQL
# Altere as variáveis de ambiente conforme a configuração do seu servidor.

$DB_NAME = "maxx_stream"
$DB_USER = "postgres"
$BACKUP_DIR = "C:\backups\maxx_stream"
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\backup_$DB_NAME`_$DATE.sql"

# Cria a pasta de backups se ela não existir
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR
    Write-Host "Pasta de backups criada com sucesso em $BACKUP_DIR" -ForegroundColor Green
}

Write-Host "Iniciando backup do banco de dados $DB_NAME..." -ForegroundColor Cyan

# Executa o utilitário pg_dump do PostgreSQL
& pg_dump -U $DB_USER -d $DB_NAME -F c -b -v -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup finalizado com sucesso! Arquivo salvo em: $BACKUP_FILE" -ForegroundColor Green
} else {
    Write-Warning "Falha ao realizar o backup. Verifique se o pg_dump está no PATH e se as credenciais estão corretas."
}
