const messageService = require('../services/messageService');

function validateMessageBody({ text, senderId, senderName }) {
  if (!text || !text.trim()) {
    const err = new Error('Message text is required');
    err.status = 400;
    throw err;
  }
  if (!senderId || !senderName) {
    const err = new Error('senderId and senderName are required');
    err.status = 400;
    throw err;
  }
}

async function getMessages(req, res, next) {
  try {
    const { limit, before } = req.query;
    const messages = await messageService.getMessages({ limit, before });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    validateMessageBody(req.body);
    const { text, senderId, senderName } = req.body;
    const message = await messageService.createMessage({
      text: text.trim(),
      senderId,
      senderName,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', { message });
    }

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, sendMessage, validateMessageBody };
