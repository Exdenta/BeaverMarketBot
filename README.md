# BeWare Market Bot 🤖📊

A comprehensive Telegram bot for market crash monitoring and analysis, tracking 17 key indicators to detect buying opportunities during market downturns.

## 🎯 Overview

This bot implements a complete market crash detection framework with:
- **17 Market Indicators**: VIX, CAPE, RSI, Put/Call ratio, Fear & Greed, McClellan, and more
- **5 Alert Levels**: GREEN → YELLOW → ORANGE → RED → BLACK
- **AI Analysis**: OpenAI-powered market condition summaries
- **Interactive Charts**: Visual representation of all metrics
- **Automated Alerts**: Real-time notifications when thresholds are crossed
- **Investment Guidance**: Specific cash deployment recommendations

## 🚀 Features

### Market Monitoring
- **Level 1 - Early Warning**: VIX, CAPE, VIX Term Structure, Margin Debt
- **Level 2 - Technical**: RSI, Put/Call Ratio, McClellan Oscillator, High-Low Index
- **Level 3 - Sentiment**: Fear & Greed, AAII Bulls/Bears, Insider Trading
- **Level 4 - Economic**: Yield Curve, Credit Spreads, Dollar Index
- **Level 5 - AI Bubble**: NVIDIA P/E, Semiconductor ETF performance

### Alert System
- 🟢 **GREEN**: Normal conditions (maintain 65%+ cash)
- 🟡 **YELLOW**: Warning signs (prepare for opportunities)
- 🟠 **ORANGE**: Early crash phase (deploy first 25% - €3,275)
- 🔴 **RED**: Full crash mode (deploy remaining cash aggressively)
- ⚫ **BLACK**: Maximum opportunity (deploy ALL remaining cash)

### AI Analysis
- Comprehensive market condition analysis
- Specific investment recommendations
- Risk scoring (1-10 scale)
- Timing guidance for cash deployment

### Interactive Features
- Real-time charts for all metrics
- Historical trend analysis
- Correlation analysis between indicators
- User-friendly Telegram interface with buttons

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot and show welcome message |
| `/status` | Quick market overview with current alert level |
| `/metrics` | View all 17 market indicators |
| `/chart [metric]` | Generate chart for specific metric |
| `/analyze` | Get AI-powered market analysis |
| `/alerts` | View and configure alert settings |
| `/help` | Show detailed help guide |
| `/test` | Run system diagnostics |

### Available Chart Metrics
- `vix` - CBOE Volatility Index
- `cape` - Shiller CAPE Ratio
- `spy_rsi` - S&P 500 RSI
- `put_call` - Put/Call Ratio
- `fear_greed` - CNN Fear & Greed Index
- `mcclellan` - McClellan Oscillator
- `high_low` - High-Low Index
- `yield_spread` - 10Y-2Y Treasury Spread
- `credit_spreads` - Corporate Credit Spreads
- `dollar_index` - US Dollar Index
- `nvda_pe` - NVIDIA P/E Ratio
- `semi_etf` - Semiconductor ETF Performance

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Telegram Bot Token (from @BotFather)
- API Keys for market data sources

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/BeWareMarketBot.git
cd BeWareMarketBot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# API Keys for Market Data
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
QUANDL_API_KEY=your_quandl_key

# OpenAI for Analysis
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_PATH=./data/market_data.db

# Monitoring Settings
CHECK_INTERVAL_MINUTES=30
ALERT_THRESHOLD_VIX=20
ALERT_THRESHOLD_RSI=30
```

### 4. Create Directories
```bash
mkdir -p data logs charts
```

### 5. Start the Bot
```bash
# Development
npm run dev

# Production
npm start
```

## 🔑 API Keys Required

### Telegram Bot Token
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Copy the provided token

### Alpha Vantage (Free)
- Sign up at https://www.alphavantage.co/support/#api-key
- Free tier: 5 calls/minute, 500 calls/day

### Finnhub (Free Tier Available)
- Sign up at https://finnhub.io/
- Free tier: 60 calls/minute

### OpenAI API Key
- Sign up at https://openai.com/api/
- Required for AI analysis features

### Optional APIs
- **Quandl**: For additional economic data
- **Yahoo Finance**: Used as fallback (no key required)

## 📊 Market Framework

The bot implements a comprehensive 5-level market monitoring framework:

### Alert Level Determination
```
GREEN (🟢):  Normal conditions
- VIX < 20
- RSI > 30  
- Put/Call < 1.0
- Fear & Greed > 40

YELLOW (🟡): Warning signs
- VIX 20-25
- RSI < 30 OR > 70
- Put/Call > 1.0
- Fear & Greed < 40

