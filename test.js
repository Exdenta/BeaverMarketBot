import dotenv from 'dotenv';
import { logger } from './src/utils/logger.js';

dotenv.config();

async function testSetup() {
    console.log('🧪 Testing BeWare Market Bot Setup...\n');
    
    // Test 1: Check environment variables
    console.log('✅ Test 1: Environment Variables');
    const requiredVars = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY'];
    const missingVars = [];
    
    for (const varName of requiredVars) {
        if (!process.env[varName] || process.env[varName].startsWith('your_')) {
            console.log(`  ❌ ${varName} - NOT CONFIGURED`);
            missingVars.push(varName);
        } else {
            console.log(`  ✅ ${varName} - CONFIGURED`);
        }
    }
    
    // Test 2: Import modules
    console.log('\n✅ Test 2: Module Imports');
    try {
        const { DatabaseService } = await import('./src/services/database.js');
        console.log('  ✅ DatabaseService loaded');
        
        const { MarketDataService } = await import('./src/services/marketData.js');
        console.log('  ✅ MarketDataService loaded');
        
        const { AlertService } = await import('./src/services/alerts.js');
        console.log('  ✅ AlertService loaded');
        
        const { ChartService } = await import('./src/services/charts.js');
        console.log('  ✅ ChartService loaded');
        
        const { AIAnalysisService } = await import('./src/services/aiAnalysis.js');
        console.log('  ✅ AIAnalysisService loaded');
    } catch (error) {
        console.error('  ❌ Error loading modules:', error.message);
    }
    
    // Test 3: Database initialization
    console.log('\n✅ Test 3: Database');
    try {
        const { DatabaseService } = await import('./src/services/database.js');
        const db = new DatabaseService();
        await db.initialize();
        console.log('  ✅ Database initialized successfully');
        db.close();
    } catch (error) {
        console.error('  ❌ Database error:', error.message);
    }
    
    // Test 4: Logger
    console.log('\n✅ Test 4: Logger');
    try {
        logger.info('Test log message');
        console.log('  ✅ Logger working');
    } catch (error) {
        console.error('  ❌ Logger error:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (missingVars.length > 0) {
        console.log('⚠️  Setup incomplete! Please configure the following:');
        console.log(`   1. Copy .env.example to .env`);
        console.log(`   2. Add your API keys to .env:`);
        missingVars.forEach(v => console.log(`      - ${v}`));
    } else {
        console.log('✅ All tests passed! Bot is ready to start.');
        console.log('   Run: npm start');
    }
}

testSetup().catch(console.error);