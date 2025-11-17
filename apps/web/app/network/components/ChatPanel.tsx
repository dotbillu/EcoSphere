"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import {
  selectedConversationAtom,
  messagesAtom,
  networkErrorAtom,
  userAtom,
} from "@/store";
import { MessageSquare, Loader2 } from "lucide-react";
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
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  if (hours < 24) return `Last seen ${hours}h ago`;
  if (days === 1) return "Last seen yesterday";
  return `Last seen ${days}d ago`;
}

interface TypingUser {
  conversationId: string;
  name: string;
}

const ChatPanel: React.FC = () => {
  const [currentUser] = useAtom(userAtom);
  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom
  );
  const [messages, setMessages] = useAtom(messagesAtom);
  const [error, setError] = useAtom(networkErrorAtom);
  const [socket] = useAtom(socketAtom);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);

  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useChatMessages(selectedConversation);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const oldScrollHeightRef = useRef(0);

  useEffect(() => {
    if (fetchedMessages) setMessages([...fetchedMessages].reverse());
    else setMessages([]);
  }, [fetchedMessages, setMessages]);

  useEffect(() => {
    if (isError) setError("Failed to fetch messages");
    else setError(null);
  }, [isError, setError]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    if (oldScrollHeightRef.current > 0 && !isLoadingMore) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop =
        newScrollHeight - oldScrollHeightRef.current;
      oldScrollHeightRef.current = 0;
    } else if (
      oldScrollHeightRef.current === 0 &&
      !isLoadingMessages &&
      fetchedMessages
    ) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [isLoadingMessages, isLoadingMore, fetchedMessages, setMessages]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // --- Listen for typing events ---
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: TypingUser) => {
      if (data.conversationId === selectedConversation?.data.id) {
        setTypingUser(data);
      }
    };

    const handleUserStoppedTyping = (data: { conversationId: string }) => {
      if (data.conversationId === selectedConversation?.data.id) {
        setTypingUser(null);
      }
    };

    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);

    return () => {
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);
    };
  }, [socket, selectedConversation]);

  // Reset typing indicator if chat changes
  useEffect(() => {
    setTypingUser(null);
  }, [selectedConversation]);

  const fetchMoreMessages = () => {
    if (isLoadingMore || !hasNextPage || !scrollContainerRef.current) return;
    oldScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    fetchNextPage();
  };

  const handleScroll = () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop < SCROLL_THRESHOLD
    )
      fetchMoreMessages();
  };

  const handleSendMessage = async (content: string) => {
    if (
      !selectedConversation ||
      content.trim() === "" ||
      !currentUser ||
      !socket
    )
      return;

    const tempId = crypto.randomUUID();
    const tempSender: SimpleUser = {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name || "Me",
      image: currentUser.image || null,
      lastMessage: null,
      lastMessageTimestamp: null,
    };
    const tempMessageBase = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      senderId: currentUser.id,
      sender: tempSender,
      reactions: [],
      isOptimistic: true,
    };

    let tempMessage: MessageType;
    let eventName = "";
    let payload = {};

    if (selectedConversation.type === "room") {
      eventName = "group:send";
      payload = {
        senderId: currentUser.id,
        roomId: selectedConversation.data.id,
        content,
        tempId,
      };
      tempMessage = {
        ...tempMessageBase,
        roomId: selectedConversation.data.id,
      } as GroupMessage;
    } else {
      eventName = "dm:send";
      payload = {
        senderId: currentUser.id,
        recipientId: selectedConversation.data.id,
        content,
        tempId,
      };
      tempMessage = {
        ...tempMessageBase,
        recipientId: selectedConversation.data.id,
      } as DirectMessage;
    }
    setMessages((prev) => [...prev, tempMessage]);
    socket.emit(eventName, payload);
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    if (!currentUser || !selectedConversation || !socket) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const oldMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      socket.emit("message:delete", {
        userId: currentUser.id,
        messageId: messageId as string,
        messageType,
      });
    } catch (err) {
      setError("Failed to delete message. Please try again.");
      setMessages(oldMessages);
    }
  };

  const handleToggleReaction = async (
    messageId: number | string,
    emoji: string
  ) => {
    if (!currentUser || !selectedConversation || !socket) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions.find(
      (r) => r.emoji === emoji && r.user.id === currentUser.id
    );
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const newReactions = existingReaction
          ? msg.reactions.filter((r) => r.id !== existingReaction.id)
          : [
              ...msg.reactions,
              {
                id: crypto.randomUUID(),
                emoji,
                user: {
                  id: currentUser.id,
                  username: currentUser.username,
                  name: currentUser.name,
                  image: currentUser.image || null,
                  lastMessage: null,
                  lastMessageTimestamp: null,
                },
              },
            ];
        return { ...msg, reactions: newReactions };
      })
    );

    socket.emit("reaction:toggle", {
      userId: currentUser.id,
      emoji,
      groupMessageId: messageType === "group" ? messageId : undefined,
      directMessageId: messageType === "dm" ? messageId : undefined,
    });
  };

  if (!selectedConversation) {
    return (
      <div className="flex-grow flex-col hidden md:flex bg-black">
        <div className="flex flex-col h-full justify-center items-center text-gray-500">
          <MessageSquare size={100} />
          <h2 className="mt-4 text-xl font-medium text-gray-400">
            Select a conversation
          </h2>
          <p>Choose a room or DM to start chatting.</p>
        </div>
      </div>
    );
  }

  const name = selectedConversation.data.name;
  const imageUrl =
    selectedConversation.type === "room"
      ? selectedConversation.data.imageUrl
      : (selectedConversation.data as SimpleUser).image;

  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${name
    .charAt(0)
    .toUpperCase()}`;
  const src = imageUrl ? `${API_BASE_URL}/uploads/${imageUrl}` : placeholder;

  // Online/Offline Status for Header
  const isDM = selectedConversation.type === "dm";
  const convoData = selectedConversation.data as SimpleUser;
  const statusText = convoData.isOnline
    ? ""
    : formatLastSeen(convoData.lastSeen);

  return (
    <div className="w-3/4 flex-col hidden md:flex bg-black relative">
      <div className="flex items-center p-4 bg-black border-b border-white/20">
        <Link
          href={
            selectedConversation.type === "dm"
              ? `/profile/${(selectedConversation.data as SimpleUser).username}`
              : "#"
          }
        >
          <Image
            src={src}
            alt={name}
            width={40}
            height={40}
            onError={(e) => (e.currentTarget.src = placeholder)}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
        </Link>
        <div>
          <Link
            href={
              selectedConversation.type === "dm"
                ? `/profile/${(selectedConversation.data as SimpleUser).username}`
                : "#"
            }
            className="font-bold text-white hover:underline"
          >
            {name}
          </Link>
          {isDM ? (
            <span
              className={`text-sm block ${
                convoData.isOnline ? "text-green-500" : "text-zinc-400"
              }`}
            >
              {statusText}
            </span>
          ) : (
            <span className="text-sm text-zinc-400 block">Group</span>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow p-4 overflow-y-auto bg-black"
      >
        {isLoadingMore && (
          <div className="flex justify-center my-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        )}
        {isLoadingMessages && <ChatPanelSkeleton />}
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet.
          </div>
        )}
        {!isLoadingMessages && currentUser && selectedConversation && (
          <MessageList
            messages={messages}
            currentUser={currentUser}
            selectedConversation={selectedConversation}
            onDelete={handleDeleteMessage}
            onToggleReaction={handleToggleReaction}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {typingUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-2 text-sm text-gray-400 italic"
          >
            {typingUser.name} is typing...
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInput onSend={handleSendMessage} onGetSendButtonPosition={() => {}} />
    </div>
  );
};

export default ChatPanel;
