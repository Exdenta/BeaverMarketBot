import { Markup } from 'telegraf';
import { logger } from '../utils/logger.js';
import { AIAnalysisService } from '../services/aiAnalysis.js';

export function setupCommands(bot, services) {
    const { dbService, marketDataService, chartService, alertService } = services;
    const aiAnalysis = new AIAnalysisService();

    // Start command
    bot.start(async (ctx) => {
        try {
            const userId = ctx.from.id;
            const chatId = ctx.chat.id;
            
            await dbService.saveUserSettings(userId, chatId);
            
            const welcomeMessage = `🎯 <b>BeWare Market Bot</b> - Your Crash Detection Assistant

<b>🚀 FEATURES:</b>
• Real-time monitoring of 17 key market indicators
• AI-powered market condition analysis  
• Instant alerts when crash signals appear
• Interactive charts for all metrics
• Comprehensive market summaries

<b>📊 AVAILABLE COMMANDS:</b>
/status - Current market overview
/metrics - View all 17 indicators
/chart [metric] - Generate metric chart
/analyze - Get AI market analysis
/alerts - Configure alert settings
/help - Show all commands

<b>🔔 ALERT LEVELS:</b>
🟢 GREEN - Normal (maintain cash)
🟡 YELLOW - Warning (prepare)  
🟠 ORANGE - Early crash (deploy 25%)
🔴 RED - Full crash (deploy 50%+)
⚫ BLACK - Maximum opportunity (deploy ALL)

Ready to monitor market conditions and catch the next crash opportunity!`;

            await ctx.reply(welcomeMessage, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Current Status', 'status')],
                    [Markup.button.callback('📈 View Metrics', 'metrics'), Markup.button.callback('🤖 AI Analysis', 'analyze')],
                    [Markup.button.callback('📊 Quick Charts', 'quick_charts'), Markup.button.callback('⚙️ Settings', 'settings')]
                ])
            });
        } catch (error) {
            logger.error('Error in start command:', error);
            await ctx.reply('Error initializing bot. Please try again.');
        }
    });

    // Status command - Quick market overview
    bot.command('status', async (ctx) => {
        try {
            await ctx.reply('📊 Fetching current market status...');
            
            const metrics = await marketDataService.getAllMetrics();
            const summary = await marketDataService.generateMarketSummary('current');
            
            await ctx.reply(summary, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Refresh', 'refresh_status')],
                    [Markup.button.callback('📈 View Charts', 'status_charts'), Markup.button.callback('🤖 AI Analysis', 'ai_analyze')]
                ])
            });
        } catch (error) {
            logger.error('Error in status command:', error);
            await ctx.reply('Error fetching market status. Please try again.');
        }
    });

    // Metrics command - Show all indicators
    bot.command('metrics', async (ctx) => {
        try {
            await ctx.reply('📊 Loading all market metrics...');
            
            const metrics = await marketDataService.getAllMetrics();
            const message = formatMetricsMessage(metrics);
            
            await ctx.reply(message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Charts', 'metric_charts')],
                    [Markup.button.callback('⚠️ Alerts Only', 'alert_metrics')],
                    [Markup.button.callback('🔄 Refresh', 'refresh_metrics')]
                ])
            });
        } catch (error) {
            logger.error('Error in metrics command:', error);
            await ctx.reply('Error fetching metrics. Please try again.');
        }
    });

    // Chart command - Generate specific metric chart
    bot.command('chart', async (ctx) => {
        try {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                await ctx.reply('Please specify a metric. Example: /chart vix\n\nAvailable metrics: vix, cape, spy_rsi, put_call, fear_greed, mcclellan, high_low, yield_spread, dollar_index');
                return;
            }
            
            const metricName = args[1].toLowerCase();
            await ctx.reply(`📈 Generating ${metricName.toUpperCase()} chart...`);
            
            const historicalData = await dbService.getMetricHistory(metricName, 30);
            
            if (historicalData.length === 0) {
                await ctx.reply('No historical data available for this metric. Please try again later.');
                return;
            }
            
            const chartBuffer = await chartService.generateMetricChart(metricName, historicalData);
            
            await ctx.replyWithPhoto(
                { source: chartBuffer },
                {
                    caption: `📊 ${metricName.toUpperCase()} - Last 30 days`,
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('📈 More Charts', 'more_charts')],
                        [Markup.button.callback('🤖 Analyze', `analyze_${metricName}`)]
                    ])
                }
            );
        } catch (error) {
            logger.error('Error in chart command:', error);
            await ctx.reply('Error generating chart. Please try again.');
        }
    });

    // AI Analysis command
    bot.command('analyze', async (ctx) => {
        try {
            await ctx.reply('🤖 AI is analyzing current market conditions...');
            
            const metrics = await marketDataService.getAllMetrics();
            const analysis = await aiAnalysis.analyzeMarketConditions(metrics);
            
            const analysisMessage = `🤖 <b>AI MARKET ANALYSIS</b>

${analysis.summary}

<b>📊 RISK SCORE:</b> ${analysis.riskScore}/10
<b>📅 ANALYSIS TIME:</b> ${new Date(analysis.timestamp).toLocaleString()}

<i>This analysis considers all 17 market indicators and provides actionable guidance for crash detection and market timing.</i>`;

            await ctx.reply(analysisMessage, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 View Metrics', 'view_metrics_analysis')],
                    [Markup.button.callback('📈 Charts', 'analysis_charts')],
                    [Markup.button.callback('🔄 Refresh Analysis', 'refresh_analysis')]
                ])
            });
        } catch (error) {
            logger.error('Error in analyze command:', error);
            await ctx.reply('Error performing AI analysis. Please try again.');
        }
    });

    // Alerts command
    bot.command('alerts', async (ctx) => {
        try {
            const pendingAlerts = await dbService.getPendingAlerts();
            
            let message = '<b>🔔 ALERT SETTINGS & STATUS</b>\n\n';
            
            if (pendingAlerts.length > 0) {
                message += '<b>📢 PENDING ALERTS:</b>\n';
                pendingAlerts.slice(0, 5).forEach(alert => {
                    message += `• ${alert.metric_name}: ${alert.message}\n`;
                });
                
                if (pendingAlerts.length > 5) {
                    message += `... and ${pendingAlerts.length - 5} more\n`;
                }
            } else {
                message += '✅ No pending alerts\n';
            }
            
            message += '\n<b>⚙️ ALERT THRESHOLDS:</b>\n';
            message += '• VIX > 20: Yellow Alert\n';
            message += '• VIX > 30: Red Alert\n';
            message += '• RSI < 30: Oversold Alert\n';
            message += '• Put/Call > 1.2: Fear Alert\n';
            message += '• Fear & Greed < 20: Extreme Fear\n\n';
            
            message += '<i>Alerts are sent automatically when thresholds are crossed.</i>';
            
            await ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔧 Configure', 'config_alerts')],
                    [Markup.button.callback('🔕 Mute All', 'mute_alerts')],
                    [Markup.button.callback('🔔 Unmute All', 'unmute_alerts')]
                ])
            });
        } catch (error) {
            logger.error('Error in alerts command:', error);
            await ctx.reply('Error loading alerts. Please try again.');
        }
    });

    // Help command
    bot.command('help', async (ctx) => {
        const helpMessage = `📚 <b>BeWare Market Bot - Help Guide</b>

<b>🎯 PURPOSE:</b>
Monitor 17 key market indicators to detect crash opportunities and guide investment timing with €13,100 cash position.

<b>📊 COMMANDS:</b>

<b>/start</b> - Initialize bot and show welcome
<b>/status</b> - Quick market overview with alert level
<b>/metrics</b> - View all 17 market indicators
<b>/chart [metric]</b> - Generate chart for specific metric
<b>/analyze</b> - Get AI-powered market analysis
<b>/alerts</b> - View and configure alert settings
<b>/help</b> - Show this help guide

<b>📈 AVAILABLE METRICS:</b>
• <code>vix</code> - CBOE Volatility Index
• <code>cape</code> - Shiller CAPE Ratio  
• <code>spy_rsi</code> - S&P 500 RSI
• <code>put_call</code> - Put/Call Ratio
• <code>fear_greed</code> - CNN Fear & Greed Index
• <code>mcclellan</code> - McClellan Oscillator
• <code>high_low</code> - High-Low Index
• <code>yield_spread</code> - 10Y-2Y Treasury Spread
• <code>credit_spreads</code> - Corporate Credit Spreads
• <code>dollar_index</code> - US Dollar Index
• <code>nvda_pe</code> - NVIDIA P/E Ratio
• <code>semi_etf</code> - Semiconductor ETF Performance

<b>🚨 ALERT LEVELS:</b>
🟢 <b>GREEN:</b> Normal conditions - maintain 65%+ cash
🟡 <b>YELLOW:</b> Warning signs - prepare for opportunities
🟠 <b>ORANGE:</b> Early crash - deploy first 25% (€3,275)
🔴 <b>RED:</b> Full crash mode - deploy remaining cash
⚫ <b>BLACK:</b> Maximum opportunity - deploy ALL cash

<b>💡 EXAMPLES:</b>
<code>/chart vix</code> - Show VIX chart
<code>/metrics</code> - View all indicators
<code>/analyze</code> - Get AI analysis

Bot monitors automatically and sends alerts when crash signals appear!`;

        await ctx.reply(helpMessage, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📊 Current Status', 'status')],
                [Markup.button.callback('🤖 AI Analysis', 'analyze')]
            ])
        });
    });

    // Test command for development
    bot.command('test', async (ctx) => {
        try {
            await ctx.reply('🧪 Running test sequence...');
            
            // Test market data fetch
            const testMetrics = await marketDataService.getMetric('vix');
            await ctx.reply(`✅ Market data test: VIX = ${testMetrics}`);
            
            // Test database
            await dbService.saveMetric('test_metric', 123.45, { test: true });
            await ctx.reply('✅ Database test passed');
            
            // Test chart generation (basic)
            const testData = [
                { timestamp: new Date().toISOString(), value: 15.5 },
                { timestamp: new Date(Date.now() - 86400000).toISOString(), value: 16.2 }
            ];
            
            await ctx.reply('✅ All tests passed! Bot is functioning correctly.');
            
        } catch (error) {
            logger.error('Error in test command:', error);
            await ctx.reply(`❌ Test failed: ${error.message}`);
        }
    });
}

