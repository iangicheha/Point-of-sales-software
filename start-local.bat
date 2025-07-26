@echo off
echo Starting POS System locally...
echo.

echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both services are starting...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 