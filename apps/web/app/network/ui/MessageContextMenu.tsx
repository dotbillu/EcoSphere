"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';

interface MessageContextMenuProps {
  x: number;
  y: number;
  isMe: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x,
  y,
  isMe,
  onClose,
  onDelete,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-black rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ top: y, left: x }}
    >
      <ul className="py-1">
        {isMe && (
          <li
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-400 cursor-pointer"

            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>Delete Message</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default MessageContextMenu;