function formatMetricsMessage(metrics) {
    let message = '<b>📊 ALL MARKET METRICS</b>\n\n';
    
    // Level 1: Early Warning Indicators
    message += '<b>🚨 LEVEL 1 - EARLY WARNING:</b>\n';
    message += formatMetricLine('VIX', metrics.vix);
    message += formatMetricLine('CAPE Ratio', metrics.cape);
    message += formatMetricLine('VIX Term Structure', metrics.vixTermStructure);
    message += formatMetricLine('Margin Debt', metrics.marginDebt);
    
    // Level 2: Technical Indicators
    message += '\n<b>📈 LEVEL 2 - TECHNICAL:</b>\n';
    message += formatMetricLine('S&P 500 RSI', metrics.spyRsi);
    message += formatMetricLine('Put/Call Ratio', metrics.putCallRatio);
    message += formatMetricLine('McClellan Oscillator', metrics.mcclellanOscillator);
    message += formatMetricLine('High-Low Index', metrics.highLowIndex);
    
    // Level 3: Sentiment Indicators
    message += '\n<b>😰 LEVEL 3 - SENTIMENT:</b>\n';
    message += formatMetricLine('Fear & Greed', metrics.fearGreedIndex);
    message += formatMetricLine('AAII Bulls %', metrics.aaiiBulls);
    message += formatMetricLine('AAII Bears %', metrics.aaiiBears);
    message += formatMetricLine('Insider Ratio', metrics.insiderRatio);
    
    // Level 4: Economic Indicators
    message += '\n<b>🏦 LEVEL 4 - ECONOMIC:</b>\n';
    message += formatMetricLine('10Y-2Y Spread', metrics.yieldSpread);
    message += formatMetricLine('Credit Spreads', metrics.creditSpreads);
    message += formatMetricLine('Dollar Index', metrics.dollarIndex);
    
    // Level 5: AI Bubble Indicators
    message += '\n<b>🤖 LEVEL 5 - AI BUBBLE:</b>\n';
    message += formatMetricLine('NVIDIA P/E', metrics.nvdaPE);
    message += formatMetricLine('Semi ETF %', metrics.semiETF);
    
    message += `\n<i>📅 Updated: ${new Date().toLocaleString()}</i>`;
    
    return message;
}

function formatMetricLine(name, metric) {
    if (!metric || metric.error) {
        return `• ${name}: <code>N/A</code> ❌\n`;
    }
    
    const value = typeof metric.value === 'number' ? 
        metric.value.toFixed(2) : metric.value;
    
    const status = getMetricStatus(name, metric.value);
    
    return `• ${name}: <code>${value}</code> ${status}\n`;
}

function getMetricStatus(name, value) {
    if (typeof value !== 'number') return '⚪';
    
    switch (name) {
        case 'VIX':
            if (value > 40) return '🔴';
            if (value > 30) return '🟠';
            if (value > 20) return '🟡';
            if (value < 15) return '🔵';
            return '🟢';
            
        case 'S&P 500 RSI':
            if (value < 20) return '🟢';
            if (value < 30) return '🟡';
            if (value > 70) return '🔴';
            return '⚪';
            
        case 'Put/Call Ratio':
            if (value > 2.0) return '🟢';
            if (value > 1.5) return '🟡';
            if (value < 0.7) return '🔴';
            return '⚪';
            
        case 'Fear & Greed':
            if (value < 20) return '🟢';
            if (value < 40) return '🟡';
            if (value > 80) return '🔴';
            return '⚪';
            
        default:
            return '⚪';
    }
}