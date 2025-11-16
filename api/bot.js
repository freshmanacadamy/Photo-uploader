const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN);

// Store user photos
const userPhotos = new Map();

// Handle start command
const handleStart = async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId,
    `📸 *Simple Photo Bot*\n\n` +
    `Just send me a photo and I'll give you the file link!`,
    { parse_mode: 'Markdown' }
  );
};

// Handle photos
const handlePhoto = async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const photo = msg.photo[msg.photo.length - 1];
  
  try {
    // Get file info
    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    
    // Store photo info
    if (!userPhotos.has(userId)) {
      userPhotos.set(userId, []);
    }
    
    userPhotos.get(userId).push({
      url: fileUrl,
      time: new Date()
    });
    
    // Send file URL to user
    await bot.sendMessage(chatId,
      `✅ *Photo Received!*\n\n` +
      `🔗 *File URL:*\n${fileUrl}\n\n` +
      `📊 *Size:* ${(file.file_size / 1024).toFixed(1)} KB`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
};

// Handle messages
const handleMessage = async (msg) => {
  const text = msg.text;
  
  if (text === '/start') {
    await handleStart(msg);
  }
};

// Vercel handler
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.json({ status: 'Bot is running!' });
  }
  
  if (req.method === 'POST') {
    try {
      const update = req.body;
      
      if (update.message) {
        if (update.message.photo) {
          await handlePhoto(update.message);
        } else if (update.message.text) {
          await handleMessage(update.message);
        }
      }
      
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
