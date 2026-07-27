$name = "MAXXSTREAM"
$node = (Get-Command node).Source
$work = "C:\Users\heros\Downloads\iptv maxx stream\backend"
$script = "$work\src\server.js"

sc.exe delete $name 2>$null
Start-Sleep -Seconds 1

New-Service -Name $name `
  -BinaryPathName "`"$node`" `"$script`"" `
  -DisplayName "MAXX STREAM Server" `
  -Description "Servidor MAXX STREAM - 24/7" `
  -StartupType Automatic

Start-Sleep -Seconds 1
sc.exe failure $name reset=86400 actions=restart/5000/restart/10000/restart/30000
Start-Service $name

Write-Host "========================================"
Write-Host "  Servico MAXXSTREAM instalado!"
Write-Host "  Iniciando..."
Write-Host "========================================"
Start-Sleep -Seconds 3
$s = Get-Service $name
Write-Host "  Status: $($s.Status)"
Write-Host "  Acesse: http://localhost:5000"
