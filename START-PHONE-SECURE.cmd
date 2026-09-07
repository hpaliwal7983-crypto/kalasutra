@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   KalaSutra - Phone Secure Start
echo ========================================
echo.
echo Starting KalaSutra server...
start "KalaSutra Server" cmd /k "cd /d "%~dp0" && node server/server.js"
timeout /t 2 /nobreak >nul

echo.
echo Creating a secure HTTPS phone link...
echo Keep this window open.
echo.
call npx --yes localtunnel --port 3000
