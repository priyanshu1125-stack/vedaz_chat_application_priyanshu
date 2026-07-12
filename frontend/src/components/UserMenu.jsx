import { useState } from 'react';
import { updateGuestName, validateDisplayName } from '../utils/guestId';

export function UserMenu({ identity, onRename, onLogout }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(identity.senderName);
  const [error, setError] = useState('');

  const handleRename = (e) => {
    e.preventDefault();
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const updated = updateGuestName(name);
      onRename(updated);
      setIsRenaming(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setName(identity.senderName);
    setError('');
    setIsRenaming(false);
  };

  if (isRenaming) {
    return (
      <form className="rename-form" onSubmit={handleRename}>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          maxLength={20}
          autoFocus
        />
        <button type="submit" className="btn-small">
          Save
        </button>
        <button type="button" className="btn-small btn-ghost" onClick={handleCancel}>
          Cancel
        </button>
        {error && <span className="rename-error">{error}</span>}
      </form>
    );
  }

  return (
    <div className="user-menu">
      <span className="guest-name">{identity.senderName}</span>
      <div className="user-actions">
        <button
          type="button"
          className="btn-link"
          onClick={() => setIsRenaming(true)}
        >
          Rename
        </button>
        <button type="button" className="btn-link btn-danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
