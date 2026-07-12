const Message = require('../models/Message');

async function createMessage({ text, senderId, senderName }) {
  const message = await Message.create({ text, senderId, senderName });
  return message;
}

async function getMessages({ limit = 50, before } = {}) {
  const query = {};
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  return messages.reverse();
}

async function markDelivered(messageId, senderId) {
  const message = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { deliveredTo: senderId } },
    { new: true }
  );
  return message;
}

async function markRead(messageId, senderId) {
  const message = await Message.findByIdAndUpdate(
    messageId,
    { $addToSet: { readBy: senderId } },
    { new: true }
  );
  return message;
}

module.exports = {
  createMessage,
  getMessages,
  markDelivered,
  markRead,
};
