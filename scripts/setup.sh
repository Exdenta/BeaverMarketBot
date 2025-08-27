#!/bin/bash

# Beaver Market Bot Setup Script
echo "🦫 Beaver Market Bot Setup Starting..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data logs charts

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before starting the bot"
else
    echo "✅ .env file already exists"
fi

# Set permissions
echo "🔧 Setting permissions..."
chmod +x scripts/*.sh
chmod 755 data logs charts

# Create systemd service file (optional)
create_systemd_service() {
    echo "🔧 Creating systemd service file..."
    
    cat > /tmp/beaver-market-bot.service << EOF
[Unit]
Description=Beaver Market Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    echo "📝 Service file created at /tmp/beaver-market-bot.service"
    echo "   To install: sudo cp /tmp/beaver-market-bot.service /etc/systemd/system/"
    echo "   Then run: sudo systemctl enable beaver-market-bot.service"
    echo "   Start with: sudo systemctl start beaver-market-bot.service"
}

# Ask if user wants to create systemd service
read -p "🤔 Create systemd service file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    create_systemd_service
fi

# Test installation
echo "🧪 Testing installation..."
timeout 10s node -e "
const fs = require('fs');
const path = require('path');

// Check if main files exist
const requiredFiles = [
    'src/index.js',
    'src/services/database.js',
    'src/services/marketData.js',
    'src/handlers/commands.js'
];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(\`❌ Missing file: \${file}\`);
        process.exit(1);
    }
}

console.log('✅ All required files present');
console.log('✅ Installation test passed');
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Installation test passed"
else
    echo "⚠️  Installation test failed or timed out"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - TELEGRAM_BOT_TOKEN (from @BotFather)"
echo "   - TELEGRAM_CHAT_ID (your chat ID)" 
echo "   - ALPHA_VANTAGE_API_KEY (free from alphavantage.co)"
echo "   - OPENAI_API_KEY (from openai.com)"
echo ""
echo "2. Start the bot:"
echo "   npm run dev  (development)"
echo "   npm start    (production)"
echo ""
echo "3. Or use PM2 for production:"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "4. Or use Docker:"
echo "   docker-compose up -d"
echo ""
echo "📚 See README.md for detailed instructions"
echo "🦫 Happy crash monitoring with Beaver Market Bot!"