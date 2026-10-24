@echo off
title SafeCity AI - Live Launcher
echo ========================================================
echo   Starting SafeCity AI Local Server & Live Public Link
echo ========================================================
echo.
echo [1/2] Starting PHP 8.3 Web Server on port 8000...
start "" "C:\Users\sanja\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 127.0.0.1:8000 -t "%~dp0"

timeout /t 2 /nobreak >nul
echo [2/2] Opening SafeCity AI in your default browser...
start "" "http://localhost:8000"

echo.
echo ========================================================
echo   Generating Live Public Internet Link via Cloudflare...
echo   (Copy the https://...trycloudflare.com link below)
echo ========================================================
echo.
"C:\Users\sanja\AppData\Local\Programs\cloudflared.exe" tunnel --url http://127.0.0.1:8000
pause

