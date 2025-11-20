"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

interface ConversationItemProps {
  item: (ChatMapRoom | SimpleUser) & { type: "room" | "dm" } | null;
  type: 'room' | 'dm';
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({ item, type, isSelected, onClick }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item]);

  if (!item) return null;

  const name = item.name;
  const imageUrl = type === 'room' ? (item as ChatMapRoom).imageUrl : (item as SimpleUser).image;
  const placeholder = `https://placehold.co/40x40/zinc/white?text=${name.charAt(0).toUpperCase()}`;
  
  const src = !imgError && imageUrl 
    ? `${API_BASE_URL}/uploads/${imageUrl}` 
    : placeholder;

  const lastMessage = item.lastMessage || "";
  const time = formatTimestamp(item.lastMessageTimestamp);
  const unseenCount = item.unseenCount || 0;
  const isOnline = type === 'dm' ? (item as SimpleUser).isOnline : false;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full p-3 rounded-lg text-left transition-all mb-1 border-l-4
        ${isSelected 
          ? 'bg-zinc-800 md:border-zinc-300 border-transparent' 
          : 'hover:bg-zinc-900 border-transparent'
        }
      `}
    >
      <div className="relative flex-shrink-0 mr-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
          <Image 
            src={src} 
            alt={name}
            width={48}
            height={48}
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized={true} 
          />
        </div>
        {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full"></span>}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-baseline">
           <h3 className="font-sans font-medium text-base text-zinc-100 truncate pr-2">{name}</h3>
           <span className="text-xs text-zinc-500 flex-shrink-0">{time}</span>
        </div>
        <div className="flex justify-between items-center">
           <p className={`text-sm truncate max-w-[85%] ${unseenCount > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
             {lastMessage || <span className="italic text-zinc-600">No messages</span>}
           </p>
           {unseenCount > 0 && (
             <div className="flex-shrink-0 flex items-center justify-center bg-zinc-100 text-zinc-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
               {unseenCount > 99 ? '99+' : unseenCount}
             </div>
           )}
        </div>
      </div>
    </button>
  );
});

ConversationItem.displayName = 'ConversationItem';
export default ConversationItem;
