const STORAGE_KEY = 'chat_guest';
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;

function generateId() {
  return crypto.randomUUID();
}

export function validateDisplayName(name) {
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    return `Name must be at least ${MIN_NAME_LENGTH} characters`;
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  if (!/^[\w\s.-]+$/i.test(trimmed)) {
    return 'Name can only contain letters, numbers, spaces, dots, and hyphens';
  }
  return null;
}

export function getGuestIdentity() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const identity = JSON.parse(stored);
    if (!identity?.senderId || !identity?.senderName) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return identity;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setGuestIdentity(senderName) {
  const error = validateDisplayName(senderName);
  if (error) throw new Error(error);

  const identity = {
    senderId: generateId(),
    senderName: senderName.trim(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}

export function updateGuestName(senderName) {
  const identity = getGuestIdentity();
  if (!identity) return null;

  const error = validateDisplayName(senderName);
  if (error) throw new Error(error);

  const updated = {
    ...identity,
    senderName: senderName.trim(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearGuestIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}
