#!/bin/bash

# Beaver Market Bot Health Check Script
echo "🔍🦫 Beaver Market Bot Health Check"
echo "================================="

# Check if bot process is running
check_process() {
    echo "📊 Process Status:"
    
    # Check for PM2 process
    if command -v pm2 &> /dev/null; then
        PM2_STATUS=$(pm2 list | grep "beaver-market-bot" | grep "online" | wc -l)
        if [ "$PM2_STATUS" -gt 0 ]; then
            echo "✅ PM2 process running"
            pm2 show beaver-market-bot | grep -E "(status|uptime|memory|cpu)"
        else
            echo "❌ PM2 process not running"
        fi
    fi
    
    # Check for regular Node process
    NODE_PROCESS=$(pgrep -f "node.*index.js" | wc -l)
    if [ "$NODE_PROCESS" -gt 0 ]; then
        echo "✅ Node.js process running (PID: $(pgrep -f "node.*index.js"))"
    else
        echo "❌ Node.js process not found"
    fi
}

# Check database
check_database() {
    echo ""
    echo "💾 Database Status:"
    
    if [ -f "data/market_data.db" ]; then
        echo "✅ Database file exists"
        
        # Check database size
        DB_SIZE=$(du -h data/market_data.db | cut -f1)
        echo "📊 Database size: $DB_SIZE"
        
        # Check if we can connect to database (requires sqlite3)
        if command -v sqlite3 &> /dev/null; then
            TABLE_COUNT=$(sqlite3 data/market_data.db "SELECT count(name) FROM sqlite_master WHERE type='table';" 2>/dev/null)
            if [ "$TABLE_COUNT" -gt 0 ]; then
                echo "✅ Database accessible ($TABLE_COUNT tables)"
                
                # Check recent data
                RECENT_METRICS=$(sqlite3 data/market_data.db "SELECT COUNT(*) FROM market_metrics WHERE timestamp > datetime('now', '-1 hour');" 2>/dev/null)
                echo "📈 Recent metrics (last hour): $RECENT_METRICS"
            else
                echo "❌ Database connection failed"
            fi
        else
            echo "⚠️  sqlite3 not installed - can't check database internals"
        fi
    else
        echo "❌ Database file not found"
    fi
}

# Check log files
check_logs() {
    echo ""
    echo "📋 Log Status:"
    
    if [ -d "logs" ]; then
        echo "✅ Logs directory exists"
        
        LOG_FILES=("combined.log" "error.log")
        for log_file in "${LOG_FILES[@]}"; do
            if [ -f "logs/$log_file" ]; then
                LOG_SIZE=$(du -h "logs/$log_file" | cut -f1)
                RECENT_LINES=$(tail -n 10 "logs/$log_file" | wc -l)
                echo "📄 $log_file: $LOG_SIZE (recent lines: $RECENT_LINES)"
                
                # Check for recent errors
                RECENT_ERRORS=$(grep -c "error\|ERROR" "logs/$log_file" | tail -1 2>/dev/null || echo "0")
                if [ "$RECENT_ERRORS" -gt 0 ]; then
                    echo "⚠️  Recent errors in $log_file: $RECENT_ERRORS"
                fi
            else
                echo "❌ $log_file not found"
            fi
        done
        
        # Show last few log entries
        echo ""
        echo "📝 Last 3 log entries:"
        if [ -f "logs/combined.log" ]; then
            tail -n 3 logs/combined.log | while read line; do
                echo "   $line"
            done
        fi
    else
        echo "❌ Logs directory not found"
    fi
}

# Check disk space
check_disk_space() {
    echo ""
    echo "💿 Disk Space:"
    
    # Check current directory disk usage
    CURRENT_DIR_SIZE=$(du -sh . | cut -f1)
    echo "📁 Bot directory size: $CURRENT_DIR_SIZE"
    
    # Check available disk space
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $4 " available (" $5 " used)"}')
    echo "💾 Disk space: $DISK_USAGE"
}

# Check network connectivity
check_network() {
    echo ""
    echo "🌐 Network Connectivity:"
    
    # Test key API endpoints
    ENDPOINTS=(
        "api.telegram.org:443"
        "api.openai.com:443"
        "www.alphavantage.co:443"
        "finnhub.io:443"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${endpoint}" 2>/dev/null; then
            echo "✅ $endpoint reachable"
        else
            echo "❌ $endpoint unreachable"
        fi
    done
}

# Check configuration
check_config() {
    echo ""
    echo "⚙️  Configuration:"
    
    if [ -f ".env" ]; then
        echo "✅ .env file exists"
        
        # Check if required variables are set (without showing values)
        REQUIRED_VARS=("TELEGRAM_BOT_TOKEN" "OPENAI_API_KEY")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^$var=" .env && ! grep -q "^$var=$\|^$var=your_" .env; then
                echo "✅ $var configured"
            else
                echo "❌ $var not configured or using placeholder"
            fi
        done
    else
        echo "❌ .env file missing"
    fi
}

# Check system resources
check_resources() {
    echo ""
    echo "🖥️  System Resources:"
    
    # Memory usage
    if command -v free &> /dev/null; then
        MEMORY_INFO=$(free -h | grep "Mem:" | awk '{print $3 " used / " $2 " total"}')
        echo "🧠 Memory: $MEMORY_INFO"
    fi
    
    # CPU load
    if [ -f "/proc/loadavg" ]; then
        LOAD_AVG=$(cut -d' ' -f1-3 /proc/loadavg)
        echo "⚡ CPU Load: $LOAD_AVG"
    fi
    
    # Node.js process memory (if running)
    if pgrep -f "node.*index.js" > /dev/null; then
        NODE_PID=$(pgrep -f "node.*index.js")
        if command -v ps &> /dev/null; then
            NODE_MEMORY=$(ps -p $NODE_PID -o %mem --no-headers 2>/dev/null | tr -d ' ')
            echo "🤖 Bot memory usage: ${NODE_MEMORY}%"
        fi
    fi
}

# Run all checks
echo "Starting comprehensive health check..."
echo ""

check_process
check_database  
check_logs
check_disk_space
check_network
check_config
check_resources

echo ""
echo "================================="
echo "🏁 Health check completed"

# Summary
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "📅 Checked at: $TIMESTAMP"

# Create health report file
cat > logs/health-check.log << EOF
Beaver Market Bot Health Check Report
Generated: $TIMESTAMP

This report was generated by running: ./scripts/health-check.sh
See above output for detailed health status.

To resolve common issues:
1. Process not running: npm start or pm2 restart beaver-market-bot
2. Database issues: Check file permissions and disk space
3. Network issues: Verify internet connection and API keys
4. High resource usage: Consider restarting the bot

For more help, see README.md troubleshooting section.
EOF

echo "📄 Health report saved to logs/health-check.log"