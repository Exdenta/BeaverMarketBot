import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

async function testTelegram() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || token.startsWith('your_')) {
        console.log('❌ Please set TELEGRAM_BOT_TOKEN in .env file');
        return;
    }
    
    if (!chatId || chatId.startsWith('your_')) {
        console.log('❌ Please set TELEGRAM_CHAT_ID in .env file');
        console.log('\n📱 How to get your CHAT_ID:');
        console.log('1. Send a message to your bot');
        console.log('2. Visit this URL in your browser:');
        console.log(`   https://api.telegram.org/bot${token}/getUpdates`);
        console.log('3. Find "chat":{"id":123456789} in the response');
        console.log('4. Add TELEGRAM_CHAT_ID=123456789 to your .env file');
        return;
    }
    
    try {
        const bot = new Telegraf(token);
        
        console.log('📤 Sending test message to chat ID:', chatId);
        await bot.telegram.sendMessage(chatId, 
            '✅ Test successful!\n\nYour BeWare Market Bot is configured correctly.\n\nChat ID: ' + chatId
        );
        
        console.log('✅ Message sent successfully!');
        console.log('   Check your Telegram for the test message.');
        
        process.exit(0);
    } catch (error) {
        console.log('❌ Error sending message:', error.message);
        
        if (error.message.includes('chat not found')) {
            console.log('\n📱 Make sure you have:');
            console.log('1. Started a chat with your bot');
            console.log('2. Sent at least one message to the bot');
            console.log('3. Used the correct chat ID');
        }
    }
}

testTelegram();