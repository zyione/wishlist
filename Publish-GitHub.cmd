@echo off
setlocal
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or is not available in PATH.
  pause
  exit /b 1
)
set "WISH_REMOTE="
for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "WISH_REMOTE=%%R"
if defined WISH_REMOTE (
  if /I not "%WISH_REMOTE%"=="https://github.com/zyione/wishlist.git" (
    echo The origin remote points somewhere else: %WISH_REMOTE%
    echo Nothing has been changed. Check the remote before publishing.
    pause
    exit /b 1
  )
) else (
  git remote add origin https://github.com/zyione/wishlist.git
  if errorlevel 1 goto failed
)
git rev-parse -q --verify MERGE_HEAD >nul 2>nul
if not errorlevel 1 goto finish_merge
git add -- .gitignore .env.example DEPLOYMENT.md README.md Start-Wishfully.cmd Publish-GitHub.cmd api lib migrations package.json public scripts server.mjs supabase tests vercel.json worker
if errorlevel 1 goto failed
git diff --cached --check
if errorlevel 1 goto failed
git diff --cached --quiet
if errorlevel 2 goto failed
if errorlevel 1 (
  git commit -m "Build Wishfully with Vercel and private Supabase storage"
  if errorlevel 1 goto failed
)
:sync_history
echo.
echo Fetching the existing GitHub history...
git fetch origin main
if errorlevel 1 goto failed
echo Merging the GitHub history without replacing either side...
git merge --no-edit --allow-unrelated-histories origin/main
if errorlevel 1 goto merge_pending
git push --set-upstream origin main
if errorlevel 1 goto failed
echo.
echo Wishfully source was pushed to https://github.com/zyione/wishlist
echo Return to ChatGPT to finish the Supabase and Vercel setup.
pause
exit /b 0
:finish_merge
rem Only the reviewed README conflict is resolved automatically here.
for /f "delims=" %%F in ('git diff --name-only --diff-filter^=U') do (
  if /I not "%%F"=="README.md" goto merge_pending
)
findstr /b /c:"<<<<<<< " /c:"=======" /c:">>>>>>> " README.md >nul
if errorlevel 2 goto failed
if not errorlevel 1 goto merge_pending
git add -- README.md Publish-GitHub.cmd
if errorlevel 1 goto failed
git diff --cached --check
if errorlevel 1 goto failed
git commit --no-edit
if errorlevel 1 goto failed
goto sync_history
:merge_pending
echo.
echo The merge needs attention. No force push was attempted.
echo Files that need conflict resolution:
git diff --name-only --diff-filter=U
echo.
echo Copy this output to ChatGPT. Your files and both histories are preserved.
pause
exit /b 1
:failed
echo.
echo Publishing did not finish. No force push was attempted.
echo Share the error shown above with ChatGPT so it can be resolved.
pause
exit /b 1
