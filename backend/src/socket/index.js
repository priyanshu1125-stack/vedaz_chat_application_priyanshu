const messageService = require('../services/messageService');
const { validateMessageBody } = require('../controllers/messageController');

const onlineUsers = new Map();
const typingUsers = new Map();

function formatUser(senderId, senderName) {
  return { senderId, senderName };
}

function getOnlineUsersList() {
  return Array.from(onlineUsers.values());
}

function getTypingUsersList() {
  return Array.from(typingUsers.values());
}

function broadcastOnlineUsers(io) {
  io.emit('users:online', { users: getOnlineUsersList() });
}

function broadcastTyping(io) {
  io.emit('typing:update', { typingUsers: getTypingUsersList() });
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('user:join', ({ senderId, senderName }) => {
      if (!senderId || !senderName) {
        socket.emit('error', { message: 'senderId and senderName are required' });
        return;
      }

      socket.data.senderId = senderId;
      socket.data.senderName = senderName;
      onlineUsers.set(senderId, formatUser(senderId, senderName));
      broadcastOnlineUsers(io);
    });

    socket.on('user:rename', ({ senderId, senderName }) => {
      if (!senderId || !senderName) {
        socket.emit('error', { message: 'senderId and senderName are required' });
        return;
      }

      if (socket.data.senderId !== senderId) return;

      socket.data.senderName = senderName;
      onlineUsers.set(senderId, formatUser(senderId, senderName));
      typingUsers.set(senderId, formatUser(senderId, senderName));
      broadcastOnlineUsers(io);
      broadcastTyping(io);
    });

    socket.on('message:send', async (payload) => {
      try {
        validateMessageBody(payload);
        const { text, senderId, senderName } = payload;

        const message = await messageService.createMessage({
          text: text.trim(),
          senderId,
          senderName,
        });

        io.emit('message:new', { message });

        const onlineIds = getOnlineUsersList()
          .map((u) => u.senderId)
          .filter((id) => id !== senderId);

        for (const userId of onlineIds) {
          await messageService.markDelivered(message._id, userId);
        }

        const updated = await messageService.markDelivered(message._id, senderId);

        socket.emit('message:delivered', {
          messageId: message._id,
          deliveredTo: updated.deliveredTo,
        });
      } catch (err) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
      }
    });

    socket.on('typing:start', ({ senderId, senderName }) => {
      if (!senderId || !senderName) return;
      typingUsers.set(senderId, formatUser(senderId, senderName));
      socket.broadcast.emit('typing:update', { typingUsers: getTypingUsersList() });
    });

    socket.on('typing:stop', ({ senderId }) => {
      if (!senderId) return;
      typingUsers.delete(senderId);
      socket.broadcast.emit('typing:update', { typingUsers: getTypingUsersList() });
    });

    socket.on('message:read', async ({ messageId, senderId }) => {
      try {
        if (!messageId || !senderId) {
          socket.emit('error', { message: 'messageId and senderId are required' });
          return;
        }

        const message = await messageService.markRead(messageId, senderId);
        if (message) {
          io.emit('message:read', {
            messageId: message._id,
            readBy: message.readBy,
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message || 'Failed to mark message as read' });
      }
    });

    socket.on('disconnect', () => {
      const { senderId } = socket.data;
      if (senderId) {
        onlineUsers.delete(senderId);
        typingUsers.delete(senderId);
        broadcastOnlineUsers(io);
        broadcastTyping(io);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocket };
