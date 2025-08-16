// telegram.js
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

if (!token || !chatId) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env file!");
}

const bot = new TelegramBot(token, { polling: false });

async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(chatId, message);
    console.log("✅ Telegram message sent:", message);
  } catch (error) {
    console.error("❌ Error sending Telegram message:", error.message);
  }
}

module.exports = { sendTelegramMessage };

// Run a test if executed directly
if (require.main === module) {
  sendTelegramMessage("🚀 Test message from cooldown project!");
}
