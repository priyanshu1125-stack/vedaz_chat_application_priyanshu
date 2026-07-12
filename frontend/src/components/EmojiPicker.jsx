import { useEffect, useRef } from 'react';

const EMOJIS = [
  '😀', '😂', '😊', '😍', '🥰', '😉', '😎', '🤔',
  '😢', '😮', '👍', '👎', '👋', '🙏', '❤️', '🔥',
  '✨', '🎉', '💯', '✅', '❌', '👀', '💬', '🚀',
  '😴', '🤝', '💪', '🙌', '😅', '🤣', '🥳', '💡',
];

export function EmojiPicker({ open, onSelect, onClose }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="emoji-picker" ref={pickerRef}>
      <div className="emoji-picker-grid">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-btn"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
