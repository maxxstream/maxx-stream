Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute "nssm.exe", "restart MAXXSTREAM", Replace(WScript.ScriptFullName, WScript.ScriptName, ""), "runas", 0
