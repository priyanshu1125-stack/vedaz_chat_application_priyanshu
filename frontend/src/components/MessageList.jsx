import { Fragment, useEffect, useRef } from 'react';
import { formatDateLabel, getDateKey } from '../utils/dateLabel';

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getReceiptStatus(message, onlineUsers, currentUserId) {
  const othersOnline = onlineUsers.filter((u) => u.senderId !== currentUserId);
  if (othersOnline.length === 0) {
    return message.deliveredTo?.length > 0 ? 'delivered' : 'sent';
  }

  const allRead = othersOnline.every((u) => message.readBy?.includes(u.senderId));
  if (allRead) return 'read';

  const allDelivered = othersOnline.every((u) =>
    message.deliveredTo?.includes(u.senderId)
  );
  if (allDelivered) return 'delivered';

  return 'sent';
}

function ReceiptIcon({ status }) {
  if (status === 'read') return <span className="receipt read">✓✓</span>;
  if (status === 'delivered') return <span className="receipt delivered">✓✓</span>;
  return <span className="receipt sent">✓</span>;
}

export function MessageList({
  messages,
  currentUserId,
  onlineUsers,
  onMessageVisible,
}) {
  const bottomRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const senderId = entry.target.dataset.senderId;
            if (messageId && senderId !== currentUserId) {
              onMessageVisible(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => observerRef.current?.disconnect();
  }, [currentUserId, onMessageVisible]);

  const observe = (el) => {
    if (el) observerRef.current?.observe(el);
  };

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">No messages yet. Say hello!</div>
      )}
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUserId;
        const receiptStatus = isOwn
          ? getReceiptStatus(msg, onlineUsers, currentUserId)
          : null;
        const showDateLabel =
          index === 0 ||
          getDateKey(msg.createdAt) !== getDateKey(messages[index - 1].createdAt);

        return (
          <Fragment key={msg._id}>
            {showDateLabel && (
              <div className="date-divider">
                <span>{formatDateLabel(msg.createdAt)}</span>
              </div>
            )}
            <div
              className={`message-row ${isOwn ? 'own' : 'other'}`}
              data-message-id={msg._id}
              data-sender-id={msg.senderId}
              ref={isOwn ? undefined : observe}
            >
              <div className="message-bubble">
                {!isOwn && (
                  <span className="sender-name">{msg.senderName}</span>
                )}
                <p className="message-text">{msg.text}</p>
                <div className="message-meta">
                  <span className="timestamp">{formatTime(msg.createdAt)}</span>
                  {isOwn && <ReceiptIcon status={receiptStatus} />}
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
