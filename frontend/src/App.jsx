import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { LoginScreen } from './components/LoginScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { clearGuestIdentity, getGuestIdentity } from './utils/guestId';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const [identity, setIdentity] = useState(() => getGuestIdentity());
  const { theme, toggleTheme } = useTheme();

  const handleLogin = (newIdentity) => {
    setIdentity(newIdentity);
  };

  const handleLogout = () => {
    clearGuestIdentity();
    setIdentity(null);
  };

  return (
    <div className="app">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {identity ? (
        <ChatWindow
          identity={identity}
          onIdentityChange={setIdentity}
          onLogout={handleLogout}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
