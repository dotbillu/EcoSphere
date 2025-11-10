"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { Users, User, Search, Loader2, MessageSquare, Pencil, X } from 'lucide-react';
import { 
  userAtom, 
  userRoomsAtom, 
  dmConversationsAtom, 
  networkLoadingAtom, 
  networkErrorAtom, 
  isNewChatModalOpenAtom 
} from '@/store';
import ConversationList from './ConversationList';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@lib/constants';
import { MessageType } from '@lib/types';
import SidebarSkeleton from '../ui/SidebarSkeleton'; // Import the skeleton

const MESSAGES_PER_PAGE = 30;

const fetchMessages = async ({ queryKey }: any) => {
  const [_key, conversation] = queryKey;
  const { type, id, currentUserId } = conversation;

  let url = "";
  if (type === "room") {
    url = `${API_BASE_URL}/chat/room/${id}/messages?skip=0&take=${MESSAGES_PER_PAGE}`;
  } else {
    url = `${API_BASE_URL}/chat/dm/${id}?currentUserId=${currentUserId}&skip=0&take=${MESSAGES_PER_PAGE}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  
  const messages: MessageType[] = await res.json();
  return messages;
};


export default function NetworkSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null); 
  
  const [user] = useAtom(userAtom);
  const [userRooms] = useAtom(userRoomsAtom);
  const [dmConversations] = useAtom(dmConversationsAtom);
  const [loading] = useAtom(networkLoadingAtom);
  const [error] = useAtom(networkErrorAtom);
  const setIsModalOpen = useSetAtom(isNewChatModalOpenAtom);

  const queryClient = useQueryClient();

  // Prefetching logic
  useEffect(() => {
    if (user && (userRooms.length > 0 || dmConversations.length > 0)) {
      
      const conversations = [
        ...userRooms.map(room => ({ type: 'room', data: room })),
        ...dmConversations.map(dm => ({ type: 'dm', data: dm }))
      ];

      conversations.forEach(conv => {
        const queryKey = ['chat', { type: conv.type, id: conv.data.id, currentUserId: user.id }];
        
        queryClient.prefetchInfiniteQuery({
          queryKey: queryKey,
          queryFn: fetchMessages,
          staleTime: 1000 * 60 * 5,
        });
      });
    }
  }, [userRooms, dmConversations, user, queryClient]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isExpanded = isFocused || searchTerm.length > 0;

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsFocused(false);
  };

  return (
    <div className="flex flex-col w-full md:w-2/5 lg:w-1/3 flex-shrink-0 border-r border-r-zinc-800 bg-black h-full">
      
      <div className="flex items-center gap-2 px-4 py-3 mt-2">
        <div className="flex-grow" ref={searchBarRef}>
          <div className={`relative flex items-center rounded-lg 
                          transition-all duration-300 ease-out 
                          ${isExpanded ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search ..."
              className={`w-full pl-10 pr-10 rounded-lg bg-transparent text-white placeholder:text-zinc-500 
                          transition-all duration-300 ease-out 
                          ${isExpanded ? 'py-2.5' : 'py-1.5'}
                          focus:ring-0 focus:outline-none`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)} 
            />
            {isExpanded && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-700"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 text-white hover:text-zinc-300 flex-shrink-0"
          aria-label="New Message"
        >
          <Pencil size={22} />
        </button>
      </div>
      
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <h3 className="font-semibold text-white">Messages</h3>
        <button className="text-sm text-indigo-500 hover:text-indigo-400">
          Requests
        </button>
      </div>

      <div className="flex-grow overflow-y-auto relative">
        {/* --- MODIFICATION HERE --- */}
        {loading.profile && (
          <SidebarSkeleton />
        )}
        {/* --- END MODIFICATION --- */}

        {!loading.profile && error && (
          <div className="p-4 text-center text-red-500">{error}</div>
        )}

        {!loading.profile && !error && (
          <>
            <ConversationList
              items={userRooms}
              type="room"
              searchTerm={searchTerm}
            />
            <ConversationList
              items={dmConversations}
              type="dm"
              searchTerm={searchTerm}
            />
          </>
        )}
      </div>
    </div>
  );
}
