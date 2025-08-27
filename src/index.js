import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { logger } from './utils/logger.js';
import { DatabaseService } from './services/database.js';
import { MarketDataService } from './services/marketData.js';
import { AlertService } from './services/alerts.js';
import { ChartService } from './services/charts.js';
import { setupCommands } from './handlers/commands.js';
import { setupCallbacks } from './handlers/callbacks.js';

dotenv.config();

class MarketBot {
    constructor() {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        this.dbService = new DatabaseService();
        this.marketDataService = new MarketDataService();
        this.alertService = new AlertService(this.bot);
        this.chartService = new ChartService();
        
        this.setupBot();
        this.setupCronJobs();
    }

    async setupBot() {
        try {
            await this.dbService.initialize();
            
            setupCommands(this.bot, {
                dbService: this.dbService,
                marketDataService: this.marketDataService,
                chartService: this.chartService,
                alertService: this.alertService
            });
            
            setupCallbacks(this.bot, {
                dbService: this.dbService,
                marketDataService: this.marketDataService,
                chartService: this.chartService
            });

            this.bot.catch((err, ctx) => {
                logger.error(`Bot error for ${ctx.updateType}:`, err);
            });

            logger.info('Bot setup completed successfully');
        } catch (error) {
            logger.error('Error setting up bot:', error);
            throw error;
        }
    }

    setupCronJobs() {
        const checkInterval = process.env.CHECK_INTERVAL_MINUTES || 30;
        
        cron.schedule(`*/${checkInterval} * * * *`, async () => {
            try {
                logger.info('Running scheduled market check...');
                await this.performMarketCheck();
            } catch (error) {
                logger.error('Error in scheduled market check:', error);
            }
        });

        cron.schedule('0 9 * * 1-5', async () => {
            try {
                logger.info('Running market open summary...');
                await this.sendMarketSummary('market_open');
            } catch (error) {
                logger.error('Error sending market open summary:', error);
            }
        });

        cron.schedule('0 17 * * 1-5', async () => {
            try {
                logger.info('Running market close summary...');
                await this.sendMarketSummary('market_close');
            } catch (error) {
                logger.error('Error sending market close summary:', error);
            }
        });

        // Weekly Monday alert - runs every Monday at 9:00 AM
        cron.schedule('0 9 * * 1', async () => {
            try {
                logger.info('Running weekly Monday alert...');
                await this.sendWeeklyAlert();
            } catch (error) {
                logger.error('Error sending weekly Monday alert:', error);
            }
        });
    }

    async performMarketCheck() {
        const metrics = await this.marketDataService.getAllMetrics();
        const alerts = await this.alertService.checkAlerts(metrics);
        
        for (const alert of alerts) {
            await this.alertService.sendAlert(alert);
        }
    }

    async sendMarketSummary(type) {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!chatId) return;

        try {
            const summary = await this.marketDataService.generateMarketSummary(type);
            await this.bot.telegram.sendMessage(chatId, summary, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error(`Error sending ${type} summary:`, error);
        }
    }

    async sendWeeklyAlert() {
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!chatId) return;

        try {
            const weeklyAlert = await this.alertService.generateWeeklyAlert();
            await this.bot.telegram.sendMessage(chatId, weeklyAlert, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        } catch (error) {
            logger.error('Error sending weekly alert:', error);
        }
    }

    async start() {
        try {
            await this.bot.launch();
            logger.info('Bot started successfully');
            
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
        } catch (error) {
            logger.error('Error starting bot:', error);
            throw error;
        }
    }
}

const marketBot = new MarketBot();
marketBot.start().catch(error => {
    logger.error('Failed to start market bot:', error);
    process.exit(1);
});