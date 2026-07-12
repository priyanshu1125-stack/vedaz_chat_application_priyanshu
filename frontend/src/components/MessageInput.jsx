import { useState, useRef, useCallback } from 'react';
import { EmojiPicker } from './EmojiPicker';

const TYPING_IDLE_MS = 1500;

export function MessageInput({ onSend, onTypingStart, onTypingStop, disabled }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [onTypingStop]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart();
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    } else {
      stopTyping();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    stopTyping();
    setEmojiOpen(false);
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertEmoji = (emoji) => {
    const input = inputRef.current;
    if (!input) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    setEmojiOpen(false);

    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + emoji.length;
      input.setSelectionRange(cursor, cursor);
    });

    if (next.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <button
          type="button"
          className="emoji-toggle"
          onClick={() => setEmojiOpen((open) => !open)}
          disabled={disabled}
          aria-label="Open emoji picker"
        >
          😊
        </button>
        <EmojiPicker
          open={emojiOpen}
          onSelect={insertEmoji}
          onClose={() => setEmojiOpen(false)}
        />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder="Type a message..."
          disabled={disabled}
          maxLength={2000}
          autoComplete="off"
        />
      </div>
      <button type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
