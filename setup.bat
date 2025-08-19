@echo off
echo 🚀 Form Builder Setup
echo =====================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Create environment files if they don't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ Environment file created. Please update .env with your settings.
)

if not exist server\.env (
    echo 📝 Creating server\.env file...
    copy server\.env.example server\.env
    echo ✅ Server environment file created.
)

REM Install dependencies
echo 📦 Installing dependencies...

echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)

echo Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Next Steps:
echo 1. Make sure MongoDB is running (or use Docker: 'docker-compose up mongodb')
echo 2. Start the server: 'cd server && npm run dev'
echo 3. Start the client: 'cd client && npm run dev'
echo 4. Open http://localhost:5173 in your browser
echo.
echo 📚 For Docker deployment: 'docker-compose up --build'
echo.
echo Happy form building! 🎉
pause
