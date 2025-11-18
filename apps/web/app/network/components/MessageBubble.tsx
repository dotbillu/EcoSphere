"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, SmilePlus, Trash2 } from 'lucide-react';
import { MessageType } from '@lib/types'; // Make sure this imports your updated type
import { API_BASE_URL } from '@lib/constants';
import EmojiPicker from '../ui/EmojiPicker';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBubbleProps {
  message: MessageType; // This will now have the optional isOptimistic prop
  isMe: boolean;
  isGroup: boolean;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  spacing: 'small' | 'large';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  isGroup,
  onDelete,
  onToggleReaction,
  spacing,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const senderName = message.sender.name;
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const placeholder = `https://placehold.co/40x40/374151/white?text=${senderName.charAt(0).toUpperCase()}`;
  const src = message.sender.image
    ? `${API_BASE_URL}/uploads/${message.sender.image}`
    : placeholder;

  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasReactions = Object.entries(groupedReactions).length > 0;

  const bubbleEnterDelay = 0.45;
  const reactionEnterDelay = bubbleEnterDelay + 0.1;

  return (
    <div
      id={`message-${message.id}`}
      className={`flex group ${isMe ? 'justify-end' : 'justify-start'} ${spacing === 'large' ? 'mt-6' : 'mt-2'} ${hasReactions ? 'mb-8' : ''}`}
    >
      <div
        className={`
          flex items-center max-w-xs md:max-w-md lg:max-w-lg gap-2
          ${isMe ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {!isMe && (
          <Link href={`/profile/${message.sender.username}`} className="self-end">
            <img
              src={src}
              onError={(e) => (e.currentTarget.src = placeholder)}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover mb-1 flex-shrink-0"
            />
          </Link>
        )}

        {isMe && <div className="w-8 h-8 flex-shrink-0" />}

        <motion.div
          layout // <-- 1. APPLY LAYOUT TO ALL BUBBLES
          // 2. ONLY ANIMATE IF isMe AND isOptimistic
          {...(isMe && message.isOptimistic && {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: bubbleEnterDelay
            },
          })}
          className={`
            px-3 py-2 rounded-2xl shadow-sm relative
            ${isMe
              ? 'bg-indigo-600 text-white rounded-br-lg'
              : 'bg-[#262626] text-gray-200 rounded-bl-lg'
            }
          `}
        >
          {isGroup && !isMe && (
            <Link
              href={`/profile/${message.sender.username}`}
              className="text-xs font-bold text-indigo-400 mb-1 hover:underline"
            >
              {senderName}
            </Link>
          )}

          <p
            className="text-sm"
            style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
          >
            {message.content}
          </p>

          <div
            className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}, text-xs`}
          >
            <span>{timestamp}</span>
            {isMe && <Check size={16} />}
          </div>

          <AnimatePresence>
            {hasReactions && (
              <motion.div
                key="reactions"
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: reactionEnterDelay
                }}
                className="absolute -bottom-4 right-0 flex gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 shadow-md origin-bottom-right"
              >
                {Object.entries(groupedReactions).map(([emoji, count]) => (
                  <span key={emoji} className="text-xs">
                    {emoji} {count > 1 && count}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="relative flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <button
            onClick={() => setShowEmojiPicker(p => !p)}
            className="text-gray-400 hover:text-gray-200"
            aria-label="React to message"
          >
            <SmilePlus size={18} />
          </button>
          {isMe && (
            <button
              onClick={() => onDelete(message.id as string)}
              className="text-gray-400 hover:text-red-500"
              aria-label="Delete message"
            >
              <Trash2 size={18} />
            </button>
          )}
          {showEmojiPicker && (
            <div className={`absolute z-10 ${isMe ? 'right-full mr-55' : 'left-full ml-2'} -top-2`}>
              <EmojiPicker onSelect={(emoji) => {
                onToggleReaction(message.id as string, emoji);
                setShowEmojiPicker(false);
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
