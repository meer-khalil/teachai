@echo off
echo Starting TeachAI Project...
echo.

echo Checking and freeing up required ports...

echo Checking port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo Found process using port 3000 with PID: %%a
    echo Attempting to kill process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo Successfully killed process %%a
    ) else (
        echo Trying alternative method for process %%a...
        wmic process where ProcessId=%%a delete >nul 2>&1
        if !errorlevel! == 0 (
            echo Successfully killed process %%a using WMIC
        ) else (
            echo Could not kill process %%a - it may require admin privileges
            echo You can manually kill it using: taskkill /F /PID %%a
        )
    )
)

echo Checking port 4000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000"') do (
    echo Found process using port 4000 with PID: %%a
    echo Attempting to kill process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo Successfully killed process %%a
    ) else (
        echo Trying alternative method for process %%a...
        wmic process where ProcessId=%%a delete >nul 2>&1
        if !errorlevel! == 0 (
            echo Successfully killed process %%a using WMIC
        ) else (
            echo Could not kill process %%a - it may require admin privileges
            echo You can manually kill it using: taskkill /F /PID %%a
        )
    )
)

echo Checking port 5000 (Flask API)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
    echo Found process using port 5000 with PID: %%a
    echo Attempting to kill process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo Successfully killed process %%a
    ) else (
        echo Trying alternative method for process %%a...
        wmic process where ProcessId=%%a delete >nul 2>&1
        if !errorlevel! == 0 (
            echo Successfully killed process %%a using WMIC
        ) else (
            echo Could not kill process %%a - it may require admin privileges
            echo You can manually kill it using: taskkill /F /PID %%a
        )
    )
)

echo Port cleanup completed!
echo.
echo Waiting 3 seconds for processes to fully terminate...
timeout /t 3 /nobreak >nul

echo Starting Backend Server...
start "TeachAI Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting Flask API with Virtual Environment...
echo Checking if virtual environment exists...
if exist "%~dp0flaskApi\venv\Scripts\activate.bat" (
    echo Virtual environment found - activating and starting Flask API...
    start "TeachAI Flask API" cmd /k "cd /d %~dp0flaskApi && call venv\Scripts\activate.bat && echo Virtual environment activated && python app.py"
) else if exist "%~dp0flaskApi\venv\Scripts\Activate.ps1" (
    echo PowerShell virtual environment found - using PowerShell activation...
    start "TeachAI Flask API" powershell -Command "cd '%~dp0flaskApi'; .\venv\Scripts\Activate.ps1; python app.py; Read-Host 'Press Enter to continue'"
) else (
    echo WARNING: Virtual environment not found at %~dp0flaskApi\venv\
    echo Starting Flask API without virtual environment...
    echo You may encounter import errors - please ensure virtual environment is created
    start "TeachAI Flask API" cmd /k "cd /d %~dp0flaskApi && python app.py"
)

echo Starting Frontend...
start "TeachAI Frontend" cmd /k "cd /d %~dp0 && npm start"

echo.
echo All services are starting...
echo Backend: http://localhost:4000
echo Flask API: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo If any service fails to start due to port conflicts,
echo try running this script as Administrator.
echo.
pause
