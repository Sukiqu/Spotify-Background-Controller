@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Uninstalling Spotify Background Controller...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
if errorlevel 1 (
  echo Uninstall did not complete. Review the error above.
  pause
  exit /b 1
)
pause
