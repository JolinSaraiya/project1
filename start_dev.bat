@echo off
echo Starting Backend Server...
start "Node Backend" cmd /k "cd server && npm run dev"
timeout /t 2 >nul
echo Starting Frontend Client...
start "React Client" cmd /k "cd client && npm run dev"
echo Servers started in new windows.
