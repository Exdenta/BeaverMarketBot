import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

export class AIAnalysisService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && !apiKey.startsWith('your_')) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });
        } else {
            logger.warn('Gemini API key not configured, AI analysis will use fallback mode');
            this.model = null;
        }
        
        this.systemPrompt = `You are a professional market analyst specializing in crash detection and market timing. 
        You have access to 17 key market indicators and must provide actionable investment advice based on the complete framework.

        Your analysis framework:
        
        ALERT LEVELS:
        🟢 GREEN: Normal conditions, maintain cash
        🟡 YELLOW: Warning signs, prepare for opportunities  
        🟠 ORANGE: Early crash phase, deploy first 25% of cash
        🔴 RED: Full crash mode, deploy remaining cash aggressively
        ⚫ BLACK: Maximum opportunity, deploy ALL remaining cash

        KEY METRICS AND INTERPRETATIONS:
        
        VIX (Volatility Index):
        - 10-15: Extreme complacency (bubble conditions)
        - 15-20: Normal conditions
        - 20-30: Elevated concern
        - 30-40: Fear mode (crash likely)
        - 40+: Panic (maximum buying opportunity)

        S&P 500 RSI:
        - <20: Extreme oversold (strong buy)
        - <30: Oversold (buying opportunity)
        - >70: Overbought (potential sell)

        Put/Call Ratio:
        - 0.5-0.7: Extreme greed (dangerous)
        - 1.0-1.5: Fear building
        - 1.5-2.0: Panic selling (buy opportunity)
        - 2.0+: Maximum pessimism (deploy all cash)

        Fear & Greed Index:
        - 0-20: Extreme Fear (buy heavily)
        - 20-40: Fear (prepare to buy)
        - 60-80: Greed (reduce positions)
        - 80-100: Extreme Greed (maintain maximum cash)

        McClellan Oscillator:
        - <-100: Oversold (start deploying)
        - <-150: Capitulation (deploy aggressively)

        CAPE Ratio:
        - >35: Extreme bubble (maintain max cash)
        - 25-35: Overvalued
        - 15-20: Fair value

        Your responses should be:
        1. Concise and actionable
        2. Include specific cash deployment recommendations
        3. Reference multiple confirming indicators
        4. Provide clear risk assessment
        5. Include timing guidance`;
    }

    async analyzeMarketConditions(metrics) {
        try {
            if (!this.model) {
                return this.generateFallbackAnalysis(metrics);
            }

            const analysisPrompt = this.buildAnalysisPrompt(metrics);
            const fullPrompt = `${this.systemPrompt}\n\n${analysisPrompt}`;
            
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const analysis = response.text();
            
            return {
                summary: analysis,
                recommendation: this.extractRecommendation(analysis),
                alertLevel: this.determineAlertLevel(analysis),
                riskScore: this.calculateRiskScore(metrics),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error in AI analysis:', error);
            return this.generateFallbackAnalysis(metrics);
        }
    }

    buildAnalysisPrompt(metrics) {
        let prompt = `CURRENT MARKET DATA ANALYSIS REQUEST:

Please analyze the following market conditions and provide specific investment guidance:

KEY INDICATORS:
`;

        // Add all available metrics with interpretations
        if (metrics.vix?.value) {
            prompt += `• VIX: ${metrics.vix.value.toFixed(1)} ${this.getVIXContext(metrics.vix.value)}\n`;
        }
        
        if (metrics.spyRsi?.value) {
            prompt += `• S&P 500 RSI: ${metrics.spyRsi.value.toFixed(1)} ${this.getRSIContext(metrics.spyRsi.value)}\n`;
        }
        
        if (metrics.putCallRatio?.value) {
            prompt += `• Put/Call Ratio: ${metrics.putCallRatio.value.toFixed(2)} ${this.getPutCallContext(metrics.putCallRatio.value)}\n`;
        }
        
        if (metrics.fearGreedIndex?.value) {
            prompt += `• Fear & Greed Index: ${metrics.fearGreedIndex.value} ${this.getFearGreedContext(metrics.fearGreedIndex.value)}\n`;
        }
        
        if (metrics.mcclellanOscillator?.value) {
            prompt += `• McClellan Oscillator: ${metrics.mcclellanOscillator.value.toFixed(0)} ${this.getMcclellanContext(metrics.mcclellanOscillator.value)}\n`;
        }
        
        if (metrics.cape?.value) {
            prompt += `• CAPE Ratio: ${metrics.cape.value.toFixed(1)} ${this.getCAPEContext(metrics.cape.value)}\n`;
        }
        
        if (metrics.highLowIndex?.value) {
            prompt += `• High-Low Index: ${metrics.highLowIndex.value.toFixed(2)} ${this.getHighLowContext(metrics.highLowIndex.value)}\n`;
        }
        
        if (metrics.yieldSpread?.value) {
            prompt += `• 10Y-2Y Spread: ${metrics.yieldSpread.value.toFixed(2)}% ${this.getYieldSpreadContext(metrics.yieldSpread.value)}\n`;
        }
        
        if (metrics.creditSpreads?.value) {
            prompt += `• Credit Spreads: ${metrics.creditSpreads.value}bp ${this.getCreditSpreadsContext(metrics.creditSpreads.value)}\n`;
        }
        
        if (metrics.dollarIndex?.value) {
            prompt += `• Dollar Index: ${metrics.dollarIndex.value.toFixed(1)} ${this.getDollarContext(metrics.dollarIndex.value)}\n`;
        }

        prompt += `
ANALYSIS REQUIREMENTS:
1. Determine the current alert level (GREEN/YELLOW/ORANGE/RED/BLACK)
2. Provide specific cash deployment recommendations
3. Identify the 3 most important signals
4. Give timing guidance for actions
5. Assess overall risk level (1-10 scale)
6. Suggest monitoring frequency

RESPONSE FORMAT:
🎯 ALERT LEVEL: [Level] 
💰 CASH DEPLOYMENT: [Specific % and timing]
🔥 KEY SIGNALS: [Top 3 most important indicators]
⏰ TIMING: [When to act]
⚠️ RISK LEVEL: [1-10 with explanation]
📊 MONITORING: [How often to check]

Focus on actionable guidance for someone with €13,100 cash position ready to deploy during market crashes.`;

        return prompt;
    }

    // Context helper methods
    getVIXContext(value) {
        if (value > 40) return "(PANIC - Maximum buying opportunity)";
        if (value > 30) return "(FEAR - Deploy cash aggressively)";
        if (value > 20) return "(ELEVATED - Prepare for opportunities)";
        if (value < 15) return "(COMPLACENT - Bubble conditions)";
        return "(NORMAL)";
    }

    getRSIContext(value) {
        if (value < 20) return "(EXTREME OVERSOLD - Strong buy signal)";
        if (value < 30) return "(OVERSOLD - Buying opportunity)";
        if (value > 70) return "(OVERBOUGHT - Potential sell signal)";
        return "(NORMAL)";
    }

    getPutCallContext(value) {
        if (value > 2.0) return "(MAXIMUM PESSIMISM - Deploy all cash)";
        if (value > 1.5) return "(PANIC SELLING - Major opportunity)";
        if (value > 1.0) return "(FEAR BUILDING)";
        if (value < 0.7) return "(EXTREME GREED - Dangerous)";
        return "(NORMAL)";
    }

    getFearGreedContext(value) {
        if (value < 20) return "(EXTREME FEAR - Maximum opportunity)";
        if (value < 40) return "(FEAR - Prepare to buy)";
        if (value > 80) return "(EXTREME GREED - Danger zone)";
        if (value > 60) return "(GREED - Reduce positions)";
        return "(NEUTRAL)";
    }

    getMcclellanContext(value) {
        if (value < -150) return "(CAPITULATION - Deploy aggressively)";
        if (value < -100) return "(OVERSOLD - Start deploying)";
        if (value > 100) return "(OVERBOUGHT - Sell signal)";
        return "(NORMAL)";
    }

    getCAPEContext(value) {
        if (value > 35) return "(EXTREME BUBBLE - Maintain max cash)";
        if (value > 25) return "(OVERVALUED)";
        if (value < 20) return "(FAIR VALUE - Deploy when available)";
        return "(NORMAL)";
    }

    getHighLowContext(value) {
        if (value < -0.8) return "(CAPITULATION - Maximum buying)";
        if (value < -0.5) return "(SEVERE WEAKNESS - Prepare for opportunities)";
        return "(NORMAL)";
    }

    getYieldSpreadContext(value) {
        if (value < -0.5) return "(DEEP INVERSION - Recession signal)";
        if (value < 0) return "(INVERTED - Warning signal)";
        return "(NORMAL)";
    }

    getCreditSpreadsContext(value) {
        if (value > 300) return "(CREDIT CRISIS - Buying opportunity)";
        if (value > 200) return "(STRESS BUILDING)";
        return "(NORMAL)";
    }

    getDollarContext(value) {
        if (value > 110) return "(EXTREME STRENGTH - Avoid emerging markets)";
        if (value < 95) return "(WEAKNESS - Emerging markets attractive)";
        return "(NORMAL)";
    }

    extractRecommendation(analysis) {
        // Extract the cash deployment recommendation from AI response
        const cashMatch = analysis.match(/💰 CASH DEPLOYMENT: ([^\n]+)/);
        return cashMatch ? cashMatch[1] : "Hold current position";
    }

    determineAlertLevel(analysis) {
        // Extract alert level from AI response
        const levelMatch = analysis.match(/🎯 ALERT LEVEL: (\w+)/);
        return levelMatch ? levelMatch[1] : "GREEN";
    }

    calculateRiskScore(metrics) {
        let score = 5; // Base neutral score
        
        // VIX factor
        if (metrics.vix?.value > 30) score += 2;
        else if (metrics.vix?.value > 20) score += 1;
        else if (metrics.vix?.value < 15) score -= 2;
        
        // RSI factor
        if (metrics.spyRsi?.value < 20) score += 3;
        else if (metrics.spyRsi?.value < 30) score += 2;
        else if (metrics.spyRsi?.value > 70) score -= 2;
        
        // Put/Call factor
        if (metrics.putCallRatio?.value > 1.8) score += 2;
        else if (metrics.putCallRatio?.value > 1.2) score += 1;
        else if (metrics.putCallRatio?.value < 0.7) score -= 2;
        
        // Fear & Greed factor
        if (metrics.fearGreedIndex?.value < 20) score += 2;
        else if (metrics.fearGreedIndex?.value > 80) score -= 3;
        
        // McClellan factor
        if (metrics.mcclellanOscillator?.value < -150) score += 3;
        else if (metrics.mcclellanOscillator?.value < -100) score += 2;
        
        return Math.max(1, Math.min(10, score));
    }

    generateFallbackAnalysis(metrics) {
        // Generate basic analysis when AI is unavailable
        const alertLevel = this.determineFallbackAlertLevel(metrics);
        
        return {
            summary: this.generateFallbackSummary(metrics, alertLevel),
            recommendation: this.getFallbackRecommendation(alertLevel),
            alertLevel: alertLevel,
            riskScore: this.calculateRiskScore(metrics),
            timestamp: new Date().toISOString()
        };
    }

    determineFallbackAlertLevel(metrics) {
        let alertScore = 0;
        
        if (metrics.vix?.value > 40) alertScore += 4;
        else if (metrics.vix?.value > 30) alertScore += 3;
        else if (metrics.vix?.value > 20) alertScore += 1;
        
        if (metrics.spyRsi?.value < 20) alertScore += 3;
        else if (metrics.spyRsi?.value < 30) alertScore += 2;
        
        if (metrics.putCallRatio?.value > 2.0) alertScore += 3;
        else if (metrics.putCallRatio?.value > 1.5) alertScore += 2;
        
        if (metrics.fearGreedIndex?.value < 20) alertScore += 2;
        
        if (alertScore >= 8) return 'BLACK';
        if (alertScore >= 6) return 'RED';
        if (alertScore >= 4) return 'ORANGE';
        if (alertScore >= 2) return 'YELLOW';
        return 'GREEN';
    }

    generateFallbackSummary(metrics, alertLevel) {
        const emoji = this.getAlertEmoji(alertLevel);
        
        return `${emoji} MARKET ANALYSIS (Automated)

🎯 ALERT LEVEL: ${alertLevel}
Current market conditions suggest ${alertLevel} alert status based on key indicators.

🔥 KEY SIGNALS:
• VIX: ${metrics.vix?.value?.toFixed(1) || 'N/A'} ${this.getVIXContext(metrics.vix?.value)}
• RSI: ${metrics.spyRsi?.value?.toFixed(1) || 'N/A'} ${this.getRSIContext(metrics.spyRsi?.value)}
• Put/Call: ${metrics.putCallRatio?.value?.toFixed(2) || 'N/A'} ${this.getPutCallContext(metrics.putCallRatio?.value)}

⚠️ RISK LEVEL: ${this.calculateRiskScore(metrics)}/10

Note: This is an automated analysis. AI-powered detailed analysis temporarily unavailable.`;
    }

    getFallbackRecommendation(alertLevel) {
        const recommendations = {
            'BLACK': 'Deploy ALL remaining cash immediately - maximum opportunity',
            'RED': 'Deploy remaining cash aggressively over 4 weeks',
            'ORANGE': 'Deploy first 25% of cash (€3,275) into quality ETFs',
            'YELLOW': 'Prepare for opportunities, increase monitoring frequency',
            'GREEN': 'Maintain current cash position, monitor regularly'
        };
        
        return recommendations[alertLevel] || 'Hold current position';
    }

    getAlertEmoji(level) {
        const emojis = {
            'GREEN': '🟢',
            'YELLOW': '🟡',
            'ORANGE': '🟠',
            'RED': '🔴',
            'BLACK': '⚫'
        };
        return emojis[level] || '⚪';
    }

    async generateMetricInsight(metricName, historicalData) {
        try {
            if (!this.model) {
                return `Analysis for ${metricName} temporarily unavailable. Please check the charts and thresholds manually.`;
            }

            const prompt = `Analyze this market metric and provide insight:

Metric: ${metricName}
Recent values: ${historicalData.slice(-10).map(d => `${d.value} (${new Date(d.timestamp).toLocaleDateString()})`).join(', ')}

Provide a brief analysis focusing on:
1. Current trend direction
2. Historical context
3. What this means for crash risk
4. Actionable insight for investors

Keep response under 200 words and focus on practical implications.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            logger.error('Error generating metric insight:', error);
            return `Analysis for ${metricName} temporarily unavailable. Please check the charts and thresholds manually.`;
        }
    }

    async generateCorrelationAnalysis(correlationData) {
        try {
            if (!this.model) {
                return "Correlation analysis temporarily unavailable.";
            }

            const prompt = `Analyze these metric correlations and identify key relationships:

${JSON.stringify(correlationData, null, 2)}

Focus on:
1. Which metrics move together during crashes
2. Leading vs lagging indicators
3. Divergences that signal opportunities
4. Most reliable metric combinations

Provide practical guidance for using these correlations in crash detection.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            logger.error('Error generating correlation analysis:', error);
            return "Correlation analysis temporarily unavailable.";
        }
    }
}