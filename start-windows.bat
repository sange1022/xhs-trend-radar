@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Trying to install Node.js LTS with winget...
  winget install OpenJS.NodeJS.LTS
  echo.
  echo After Node.js installs, close this window and double-click start-windows.bat again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting local API...
start "XHS Radar API" cmd /k "cd /d %~dp0 && npm run api"

timeout /t 3 /nobreak >nul

echo Starting dashboard...
start "XHS Radar Dashboard" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening dashboard...
start http://127.0.0.1:5173/

echo.
echo Keep the two opened command windows running while using login and scan.
pause
