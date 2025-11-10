"use client";

import React from 'react';
import { ChatMapRoom, SimpleUser } from '@lib/types';
import { API_BASE_URL } from '@lib/constants';

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return "";

  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${weeks}w`;
}

interface ConversationItemProps {
  item: ChatMapRoom | SimpleUser;
  type: 'room' | 'dm';
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ item, type, isSelected, onClick }) => {
  const name = item.name ;
  const imageUrl = type === 'room' ? (item as ChatMapRoom).imageUrl : (item as SimpleUser).image;
  
  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${name.charAt(0).toUpperCase()}`
  const src = imageUrl ? `${API_BASE_URL}/uploads/${imageUrl}` : placeholder;

  const lastMessage = item.lastMessage || "";
  const time = formatTimestamp(item.lastMessageTimestamp);

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full p-5 text-left transition-all
        ${isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'}
      `}
    >
      <img
        src={src}
        onError={(e) => (e.currentTarget.src = placeholder)}
        alt={name}
        className="w-12 h-12 rounded-full object-cover mr-3 flex-shrink-0"
      />
      <div className="flex-grow min-w-0">
        <h3 className="font-sans font-semibold text-base text-white truncate">
          {name}
        </h3>
        
        {/* Real Data Rendered Here */}
        <p className="text-sm text-zinc-400 truncate">
          {lastMessage}
          {lastMessage && time && " · "}
          {time}
        </p>
      </div>
    </button>
  );
};

export default ConversationItem;
