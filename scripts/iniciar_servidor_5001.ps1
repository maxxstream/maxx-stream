$env:PORT=5001
$psi = New-Object Diagnostics.ProcessStartInfo
$psi.FileName = "C:\Program Files\nodejs\node.exe"
$psi.Arguments = "backend/src/server.js"
$psi.WorkingDirectory = "C:\Users\heros\Downloads\iptv maxx stream"
$psi.UseShellExecute = $true
$psi.CreateNoWindow = $true
$psi.WindowStyle = [Diagnostics.ProcessWindowStyle]::Hidden
[Diagnostics.Process]::Start($psi)