ORANGE (🟠): Early crash
- VIX 25-30
- RSI < 30
- Put/Call > 1.2
- McClellan < -50

RED (🔴): Full crash mode
- VIX 30-40
- RSI < 20
- Put/Call > 1.5
- McClellan < -100
- Fear & Greed < 20

BLACK (⚫): Maximum opportunity
- VIX > 40
- RSI < 15
- Put/Call > 2.0
- McClellan < -150
- Multiple confirming signals
```

### Investment Strategy
- **€13,100 Cash Position** ready for deployment
- **25% Increments**: Deploy cash in stages
- **Quality Focus**: Target high-quality ETFs and stocks
- **Timing Discipline**: Only buy during crash signals

## 🗄️ Database Schema

The bot uses SQLite with these main tables:

```sql
-- Market metrics with timestamps
market_metrics (id, metric_name, value, timestamp, metadata)

-- Alert history and tracking  
alerts (id, metric_name, alert_type, threshold_value, current_value, message, timestamp, sent)

-- User settings and preferences
user_settings (user_id, chat_id, notifications_enabled, alert_preferences, created_at)
```

## 🔄 Automated Monitoring

The bot runs continuous monitoring with:
- **Every 30 minutes**: Check all metrics and send alerts
- **9:00 AM**: Market open summary (weekdays)
- **5:00 PM**: Market close summary (weekdays)
- **Real-time**: User commands and chart generation

## 📈 Chart Generation

Interactive charts include:
- **Threshold Lines**: Visual alert levels
- **Color Coding**: Green/Yellow/Orange/Red zones
- **Historical Context**: 30-day trends
- **Technical Indicators**: RSI, moving averages
- **Dark Theme**: Optimized for readability

## 🤖 AI Analysis

The OpenAI integration provides:
- **Market Condition Summary**: Current state analysis
- **Investment Recommendations**: Specific % to deploy
- **Risk Assessment**: 1-10 risk scoring
- **Timing Guidance**: When to act
- **Supporting Evidence**: Key indicator confirmations

## 🚨 Alert Examples

### RED Alert Example
```
🔴 RED ALERT: VIX at 32.1 - Full crash mode activated!

📊 Metric: VIX
💰 Current Value: 32.1
📈 Recommendation: Deploy remaining cash aggressively: 25% per week over 4 weeks

⏰ 2:35 PM
```

### BLACK Alert Example  
```
🚨 URGENT MARKET ALERT 🚨

Multiple high-urgency signals detected:

1. 🔥 CAPITULATION SIGNAL: McClellan at -165 - Maximum buying opportunity!
2. ⚡ EXTREME OVERSOLD: S&P RSI at 18.2 - Strong buy signal!
3. 🎯 MAXIMUM PESSIMISM: Put/Call at 2.15 - Deploy all cash!

⚠️ IMMEDIATE ACTION REQUIRED ⚠️
```

## 🔧 Configuration

### Alert Thresholds
Modify thresholds in the `MarketDataService` class:
```javascript
thresholds: { 
    warning: 20, 
    danger: 30, 
    panic: 40 
}
```

### Monitoring Frequency
Adjust in `.env`:
```env
CHECK_INTERVAL_MINUTES=30  # Default: 30 minutes
```

### Cash Position
Update in AI analysis prompts and documentation:
```javascript
// Current: €13,100 cash position
// Modify deployment amounts in alert messages
```

## 🐛 Troubleshooting

### Common Issues

**Bot not responding**
- Check Telegram token validity
- Verify bot is started with correct token
- Check logs for errors

**No market data**
- Verify API keys are valid and not expired
- Check API rate limits
- Review network connectivity

**Charts not generating**
- Ensure chart.js dependencies installed
- Check file permissions for /charts directory
- Verify historical data exists

**AI analysis failing**
- Check OpenAI API key and credits
- Verify internet connectivity
- Review API rate limits

### Logs
Monitor logs in:
- `logs/combined.log` - All log messages
- `logs/error.log` - Error messages only
- Console output during development

## 🚀 Deployment

### VPS Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start bot with PM2
pm2 start src/index.js --name "market-bot"

# Setup auto-restart
pm2 startup
pm2 save
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_PATH=/app/data/market_data.db
```

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This bot is for educational and informational purposes only. It is not financial advice. Always do your own research and consult with qualified financial advisors before making investment decisions. Market conditions can change rapidly and past performance does not guarantee future results.

## 🆘 Support

For issues and questions:
- Open a GitHub issue
- Check the troubleshooting section
- Review logs for error details

---

**Built for crash detection and market timing** 🎯📊🤖