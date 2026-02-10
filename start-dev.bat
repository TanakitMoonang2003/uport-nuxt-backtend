@echo off
echo Starting Portfolio Backend Development Server...
echo.

REM Check if .env file exists, if not create it
if not exist ".env" (
    echo Creating .env file...
    echo BREVO_API_KEY=your-brevo-api-key-here> .env
    echo BREVO_FROM_EMAIL=your-email@example.com>> .env
    echo MONGODB_URI=mongodb://localhost:27017/portfolio>> .env
    echo JWT_SECRET=your-jwt-secret-here>> .env
)

REM Kill any existing Node processes (optional)
echo Stopping any existing Node processes...
taskkill /f /im node.exe >nul 2>&1

REM Start the development server
echo Starting Next.js development server on port 3001...
echo.
echo ✅ Backend will be available at: http://localhost:3001
echo ✅ API endpoints will be available at: http://localhost:3001/api/*
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev -- --port 3001
