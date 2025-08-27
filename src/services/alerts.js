import { logger } from '../utils/logger.js';

export class AlertService {
    constructor(bot) {
        this.bot = bot;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.alertHistory = new Map();
        this.cooldownPeriod = 30 * 60 * 1000; // 30 minutes
    }

    async checkAlerts(metrics) {
        const alerts = [];
        
        try {
            for (const [metricName, data] of Object.entries(metrics)) {
                if (data.error) continue;
                
                const metricAlerts = await this.evaluateMetric(metricName, data);
                alerts.push(...metricAlerts);
            }
            
            const urgentAlerts = alerts.filter(alert => alert.urgency === 'HIGH');
            if (urgentAlerts.length > 0) {
                await this.sendUrgentAlert(urgentAlerts);
            }
            
            return alerts;
        } catch (error) {
            logger.error('Error checking alerts:', error);
            return [];
        }
    }

    async evaluateMetric(metricName, data) {
        const alerts = [];
        const { value, config } = data;
        const thresholds = config.thresholds;
        
        switch (metricName) {
            case 'vix':
                alerts.push(...this.checkVIXAlerts(value, thresholds));
                break;
            case 'vixTermStructure':
                alerts.push(...this.checkVIXTermStructureAlerts(value, thresholds));
                break;
            case 'cape':
                alerts.push(...this.checkCAPEAlerts(value, thresholds));
                break;
            case 'marginDebt':
                alerts.push(...this.checkMarginDebtAlerts(value, thresholds));
                break;
            case 'mcclellanOscillator':
                alerts.push(...this.checkMcclellanAlerts(value, thresholds));
                break;
            case 'putCallRatio':
                alerts.push(...this.checkPutCallAlerts(value, thresholds));
                break;
            case 'spyRsi':
                alerts.push(...this.checkRSIAlerts(value, thresholds));
                break;
            case 'highLowIndex':
                alerts.push(...this.checkHighLowAlerts(value, thresholds));
                break;
            case 'fearGreedIndex':
                alerts.push(...this.checkFearGreedAlerts(value, thresholds));
                break;
            case 'aaiiBulls':
            case 'aaiiBears':
                alerts.push(...this.checkAAIIAlerts(metricName, value, thresholds));
                break;
            case 'insiderRatio':
                alerts.push(...this.checkInsiderAlerts(value, thresholds));
                break;
            case 'yieldSpread':
                alerts.push(...this.checkYieldSpreadAlerts(value, thresholds));
                break;
            case 'creditSpreads':
                alerts.push(...this.checkCreditSpreadAlerts(value, thresholds));
                break;
            case 'dollarIndex':
                alerts.push(...this.checkDollarAlerts(value, thresholds));
                break;
            case 'nvdaPE':
                alerts.push(...this.checkNVDAPEAlerts(value, thresholds));
                break;
            case 'semiETF':
                alerts.push(...this.checkSemiETFAlerts(value, thresholds));
                break;
        }
        
        return alerts.map(alert => ({
            ...alert,
            metricName,
            timestamp: new Date().toISOString(),
            value
        }));
    }

    checkVIXAlerts(value, thresholds) {
        const alerts = [];
        
        if (value >= thresholds.panic) {
            alerts.push({
                type: 'PANIC_BUYING_OPPORTUNITY',
                urgency: 'HIGH',
                message: `🚨 MAXIMUM CRASH BUYING OPPORTUNITY! VIX at ${value.toFixed(1)} - Deploy ALL remaining cash!`,
                recommendation: 'Deploy remaining 50% cash immediately into quality assets',
                emoji: '🔴⚫'
            });
        } else if (value >= thresholds.danger) {
            alerts.push({
                type: 'CRASH_MODE',
                urgency: 'HIGH',
                message: `🔴 RED ALERT: VIX at ${value.toFixed(1)} - Full crash mode activated!`,
                recommendation: 'Deploy remaining cash aggressively: 25% per week over 4 weeks',
                emoji: '🔴'
            });
        } else if (value >= thresholds.warning) {
            alerts.push({
                type: 'EARLY_CRASH',
                urgency: 'MEDIUM',
                message: `🟠 ORANGE ALERT: VIX at ${value.toFixed(1)} - Early crash phase detected`,
                recommendation: 'Deploy first 25% of cash (€3,275) into quality ETFs',
                emoji: '🟠'
            });
        } else if (value >= 15) {
            alerts.push({
                type: 'ELEVATED_VOLATILITY',
                urgency: 'LOW',
                message: `🟡 YELLOW ALERT: VIX at ${value.toFixed(1)} - Volatility rising`,
                recommendation: 'Prepare for potential opportunities, increase monitoring frequency',
                emoji: '🟡'
            });
        }
        
        return alerts;
    }

