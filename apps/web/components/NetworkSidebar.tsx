"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Search, Pencil, X } from "lucide-react";
import {
  userAtom,
  userRoomsAtom,
  dmConversationsAtom,
  networkLoadingAtom,
  networkErrorAtom,
  isNewChatModalOpenAtom,
} from "@/store";
import ConversationList from "./ConversationList";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@lib/constants";
import { MessageType } from "@lib/types";
import SidebarSkeleton from "../ui/SidebarSkeleton";

const MESSAGES_PER_PAGE = 30;

const fetchInitialMessages = async ({ queryKey }: any): Promise<MessageType[]> => {
  const [_key, conversation] = queryKey;
  const { type, id, currentUserId } = conversation;
  let url = type === "room" ? `${API_BASE_URL}/chat/room/${id}/messages?skip=0&take=${MESSAGES_PER_PAGE}` : `${API_BASE_URL}/chat/dm/${id}?currentUserId=${currentUserId}&skip=0&take=${MESSAGES_PER_PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
};

export default function NetworkSidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [user] = useAtom(userAtom);
  const [userRooms] = useAtom(userRoomsAtom);
  const [dmConversations] = useAtom(dmConversationsAtom);
  const [loading] = useAtom(networkLoadingAtom);
  const [error] = useAtom(networkErrorAtom);
  const setIsModalOpen = useSetAtom(isNewChatModalOpenAtom);
  const queryClient = useQueryClient();

  const combinedAndSortedConversations = useMemo(() => {
    const roomsWithType = userRooms.map((room) => ({ ...room, type: "room" as const }));
    const dmsWithType = dmConversations.map((dm) => ({ ...dm, type: "dm" as const }));
    return [...roomsWithType, ...dmsWithType].sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
    });
  }, [userRooms, dmConversations]);

  useEffect(() => {
    if (user && (userRooms.length > 0 || dmConversations.length > 0)) {
      const conversations = [
        ...userRooms.map((room) => ({ type: "room", data: room })),
        ...dmConversations.map((dm) => ({ type: "dm", data: dm })),
      ];
      conversations.forEach((conv) => {
        const queryKey = ["chat", { type: conv.type, id: conv.data.id, currentUserId: user.id }];
        queryClient.prefetchInfiniteQuery({
          queryKey: queryKey,
          queryFn: fetchInitialMessages,
          initialPageParam: 0,
          getNextPageParam: () => undefined,
          staleTime: 1000 * 60 * 5,
        });
      });
    }
  }, [userRooms, dmConversations, user, queryClient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isExpanded = isFocused || searchTerm.length > 0;

  return (
    <div className="flex flex-col w-full h-full bg-black border-r border-zinc-800 mt-2">
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0">
        <div className="flex-grow" ref={searchBarRef}>
          <div className={`relative flex items-center rounded-full transition-all duration-200 ${isExpanded ? "bg-zinc-800" : "bg-zinc-900"}`}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-8 py-2 rounded-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
            {isExpanded && (
              <button onClick={() => { setSearchTerm(""); setIsFocused(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-700">
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
          <Pencil size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 mt-4">
        {loading.profile && <SidebarSkeleton />}
        {!loading.profile && !error && <ConversationList items={combinedAndSortedConversations} searchTerm={searchTerm} />}
      </div>
    </div>
  );
}
