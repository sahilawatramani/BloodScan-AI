@echo off
title BloodScan AI - Startup Script
color 0B

echo ===================================================
echo     Starting BloodScan AI - Full Stack
echo ===================================================
echo.

:: Start the FastAPI Backend in a new window
echo [~] Starting FastAPI Backend on Port 8080...
start "BloodScan AI Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app:app --host 0.0.0.0 --port 8080"

:: Wait a few seconds for the backend to initialize
timeout /t 3 /nobreak >nul

:: Start the React Frontend in a new window
echo [~] Starting Vite Frontend Server...
start "BloodScan AI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [!] Both services are launching in separate windows.
echo [!] Wait roughly 10-15 seconds for the Keras model to load into memory.
echo [!] The application will be available at: http://localhost:5173
echo.
pause
