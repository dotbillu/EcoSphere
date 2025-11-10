"use client";

import React from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="absolute -top-10 z-20 bg-white dark:bg-gray-700 shadow-lg rounded-full border border-gray-200 dark:border-gray-600 p-1 flex gap-1">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-xl p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;

