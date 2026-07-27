$ws = New-Object -ComObject WScript.Shell
$startup = [Environment]::GetFolderPath('Startup')
$sc = $ws.CreateShortcut("$startup\MAXX STREAM.lnk")
$sc.TargetPath = 'wscript.exe'
$sc.Arguments = "C:\Users\heros\Downloads\iptv maxx stream\start-server.vbs"
$sc.WorkingDirectory = "C:\Users\heros\Downloads\iptv maxx stream\backend"
$sc.Description = 'MAXX STREAM Server'
$sc.WindowStyle = 7
$sc.Save()

Write-Host "OK - Atalho criado em: $startup\MAXX STREAM.lnk"
Write-Host ""
Write-Host "O servidor MAXX STREAM iniciara automaticamente"
Write-Host "quando voce fizer login no Windows."
Write-Host ""
Write-Host "Acesse: http://localhost:5000"
