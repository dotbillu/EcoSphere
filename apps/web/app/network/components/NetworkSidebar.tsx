"use client";
import { QueryFunctionContext } from "@tanstack/react-query";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Pencil, X } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ConversationItemProps,
  ConversationListProps,
  ChatMapRoom,
  SimpleUser,
} from "@types";
import { API_BASE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  userAtom,
  userRoomsAtom,
  dmConversationsAtom,
  networkLoadingAtom,
  networkErrorAtom,
  isNewChatModalOpenAtom,
  selectedConversationAtom,
  followingListAtom,
  sidebarTransitionLoadingAtom,
} from "@/store";
import SidebarSkeleton from "../ui/SidebarSkeleton";
import FollowUserItem from "../ui/FollowUserItem";

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
type ConversationParams = {
  type: "room" | "dm";
  id: string;
  currentUserId: string;
};
type MessagesQueryKey = readonly [string, ConversationParams];
const MESSAGES_PER_PAGE = 30;
const fetchInitialMessages = async ({
  queryKey,
}: QueryFunctionContext<MessagesQueryKey>) => {
  const [, conversation] = queryKey;
  const { type, id, currentUserId } = conversation;

  const url =
    type === "room"
      ? `${API_BASE_URL}/chat/room/${id}/messages?skip=0&take=${MESSAGES_PER_PAGE}`
      : `${API_BASE_URL}/chat/dm/${id}?currentUserId=${currentUserId}&skip=0&take=${MESSAGES_PER_PAGE}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
};
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "anticipate",
    },
  },
};
const ConversationItem = React.memo(
  ({ item, type, isSelected, onClick }: ConversationItemProps) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
      setImgError(false);
    }, [item]);

    if (!item) return null;

    const name = item.name;
    const rawImageUrl =
      type === "room"
        ? (item as ChatMapRoom).imageUrl
        : (item as SimpleUser).image;

    const placeholder = `https://placehold.co/40x40/zinc/white?text=${name.charAt(0).toUpperCase()}`;

    const src =
      !imgError && rawImageUrl
        ? rawImageUrl.startsWith("http")
          ? rawImageUrl
          : `${API_BASE_URL}/uploads/${rawImageUrl}`
        : placeholder;

    const lastMessage = item.lastMessage || "";
    const time = formatTimestamp(item.lastMessageTimestamp);
    const unseenCount = item.unseenCount || 0;
    const isOnline = type === "dm" ? (item as SimpleUser).isOnline : false;

    return (
      <motion.button
        variants={itemVariants}
        onClick={onClick}
        className={`
        flex items-center w-full p-3 rounded-lg text-left transition-colors mb-1 border-l-4
        ${
          isSelected
            ? "md:bg-zinc-800 md:border-zinc-300 border-transparent"
            : "hover:bg-zinc-900 border-transparent"
        }
      `}
      >
        <div className="relative shrink-0 mr-3">
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
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
          )}
        </div>

        <div className="grow min-w-0">
          <div className="flex justify-between items-baseline">
            <h3 className="font-sans font-medium text-base text-zinc-100 truncate pr-2">
              {name}
            </h3>
            <span className="text-xs text-zinc-500 shrink-0">{time}</span>
          </div>
          <div className="flex justify-between items-center">
            <p
              className={`text-sm truncate max-w-[85%] ${unseenCount > 0 ? "text-zinc-200 font-medium" : "text-zinc-500"}`}
            >
              {lastMessage || (
                <span className="italic text-zinc-600">No messages</span>
              )}
            </p>
            {unseenCount > 0 && (
              <div className="shrink-0 flex items-center justify-center bg-zinc-100 text-zinc-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1">
                {unseenCount > 99 ? "99+" : unseenCount}
              </div>
            )}
          </div>
        </div>
      </motion.button>
    );
  },
);
ConversationItem.displayName = "ConversationItem";

const ConversationList: React.FC<ConversationListProps> = ({
  items,
  searchTerm,
}) => {
  const [selectedConversation] = useAtom(selectedConversationAtom);
  const setUserRooms = useSetAtom(userRoomsAtom);
  const setDmConversations = useSetAtom(dmConversationsAtom);
  const router = useRouter();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (
    item: (ChatMapRoom | SimpleUser) & { type: "room" | "dm" },
  ) => {
    if (item.unseenCount && item.unseenCount > 0) {
      const setter = item.type === "room" ? setUserRooms : setDmConversations;
      setter((prev: any) =>
        prev.map((i: any) => (i.id === item.id ? { ...i, unseenCount: 0 } : i)),
      );
    }
    if (selectedConversation?.data.id !== item.id) {
      router.push(`/network/${item.id}`);
    }
  };

  if (filteredItems.length === 0 && searchTerm) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        No results found.
      </div>
    );
  }

  return (
    <motion.nav
      className="px-2 pb-2"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {filteredItems.map((item) => (
        <ConversationItem
          key={item.id}
          item={item}
          type={item.type}
          isSelected={item.id === selectedConversation?.data.id}
          onClick={() => handleSelect(item)}
        />
      ))}
    </motion.nav>
  );
};

