"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  selectedConversationAtom,
  messagesAtom,
  networkErrorAtom,
  userAtom,
} from "@/store";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  MessageType,
  DirectMessage,
  GroupMessage,
  SimpleUser,
} from "@lib/types";
import { API_BASE_URL } from "@lib/constants";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatPanelSkeleton from "../ui/ChatPanelSkeleton";
import { socketAtom } from "../layout";
import { AnimatePresence, motion } from "framer-motion";

const SCROLL_THRESHOLD = 200;

function formatLastSeen(lastSeen: string | null | undefined): string {
  if (!lastSeen) return "";
  const date = new Date(lastSeen);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Last seen yesterday";
  return `Last seen ${days}d ago`;
}

interface TypingUser {
  conversationId: string;
  name: string;
}

const ChatPanel: React.FC = () => {
  const [currentUser] = useAtom(userAtom);
  const [selectedConversation, setSelectedConversation] = useAtom(selectedConversationAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [error, setError] = useAtom(networkErrorAtom);
  const [socket] = useAtom(socketAtom);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  
  // This is purely for local UI logic to prevent flicker
  const [isSwitching, setIsSwitching] = useState(false);
  
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const oldScrollHeightRef = useRef(0);
  const isInitialLoad = useRef(true);

  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useChatMessages(selectedConversation);

  // 1. FORCE BLACK SCREEN ON CHANGE
  // This runs synchronously after render when selectedConversation changes
  useLayoutEffect(() => {
    if (selectedConversation?.data.id) {
        setIsSwitching(true);
        // The atom is already cleared in ConversationList, but we enforce visual state here
        // Short timeout to allow React Query to start fetching
        const t = setTimeout(() => {
            setIsSwitching(false);
            isInitialLoad.current = true;
        }, 50); 
        return () => clearTimeout(t);
    }
  }, [selectedConversation?.data.id]);

  // 2. Load Messages
  useEffect(() => {
    if (!isSwitching && fetchedMessages) {
      setMessages([...fetchedMessages].reverse());
    }
  }, [fetchedMessages, setMessages, isSwitching]);

  useEffect(() => {
    setTypingUser(null);
  }, [selectedConversation?.data.id]);

  useEffect(() => {
    if (isError) setError("Failed to fetch messages");
    else setError(null);
  }, [isError, setError]);

  useLayoutEffect(() => {
    if (isSwitching || !scrollContainerRef.current) return;

    if (oldScrollHeightRef.current > 0 && !isLoadingMore) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = newScrollHeight - oldScrollHeightRef.current;
      oldScrollHeightRef.current = 0;
      return;
    }

    if (!isLoadingMessages && messages.length > 0) {
      if (isInitialLoad.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        isInitialLoad.current = false;
      } else {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        if (isNearBottom) {
           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [isLoadingMessages, isLoadingMore, messages, isSwitching]);

  useEffect(() => {
    if (!socket) return;
    const handleUserTyping = (data: TypingUser) => {
      if (data.conversationId === selectedConversation?.data.id) setTypingUser(data);
    };
    const handleUserStoppedTyping = (data: { conversationId: string }) => {
      if (data.conversationId === selectedConversation?.data.id) setTypingUser(null);
    };
    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);
    return () => {
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);
    };
  }, [socket, selectedConversation]);

  const fetchMoreMessages = () => {
    if (isLoadingMore || !hasNextPage || !scrollContainerRef.current) return;
    oldScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    fetchNextPage();
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop < SCROLL_THRESHOLD) {
      fetchMoreMessages();
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    router.push("/network");
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || content.trim() === "" || !currentUser || !socket) return;
    const tempId = crypto.randomUUID();
    const tempSender: SimpleUser = { id: currentUser.id, username: currentUser.username, name: currentUser.name || "Me", image: currentUser.image || null, lastMessage: null, lastMessageTimestamp: null };
    const tempMessageBase = { id: tempId, content, createdAt: new Date().toISOString(), senderId: currentUser.id, sender: tempSender, reactions: [], isOptimistic: true };

    let tempMessage: MessageType;
    let eventName = "";
    let payload = {};

    if (selectedConversation.type === "room") {
      eventName = "group:send";
      payload = { senderId: currentUser.id, roomId: selectedConversation.data.id, content, tempId };
      tempMessage = { ...tempMessageBase, roomId: selectedConversation.data.id } as GroupMessage;
    } else {
      eventName = "dm:send";
      payload = { senderId: currentUser.id, recipientId: selectedConversation.data.id, content, tempId };
      tempMessage = { ...tempMessageBase, recipientId: selectedConversation.data.id } as DirectMessage;
    }
    setMessages((prev) => [...prev, tempMessage]);
    socket.emit(eventName, payload);
    
    setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    if (!currentUser || !selectedConversation || !socket) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const oldMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      socket.emit("message:delete", { userId: currentUser.id, messageId: messageId as string, messageType });
    } catch (err) {
      setError("Failed to delete message.");
      setMessages(oldMessages);
    }
  };

  const handleToggleReaction = async (messageId: number | string, emoji: string) => {
    if (!currentUser || !selectedConversation || !socket) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions.find((r) => r.emoji === emoji && r.user.id === currentUser.id);
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const newReactions = existingReaction
          ? msg.reactions.filter((r) => r.id !== existingReaction.id)
          : [...msg.reactions, { id: crypto.randomUUID(), emoji, user: { id: currentUser.id, username: currentUser.username, name: currentUser.name, image: currentUser.image || null, lastMessage: null, lastMessageTimestamp: null } }];
        return { ...msg, reactions: newReactions };
      })
    );
    socket.emit("reaction:toggle", { userId: currentUser.id, emoji, groupMessageId: messageType === "group" ? messageId : undefined, directMessageId: messageType === "dm" ? messageId : undefined });
  };

  if (!selectedConversation) return null;

  // INSTANT BLACK SCREEN
  if (isSwitching) {
    return <div className="flex-1 w-full h-full bg-black" />;
  }

  const name = selectedConversation.data.name;
  const imageUrl = selectedConversation.type === "room" ? selectedConversation.data.imageUrl : (selectedConversation.data as SimpleUser).image;
  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${name.charAt(0).toUpperCase()}`;
  
  // FIXED IMAGE LOGIC
  let src = placeholder;
  if (imageUrl) {
    src = imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}/uploads/${imageUrl}`;
  }

  const isDM = selectedConversation.type === "dm";
  const convoData = selectedConversation.data as SimpleUser;
  const statusText = convoData.isOnline ? "Online" : formatLastSeen(convoData.lastSeen);

  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden ml-2">
      <div className="flex-none flex items-center p-3 bg-black border-b border-zinc-800 z-10">
        <button onClick={handleBack} className="md:hidden mr-3 text-zinc-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <Link href={isDM ? `/profile/${(selectedConversation.data as SimpleUser).username}` : "#"}>
          <Image src={src} alt={name} width={40} height={40} onError={(e) => (e.currentTarget.src = placeholder)} className="w-10 h-10 rounded-full object-cover mr-3" />
        </Link>
        <div className="flex-grow min-w-0">
          <Link href={isDM ? `/profile/${(selectedConversation.data as SimpleUser).username}` : "#"} className="font-bold text-white hover:underline truncate block">
            {name}
          </Link>
          {isDM ? (
            <span className={`text-xs block truncate ${convoData.isOnline ? "text-green-400" : "text-zinc-500"}`}>
              {statusText}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 block">Group</span>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto bg-black custom-scrollbar">
        {isLoadingMore && <div className="flex justify-center my-2"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>}
        
        {/* Show skeleton if loading, otherwise messages */}
        {isLoadingMessages ? (
            <ChatPanelSkeleton />
        ) : (
            <>
            {messages.length === 0 && <div className="flex justify-center items-center h-full text-zinc-600">No messages yet.</div>}
            {currentUser && selectedConversation && (
                <MessageList messages={messages} currentUser={currentUser} selectedConversation={selectedConversation} onDelete={handleDeleteMessage} onToggleReaction={handleToggleReaction} />
            )}
            </>
        )}
        
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {typingUser && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex-none px-4 pb-1 text-xs text-zinc-500 italic bg-black">
            {typingUser.name} is typing...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-none w-full bg-black z-10">
        <ChatInput onSend={handleSendMessage} onGetSendButtonPosition={() => {}} />
      </div>
    </div>
  );
};

export default ChatPanel;
