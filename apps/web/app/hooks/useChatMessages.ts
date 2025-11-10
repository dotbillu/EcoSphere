"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { MessageType, SelectedConversation } from '@lib/types';
import { API_BASE_URL } from '@lib/constants';
import { useAtom } from 'jotai';
import { userAtom } from '@/store';

const MESSAGES_PER_PAGE = 30;

// This is the function that fetches the data
const fetchMessages = async ({ pageParam = 0, queryKey }: any) => {
  const [_key, conversation] = queryKey;
  // Use the 'id' from the queryKey, not the full 'data' object
  const { type, id, currentUserId } = conversation;

  let url = "";
  if (type === "room") {
    url = `${API_BASE_URL}/chat/room/${id}/messages?skip=${pageParam}&take=${MESSAGES_PER_PAGE}`;
  } else {
    url = `${API_BASE_URL}/chat/dm/${id}?currentUserId=${currentUserId}&skip=${pageParam}&take=${MESSAGES_PER_PAGE}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  
  const messages: MessageType[] = await res.json();
  // Return the messages as-is (newest first)
  return messages;
};

export const useChatMessages = (conversation: SelectedConversation) => {
  const [currentUser] = useAtom(userAtom);

  const queryKey = conversation
    ? ['chat', { type: conversation.type, id: conversation.data.id, currentUserId: currentUser?.id }]
    : null;

  return useInfiniteQuery({
    queryKey: queryKey,
    queryFn: fetchMessages,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < MESSAGES_PER_PAGE) {
        return undefined;
      }
      return allPages.flat().length;
    },
    enabled: !!conversation && !!currentUser,
    staleTime: 1000 * 60 * 5, 
    
    // --- THIS IS THE FIX ---
    // 1. data.pages is [ [page1_newest], [page2_older], [page3_oldest] ]
    // 2. .flat() makes it [ ...page1_newest, ...page2_older, ...page3_oldest ]
    // 3. .reverse() makes it [ ...page3_oldest, ...page2_older, ...page1_newest ]
    // This gives us the correct chronological order for the chat.
    select: (data) => data.pages.flat().reverse(), 
    // --- END FIX ---
  });
};
