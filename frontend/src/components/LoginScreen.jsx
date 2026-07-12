import { useState } from 'react';
import { setGuestIdentity, validateDisplayName } from '../utils/guestId';

export function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const identity = setGuestIdentity(name);
      onLogin(identity);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Join Chat</h1>
        <p className="login-subtitle">Enter a friendly name to start chatting</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="display-name">Your name</label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Priyanhu"
            maxLength={20}
            autoComplete="off"
            autoFocus
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={!name.trim()}>
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}