const NewChatModal: React.FC = () => {
  const [followingList] = useAtom(followingListAtom);
  const setIsModalOpen = useSetAtom(isNewChatModalOpenAtom);
  const setDmConversations = useSetAtom(dmConversationsAtom);
  const setSelectedConversation = useSetAtom(selectedConversationAtom);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);

  const filteredFollowing = followingList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlaceholderColor = (str: string) => {
    const colors = [
      "bg-red-600",
      "bg-blue-600",
      "bg-green-600",
      "bg-yellow-600",
      "bg-purple-600",
      "bg-pink-600",
      "bg-indigo-600",
      "bg-orange-600",
      "bg-teal-600",
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleStartChat = () => {
    if (!selectedUser) return;

    setIsModalOpen(false);
    setDmConversations((prev) => {
      const existingDm = prev.find((dm) => dm.id === selectedUser.id);
      if (!existingDm) return [selectedUser, ...prev];
      return prev;
    });
    setSelectedConversation({ type: "dm", data: selectedUser });
  };

  const onClose = () => setIsModalOpen(false);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col h-[70vh] md:h-[600px] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800 relative">
          <div className="w-8"></div> 
          <h2 className="text-[17px] font-bold">New message</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition"
          >
            <X size={26} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center px-5 py-1 border-b border-gray-800">
          <span className="text-base font-medium mr-3">To:</span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-3 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-5 py-3">
            <h3 className="text-sm font-semibold text-white mb-3">Suggested</h3>
            
            <div className="space-y-4">
              {filteredFollowing.length === 0 && (
                <p className="text-gray-500 text-sm">No users found.</p>
              )}

              {filteredFollowing.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                
                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover bg-gray-700"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${getPlaceholderColor(
                            user.id || user.username
                          )}`}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-400">
                          {user.username}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center
                        ${isSelected 
                          ? "bg-white border-white" 
                          : "border-gray-500 group-hover:border-gray-300 bg-transparent"
                        }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#262626]">
          <button
            onClick={handleStartChat}
            disabled={!selectedUser}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-all
              ${selectedUser 
                ? "bg-indigo-600 hover:bg-indigo-500 text-white" 
                : "bg-indigo-900/40 text-indigo-200/40 cursor-not-allowed"
              }`}
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
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
  const [isModalOpen] = useAtom(isNewChatModalOpenAtom);
  const [isTransitioning] = useAtom(sidebarTransitionLoadingAtom);
  const queryClient = useQueryClient();

  const localRooms = useLiveQuery(() => db.rooms.toArray(), []) || [];
  const localDms = useLiveQuery(() => db.dms.toArray(), []) || [];
  useEffect(() => {
    if (userRooms.length > 0) {
      db.rooms
        .bulkPut(userRooms)
        .catch((err) => console.error("Failed to sync rooms to cache", err));
    }
  }, [userRooms]);

  useEffect(() => {
    if (dmConversations.length > 0) {
      db.dms
        .bulkPut(dmConversations)
        .catch((err) => console.error("Failed to sync DMs to cache", err));
    }
  }, [dmConversations]);

  const displayRooms = userRooms.length > 0 ? userRooms : localRooms;
  const displayDms = dmConversations.length > 0 ? dmConversations : localDms;

  const combinedAndSortedConversations = useMemo(() => {
    const roomsWithType = displayRooms.map((room) => ({
      ...room,
      type: "room" as const,
    }));
    const dmsWithType = displayDms.map((dm) => ({
      ...dm,
      type: "dm" as const,
    }));
    return [...roomsWithType, ...dmsWithType].sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return (
        new Date(b.lastMessageTimestamp).getTime() -
        new Date(a.lastMessageTimestamp).getTime()
      );
    });
  }, [displayRooms, displayDms]);

  useEffect(() => {
    if (user && (userRooms.length > 0 || dmConversations.length > 0)) {
      const conversations = [
        ...userRooms.map((room) => ({ type: "room", data: room })),
        ...dmConversations.map((dm) => ({ type: "dm", data: dm })),
      ];
      conversations.forEach((conv) => {
        const queryKey = [
          "chat",
          { type: conv.type, id: conv.data.id, currentUserId: user.id },
        ] as MessagesQueryKey;
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
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isExpanded = isFocused || searchTerm.length > 0;

  const shouldShowSkeleton =
    (loading.profile && combinedAndSortedConversations.length === 0) ||
    isTransitioning;

  return (
    <div className="flex flex-col w-full h-full bg-black border-r border-zinc-800 mt-2 relative">
      {isModalOpen && <NewChatModal />}
      <div className="flex items-center gap-2 px-3 py-3 shrink-0">
        <div className="grow" ref={searchBarRef}>
          <div
            className={`relative flex items-center rounded-full transition-all duration-200 ${isExpanded ? "bg-zinc-800" : "bg-zinc-900"}`}
          >
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-8 py-2 rounded-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
            />
            {isExpanded && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setIsFocused(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-700"
              >
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
          id="new-chat-btn"
        >
          <Pencil size={20} />
        </button>
      </div>

      <div className="grow overflow-y-auto custom-scrollbar px-2 mt-4">
        {shouldShowSkeleton ? (
          <SidebarSkeleton />
        ) : (
          !error && (
            <ConversationList
              items={combinedAndSortedConversations}
              searchTerm={searchTerm}
            />
          )
        )}
      </div>
    </div>
  );
}
