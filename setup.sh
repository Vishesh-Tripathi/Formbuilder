#!/bin/bash

# Form Builder Setup Script
# This script helps you get started with the Form Builder application

echo "🚀 Form Builder Setup"
echo "====================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check if MongoDB is running (optional check)
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB or use Docker Compose."
    fi
else
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is installed and running."
fi

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Environment file created. Please update .env with your settings."
fi

if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file..."
    cp server/.env.example server/.env
    echo "✅ Server environment file created."
fi

# Install dependencies
echo "📦 Installing dependencies..."

echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

echo "Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Make sure MongoDB is running (or use Docker: 'docker-compose up mongodb')"
echo "2. Start the server: 'cd server && npm run dev'"
echo "3. Start the client: 'cd client && npm run dev'"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For Docker deployment: 'docker-compose up --build'"
echo ""
echo "Happy form building! 🎉"
