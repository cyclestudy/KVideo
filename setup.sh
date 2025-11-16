#!/bin/bash

# KVideo Platform - Installation Script

echo "🎬 KVideo Platform Setup"
echo "========================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first: https://nodejs.org/"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "1. Configure video API sources in lib/api/video-sources.ts"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📖 Documentation:"
echo "- SETUP.md for detailed setup instructions"
echo "- IMPLEMENTATION.md for architecture details"
echo "- SUMMARY.md for overview"
echo ""
echo "✨ Setup complete! Happy coding!"
