import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMessages, sendMessage as sendMessageApi } from '../api/messages';
import { useSocket } from '../hooks/useSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { OnlineUsers } from './OnlineUsers';
import { UserMenu } from './UserMenu';

function upsertMessage(messages, incoming) {
  const id = incoming._id;
  const index = messages.findIndex((m) => m._id === id);
  if (index >= 0) {
    const updated = [...messages];
    updated[index] = { ...updated[index], ...incoming };
    return updated;
  }
  return [...messages, incoming];
}

export function ChatWindow({ identity, onIdentityChange, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const readSentRef = useRef(new Set());

  const { connected, error: socketError, emit, on } = useSocket(identity);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setApiError(null);
        const { messages: history } = await fetchMessages();
        if (!cancelled) {
          setMessages(history);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubNew = on('message:new', ({ message }) => {
      setMessages((prev) => upsertMessage(prev, message));
    });

    const unsubDelivered = on('message:delivered', ({ messageId, deliveredTo }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deliveredTo } : m
        )
      );
    });

    const unsubRead = on('message:read', ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, readBy } : m))
      );
    });

    const unsubTyping = on('typing:update', ({ typingUsers: users }) => {
      setTypingUsers(users);
    });

    const unsubOnline = on('users:online', ({ users }) => {
      setOnlineUsers(users);
    });

    return () => {
      unsubNew();
      unsubDelivered();
      unsubRead();
      unsubTyping();
      unsubOnline();
    };
  }, [on]);

  const handleSend = useCallback(
    async (text) => {
      const payload = {
        text,
        senderId: identity.senderId,
        senderName: identity.senderName,
      };

      const sentViaSocket = emit('message:send', payload);

      if (!sentViaSocket) {
        try {
          setApiError(null);
          const { message } = await sendMessageApi(payload);
          setMessages((prev) => upsertMessage(prev, message));
        } catch (err) {
          setApiError(err.message);
        }
      }
    },
    [emit, identity]
  );

  const handleTypingStart = useCallback(() => {
    emit('typing:start', {
      senderId: identity.senderId,
      senderName: identity.senderName,
    });
  }, [emit, identity]);

  const handleTypingStop = useCallback(() => {
    emit('typing:stop', { senderId: identity.senderId });
  }, [emit, identity]);

  const handleMessageVisible = useCallback(
    (messageId) => {
      if (readSentRef.current.has(messageId)) return;
      readSentRef.current.add(messageId);
      emit('message:read', { messageId, senderId: identity.senderId });
    },
    [emit, identity.senderId]
  );

  const handleRename = useCallback(
    (updated) => {
      onIdentityChange(updated);
      emit('user:rename', {
        senderId: updated.senderId,
        senderName: updated.senderName,
      });
    },
    [emit, onIdentityChange]
  );

  const statusText = connected
    ? 'Connected'
    : 'Reconnecting...';

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="header-left">
          <h1>Chat</h1>
          <span className={`connection-status ${connected ? 'online' : 'offline'}`}>
            {statusText}
          </span>
        </div>
        <div className="header-right">
          <UserMenu
            identity={identity}
            onRename={handleRename}
            onLogout={onLogout}
          />
          <OnlineUsers users={onlineUsers} currentUserId={identity.senderId} />
        </div>
      </header>

      {(apiError || socketError) && (
        <div className="error-banner">
          {apiError || socketError}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading messages...</div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={identity.senderId}
          onlineUsers={onlineUsers}
          onMessageVisible={handleMessageVisible}
        />
      )}

      <TypingIndicator
        typingUsers={typingUsers}
        currentUserId={identity.senderId}
      />

      <MessageInput
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        disabled={loading}
      />
    </div>
  );
}
