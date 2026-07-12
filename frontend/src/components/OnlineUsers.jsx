export function OnlineUsers({ users, currentUserId }) {
  const others = users.filter((u) => u.senderId !== currentUserId);

  return (
    <div className="online-users">
      <span className="online-dot" />
      <span className="online-count">
        {users.length} online
      </span>
      {others.length > 0 && (
        <span className="online-names">
          — {others.map((u) => u.senderName).join(', ')}
        </span>
      )}
    </div>
  );
}
