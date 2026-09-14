@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo Installing Spotify Background Controller...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo Installation failed. Review the error above.
  pause
  exit /b 1
)

echo.
echo INSTALLATION COMPLETE - NEXT STEPS
echo 1. Fully close and restart Codex, then open a new LOCAL task.
echo 2. Open Spotify on the computer you want to control.
echo 3. In your Spotify developer app, save this Redirect URI:
echo    http://127.0.0.1:43821/callback
echo 4. In Codex, send:
echo    Connect Spotify Background Controller. Client ID: YOUR_CLIENT_ID
echo 5. Open the authorization link returned by Codex and approve Spotify access.
echo 6. Ask Codex to list devices, then choose your computer by its exact name.
echo 7. Try: Play Monster by Skillet on my computer.
echo    Or: Add Monster by Skillet to the queue.
echo.
echo Read README-ENGLISH.md for the complete setup guide.
echo Never share a Client Secret or password.
echo Keep this extracted folder in place: the registered server runs from here.
pause
