export function TypingIndicator({ typingUsers, currentUserId }) {
  const others = typingUsers.filter((u) => u.senderId !== currentUserId);

  if (others.length === 0) return null;

  let text;
  if (others.length === 1) {
    text = `${others[0].senderName} is typing...`;
  } else if (others.length === 2) {
    text = `${others[0].senderName} and ${others[1].senderName} are typing...`;
  } else {
    text = `${others.length} people are typing...`;
  }

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span />
        <span />
        <span />
      </span>
      {text}
    </div>
  );
}
