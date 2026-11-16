@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.13 or newer, then try again.
  pause
  exit /b 1
)
echo.
echo Your wishlist will be available at http://127.0.0.1:4173
echo Keep this window open while using Wishfully.
echo.
node server.mjs
if errorlevel 1 pause
