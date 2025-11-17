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
  item: (ChatMapRoom | SimpleUser) & { type: "room" | "dm" } | null;
  type: 'room' | 'dm';
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ item, type, isSelected, onClick }) => {
  if (!item) return null;

  const name = item.name;
  const imageUrl = type === 'room' ? (item as ChatMapRoom).imageUrl : (item as SimpleUser).image;
  
  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${name.charAt(0).toUpperCase()}`
  const src = imageUrl ? `${API_BASE_URL}/uploads/${imageUrl}` : placeholder;

  const lastMessage = item.lastMessage || "";
  const time = formatTimestamp(item.lastMessageTimestamp);
  const unseenCount = item.unseenCount || 0;
  
  // Get online status only for DMs
  const isOnline = type === 'dm' ? (item as SimpleUser).isOnline : false;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full p-5 text-left transition-all
        ${isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-900'}
      `}
    >
      <div className="relative flex-shrink-0">
        <img
          src={src}
          onError={(e) => (e.currentTarget.src = placeholder)}
          alt={name}
          className="w-12 h-12 rounded-full object-cover mr-3"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-3 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full"></span>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="font-sans font-semibold text-base text-white truncate">
          {name}
        </h3>
        
        <p className={`text-sm truncate ${unseenCount > 0 ? 'text-white font-semibold' : 'text-zinc-400'}`}>
          {lastMessage}
          {lastMessage && time && " · "}
          {time}
        </p>
      </div>
      
      {unseenCount > 0 && (
        <div className="ml-2 flex-shrink-0 flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 py-0.5">
          {unseenCount > 99 ? '99+' : unseenCount}
        </div>
      )}
    </button>
  );
};

export default ConversationItem;