    checkVIXTermStructureAlerts(value, thresholds) {
        if (value > 0) {
            return [{
                type: 'VIX_BACKWARDATION',
                urgency: 'HIGH',
                message: `⚠️ VIX BACKWARDATION DETECTED! Front month ${Math.abs(value).toFixed(1)} points above 3-month VIX`,
                recommendation: 'Prepare for crash within 1-4 weeks',
                emoji: '⚠️'
            }];
        }
        return [];
    }

    checkCAPEAlerts(value, thresholds) {
        const alerts = [];
        
        if (value > thresholds.bubble) {
            alerts.push({
                type: 'EXTREME_BUBBLE',
                urgency: 'MEDIUM',
                message: `💰 EXTREME BUBBLE: CAPE at ${value.toFixed(1)} - Only occurred 6 times in 150 years!`,
                recommendation: 'Maintain maximum cash position, prepare for generational buying opportunity',
                emoji: '💰'
            });
        } else if (value > thresholds.overvalued) {
            alerts.push({
                type: 'BUBBLE_TERRITORY',
                urgency: 'LOW',
                message: `📈 BUBBLE TERRITORY: CAPE at ${value.toFixed(1)} - Market extremely overvalued`,
                recommendation: 'Reduce risk positions, maintain high cash levels',
                emoji: '📈'
            });
        }
        
        return alerts;
    }

    checkMarginDebtAlerts(value, thresholds) {
        // This would check for month-over-month decline
        return [];
    }

    checkMcclellanAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.capitulation) {
            alerts.push({
                type: 'CAPITULATION',
                urgency: 'HIGH',
                message: `🔥 CAPITULATION SIGNAL: McClellan at ${value.toFixed(0)} - Maximum buying opportunity!`,
                recommendation: 'Deploy all remaining cash immediately',
                emoji: '🔥'
            });
        } else if (value <= thresholds.oversold) {
            alerts.push({
                type: 'OVERSOLD_BREADTH',
                urgency: 'MEDIUM',
                message: `📉 SEVERE OVERSOLD: McClellan at ${value.toFixed(0)} - Start deploying cash`,
                recommendation: 'Deploy first 25% of cash reserves',
                emoji: '📉'
            });
        }
        
        return alerts;
    }

    checkPutCallAlerts(value, thresholds) {
        const alerts = [];
        
        if (value >= thresholds.extreme) {
            alerts.push({
                type: 'MAXIMUM_PESSIMISM',
                urgency: 'HIGH',
                message: `🎯 MAXIMUM PESSIMISM: Put/Call at ${value.toFixed(2)} - Deploy all cash!`,
                recommendation: 'Maximum buying opportunity - deploy all remaining reserves',
                emoji: '🎯'
            });
        } else if (value >= thresholds.panic) {
            alerts.push({
                type: 'PANIC_SELLING',
                urgency: 'HIGH',
                message: `💥 PANIC SELLING: Put/Call at ${value.toFixed(2)} - Major buying opportunity`,
                recommendation: 'Deploy 50% of remaining cash reserves',
                emoji: '💥'
            });
        } else if (value >= thresholds.fear) {
            alerts.push({
                type: 'FEAR_BUILDING',
                urgency: 'MEDIUM',
                message: `😰 FEAR BUILDING: Put/Call at ${value.toFixed(2)} - Prepare for opportunities`,
                recommendation: 'Ready cash for deployment, increase monitoring',
                emoji: '😰'
            });
        }
        
        return alerts;
    }

    checkRSIAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.extreme) {
            alerts.push({
                type: 'EXTREME_OVERSOLD_RSI',
                urgency: 'HIGH',
                message: `⚡ EXTREME OVERSOLD: S&P RSI at ${value.toFixed(1)} - Strong buy signal!`,
                recommendation: 'Deploy 50% of cash reserves immediately',
                emoji: '⚡'
            });
        } else if (value <= thresholds.oversold) {
            alerts.push({
                type: 'OVERSOLD_RSI',
                urgency: 'MEDIUM',
                message: `📊 OVERSOLD: S&P RSI at ${value.toFixed(1)} - Buying opportunity emerging`,
                recommendation: 'Deploy 25% of cash reserves',
                emoji: '📊'
            });
        }
        
        return alerts;
    }

    checkHighLowAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.capitulation) {
            alerts.push({
                type: 'HIGH_LOW_CAPITULATION',
                urgency: 'HIGH',
                message: `🏁 CAPITULATION: High-Low Index at ${value.toFixed(2)} - Maximum buying opportunity`,
                recommendation: 'Deploy all remaining cash immediately',
                emoji: '🏁'
            });
        } else if (value <= thresholds.weakness) {
            alerts.push({
                type: 'BROAD_WEAKNESS',
                urgency: 'MEDIUM',
                message: `📉 BROAD WEAKNESS: High-Low Index at ${value.toFixed(2)} - Prepare for opportunities`,
                recommendation: 'Ready cash for deployment, severe weakness detected',
                emoji: '📉'
            });
        }
        
        return alerts;
    }

    checkFearGreedAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.fear) {
            alerts.push({
                type: 'EXTREME_FEAR',
                urgency: 'HIGH',
                message: `😱 EXTREME FEAR: Fear & Greed at ${value} - Maximum buying opportunity!`,
                recommendation: 'Deploy maximum cash - everyone else is selling in panic',
                emoji: '😱'
            });
        } else if (value >= thresholds.greed) {
            alerts.push({
                type: 'EXTREME_GREED',
                urgency: 'MEDIUM',
                message: `🤑 EXTREME GREED: Fear & Greed at ${value} - Danger zone!`,
                recommendation: 'Maintain maximum cash position, avoid buying',
                emoji: '🤑'
            });
        }
        
        return alerts;
    }

    checkAAIIAlerts(metricName, value, thresholds) {
        const alerts = [];
        
        if (metricName === 'aaiiBulls' && value > thresholds.danger) {
            alerts.push({
                type: 'EXCESSIVE_BULLISHNESS',
                urgency: 'MEDIUM',
                message: `🐂 EXCESSIVE BULLISHNESS: AAII Bulls at ${value.toFixed(1)}% - Danger zone`,
                recommendation: 'Too much optimism - maintain defensive positioning',
                emoji: '🐂'
            });
        } else if (metricName === 'aaiiBears' && value > thresholds.major) {
            alerts.push({
                type: 'MAJOR_BUYING_OPPORTUNITY',
                urgency: 'HIGH',
                message: `🐻 MAJOR OPPORTUNITY: AAII Bears at ${value.toFixed(1)}% - Excessive pessimism!`,
                recommendation: 'Major buying opportunity - deploy significant cash',
                emoji: '🐻'
            });
        } else if (metricName === 'aaiiBears' && value > thresholds.opportunity) {
            alerts.push({
                type: 'BUYING_OPPORTUNITY',
                urgency: 'MEDIUM',
                message: `🎪 BUYING OPPORTUNITY: AAII Bears at ${value.toFixed(1)}% - Excessive pessimism`,
                recommendation: 'Good buying opportunity emerging',
                emoji: '🎪'
            });
        }
        
        return alerts;
    }

    checkInsiderAlerts(value, thresholds) {
        const alerts = [];
        
        if (value >= thresholds.strong) {
            alerts.push({
                type: 'STRONG_INSIDER_BUYING',
                urgency: 'HIGH',
                message: `👔 STRONG INSIDER CONFIDENCE: Buy/Sell ratio at ${value.toFixed(1)} - Major buying opportunity!`,
                recommendation: 'Insiders buying heavily - follow their lead',
                emoji: '👔'
            });
        } else if (value >= thresholds.bullish) {
            alerts.push({
                type: 'INSIDER_BUYING',
                urgency: 'MEDIUM',
                message: `💼 INSIDER BUYING: Buy/Sell ratio at ${value.toFixed(1)} - Bullish signal`,
                recommendation: 'Corporate insiders are buying - positive signal',
                emoji: '💼'
            });
        }
        
        return alerts;
    }

    checkYieldSpreadAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.recession) {
            alerts.push({
                type: 'DEEP_INVERSION',
                urgency: 'HIGH',
                message: `📉 DEEP YIELD CURVE INVERSION: Spread at ${value.toFixed(2)}% - Recession signal`,
                recommendation: 'Prepare for recession and buying opportunities',
                emoji: '📉'
            });
        } else if (value <= thresholds.inversion) {
            alerts.push({
                type: 'YIELD_INVERSION',
                urgency: 'MEDIUM',
                message: `⚠️ YIELD CURVE INVERSION: Spread at ${value.toFixed(2)}% - Warning signal`,
                recommendation: 'Monitor closely - recession typically follows 6-18 months',
                emoji: '⚠️'
            });
        }
        
        return alerts;
    }

    checkCreditSpreadAlerts(value, thresholds) {
        const alerts = [];
        
        if (value >= thresholds.crisis) {
            alerts.push({
                type: 'CREDIT_CRISIS',
                urgency: 'HIGH',
                message: `🏦 CREDIT CRISIS: Spreads at ${value}bp - Financial stress detected!`,
                recommendation: 'Major buying opportunity - credit crisis creates bargains',
                emoji: '🏦'
            });
        } else if (value >= thresholds.stress) {
            alerts.push({
                type: 'CREDIT_STRESS',
                urgency: 'MEDIUM',
                message: `💳 CREDIT STRESS: Spreads at ${value}bp - Stress building`,
                recommendation: 'Monitor credit markets closely',
                emoji: '💳'
            });
        }
        
        return alerts;
    }

    checkDollarAlerts(value, thresholds) {
        const alerts = [];
        
        if (value >= thresholds.strong) {
            alerts.push({
                type: 'EXTREME_DOLLAR_STRENGTH',
                urgency: 'MEDIUM',
                message: `💵 EXTREME DOLLAR STRENGTH: DXY at ${value.toFixed(1)} - Emerging market stress`,
                recommendation: 'Avoid emerging markets, focus on US assets',
                emoji: '💵'
            });
        } else if (value <= thresholds.weak) {
            alerts.push({
                type: 'DOLLAR_WEAKNESS',
                urgency: 'LOW',
                message: `🌍 DOLLAR WEAKNESS: DXY at ${value.toFixed(1)} - Emerging markets attractive`,
                recommendation: 'Consider emerging market opportunities',
                emoji: '🌍'
            });
        }
        
        return alerts;
    }

    checkNVDAPEAlerts(value, thresholds) {
        return [];
    }

    checkSemiETFAlerts(value, thresholds) {
        const alerts = [];
        
        if (value <= thresholds.opportunity) {
            alerts.push({
                type: 'AI_BUBBLE_OPPORTUNITY',
                urgency: 'HIGH',
                message: `🤖 AI CRASH OPPORTUNITY: Semi ETF down ${Math.abs(value * 100).toFixed(1)}% - Buying opportunity!`,
                recommendation: 'AI bubble deflating - buy quality tech at discount',
                emoji: '🤖'
            });
        } else if (value <= thresholds.correction) {
            alerts.push({
                type: 'AI_CORRECTION',
                urgency: 'MEDIUM',
                message: `🔧 AI CORRECTION: Semi ETF down ${Math.abs(value * 100).toFixed(1)}% - Correction beginning`,
                recommendation: 'AI sector correcting - prepare for opportunities',
                emoji: '🔧'
            });
        }
        
        return alerts;
    }

    async sendAlert(alert) {
        if (!this.shouldSendAlert(alert)) {
            return false;
        }
        
        const message = this.formatAlertMessage(alert);
        
        try {
            await this.bot.telegram.sendMessage(this.chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
            
            this.recordAlert(alert);
            logger.info(`Alert sent: ${alert.type}`);
            return true;
        } catch (error) {
            logger.error('Error sending alert:', error);
            return false;
        }
    }

    async sendUrgentAlert(alerts) {
        const urgentMessage = this.formatUrgentAlert(alerts);
        
        try {
            await this.bot.telegram.sendMessage(this.chatId, urgentMessage, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
            
            logger.info('Urgent alert sent');
        } catch (error) {
            logger.error('Error sending urgent alert:', error);
        }
    }

    formatAlertMessage(alert) {
        const timestamp = new Date().toLocaleTimeString();
        
        return `
${alert.emoji} <b>${alert.message}</b>

📊 <b>Metric:</b> ${alert.metricName.toUpperCase()}
💰 <b>Current Value:</b> ${alert.value}
📈 <b>Recommendation:</b> ${alert.recommendation}

<i>⏰ ${timestamp}</i>
        `.trim();
    }

    formatUrgentAlert(alerts) {
        const timestamp = new Date().toLocaleTimeString();
        let message = `🚨 <b>URGENT MARKET ALERT</b> 🚨\n\n`;
        
        message += `<b>Multiple high-urgency signals detected:</b>\n\n`;
        
        alerts.forEach((alert, index) => {
            message += `${index + 1}. ${alert.emoji} ${alert.message}\n`;
        });
        
        message += `\n⚠️ <b>IMMEDIATE ACTION REQUIRED</b> ⚠️\n`;
        message += `<i>⏰ ${timestamp}</i>`;
        
        return message;
    }

    shouldSendAlert(alert) {
        const alertKey = `${alert.metricName}_${alert.type}`;
        const lastSent = this.alertHistory.get(alertKey);
        
        if (!lastSent) {
            return true;
        }
        
        const timeDiff = Date.now() - lastSent;
        
        if (alert.urgency === 'HIGH') {
            return timeDiff > (this.cooldownPeriod / 2);
        } else if (alert.urgency === 'MEDIUM') {
            return timeDiff > this.cooldownPeriod;
        } else {
            return timeDiff > (this.cooldownPeriod * 2);
        }
    }

    recordAlert(alert) {
        const alertKey = `${alert.metricName}_${alert.type}`;
        this.alertHistory.set(alertKey, Date.now());
        
        if (this.alertHistory.size > 100) {
            const oldestKey = this.alertHistory.keys().next().value;
            this.alertHistory.delete(oldestKey);
        }
    }

    async generateWeeklyAlert() {
        const { MarketDataService } = await import('./marketData.js');
        const { AIAnalysisService } = await import('./aiAnalysis.js');
        
        const marketDataService = new MarketDataService();
        const aiAnalysisService = new AIAnalysisService();
        
        try {
            const metrics = await marketDataService.getAllMetrics();
            const summary = await marketDataService.generateMarketSummary();
            const analysis = await aiAnalysisService.analyzeMarketConditions(metrics);
            
            const timestamp = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            let message = `🦫 <b>WEEKLY BEAVER MARKET REPORT</b> 🦫\n\n`;
            message += `📅 <b>${timestamp}</b>\n\n`;
            message += `${summary}\n\n`;
            message += `<b>🤖 AI WEEKLY ANALYSIS:</b>\n${analysis}\n\n`;
            message += `💰 <b>Cash Position:</b> €13,100 ready for deployment\n`;
            message += `⚠️ <b>Remember:</b> Only deploy cash during RED/BLACK alerts\n\n`;
            message += `<i>Next weekly update: Monday ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</i>`;
            
            return message;
        } catch (error) {
            logger.error('Error generating weekly alert:', error);
            
            const timestamp = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `🦫 <b>WEEKLY BEAVER MARKET REPORT</b> 🦫\n\n` +
                   `📅 <b>${timestamp}</b>\n\n` +
                   `🟢 <b>Current Status:</b> GREEN - Normal market conditions\n` +
                   `💰 <b>Cash Position:</b> €13,100 ready for deployment\n` +
                   `📊 <b>Action:</b> Monitor for crash signals\n\n` +
                   `<i>⚠️ Technical issue generating detailed analysis. Monitoring continues...</i>`;
        }
    }
}