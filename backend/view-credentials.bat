@echo off
echo 🔑 TeachAI Test User Credentials Viewer
echo =====================================
echo.

cd /d "%~dp0"

REM Find the most recent credentials file
for /f "delims=" %%i in ('dir /b /o-d credentials\test-user-credentials-*.json 2^>nul') do (
    set "latest_file=%%i"
    goto :found
)

:notfound
echo ❌ No credentials file found!
echo.
echo To generate credentials, run:
echo   npm run seed:users
echo.
pause
exit /b 1

:found
echo 📁 Latest credentials file: %latest_file%
echo 📍 Location: credentials\%latest_file%
echo.
echo 🔍 Opening file in default JSON viewer...
echo.

REM Try to open with VS Code first, then default program
code "credentials\%latest_file%" 2>nul
if errorlevel 1 (
    start "" "credentials\%latest_file%"
)

echo ✅ Credentials file opened!
echo.
echo 💡 Quick Access:
echo   Admin: admin@teachai.com / Admin123!@#
echo   User:  alice.teacher@teachai.com / Teacher123!@#
echo   Free:  carol.student@teachai.com / Student123!@#
echo.
echo 🌐 Login URL: http://localhost:3000/login
echo.
pause