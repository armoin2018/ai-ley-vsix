#!/bin/bash
# Setup script for AI-Ley Dashboard Extension

echo "🚀 Setting up AI-Ley Dashboard Extension..."
echo ""

# Navigate to extension directory
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"

# Compile TypeScript
echo ""
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo ""
echo "✅ Compilation successful"

# Package extension
echo ""
read -p "📦 Do you want to package the extension? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run package
    
    if [ $? -ne 0 ]; then
        echo "❌ Packaging failed"
        exit 1
    fi
    
    echo ""
    echo "✅ Extension packaged successfully!"
    echo ""
    echo "📄 VSIX file created: $(ls -1 *.vsix | tail -n 1)"
    echo ""
    echo "To install:"
    echo "  code --install-extension $(ls -1 *.vsix | tail -n 1)"
    echo ""
    echo "Or use VS Code UI: Extensions → '...' → Install from VSIX"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Press F5 in VS Code to test the extension"
echo "  2. Or install the packaged extension"
echo ""
