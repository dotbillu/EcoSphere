"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";
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

const SCROLL_THRESHOLD = 200;

const ChatPanel: React.FC = () => {
  const [currentUser] = useAtom(userAtom);
  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom
  );
  const [messages, setMessages] = useAtom(messagesAtom);
  const [error, setError] = useAtom(networkErrorAtom);

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
    if (fetchedMessages) setMessages(fetchedMessages);
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
    } else if (oldScrollHeightRef.current === 0 && !isLoadingMessages && fetchedMessages) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [isLoadingMessages, isLoadingMore, fetchedMessages, setMessages]);

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
    if (!selectedConversation || content.trim() === "" || !currentUser) return;
    let url = "";
    let body: any = {};
    const tempId = crypto.randomUUID(); // ID is always a string (UUID) now

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
    };

    let tempMessage: MessageType;
    if (selectedConversation.type === "room") {
      // roomId is string (UUID)
      url = `${API_BASE_URL}/chat/room/${selectedConversation.data.id}/message`;
      // senderId is string (UUID)
      body = { senderId: currentUser.id, content };
      tempMessage = {
        ...tempMessageBase,
        roomId: selectedConversation.data.id,
      } as GroupMessage;
    } else {
      url = `${API_BASE_URL}/chat/dm`;
      body = {
        senderId: currentUser.id, // string (UUID)
        recipientId: selectedConversation.data.id, // string (UUID)
        content,
      };
      tempMessage = {
        ...tempMessageBase,
        recipientId: selectedConversation.data.id, // string (UUID)
      } as DirectMessage;
    }

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      0
    );

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const savedMessage: MessageType = await res.json();
      setMessages((prev) =>
        // Compare temporary string ID with message ID
        prev.map((msg) => (msg.id === tempId ? savedMessage : msg))
      );
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    if (!currentUser || !selectedConversation) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const url = `${API_BASE_URL}/chat/${messageType}/message/${messageId}`;
    const oldMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }), // userId is string (UUID)
      });
      if (!res.ok) {
        setMessages(oldMessages);
        throw new Error("Failed to delete message");
      }
    } catch (err: any) {
      setError(err.message);
      setMessages(oldMessages);
    }
  };

  const handleToggleReaction = async (
    messageId: number | string, // Can be string (UUID)
    emoji: string
  ) => {
    if (!currentUser || !selectedConversation) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;
    const existingReaction = message.reactions.find(
      (r) => r.emoji === emoji && r.user.id === currentUser.id // user.id is string (UUID)
    );
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const newReactions = existingReaction
          ? msg.reactions.filter((r) => r.id !== existingReaction.id)
          : [
              ...msg.reactions,
              {
                id: Date.now(), // Temporary ID (will be replaced by server's string ID)
                emoji,
                user: {
                  id: currentUser.id, // string (UUID)
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
    try {
      const res = await fetch(`${API_BASE_URL}/chat/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id, // string (UUID)
          emoji,
          // messageId is string (UUID)
          groupMessageId: messageType === "group" ? messageId : undefined,
          directMessageId: messageType === "dm" ? messageId : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle reaction");
      // Force refresh of query to pick up server-assigned reaction ID
      setSelectedConversation((conv) => ({ ...conv! }));
    } catch (err: any) {
      setError(err.message);
      setSelectedConversation((conv) => ({ ...conv! }));
    }
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
          {selectedConversation.type === "dm" && (
            <span className="text-sm text-zinc-400 block">
              @{(selectedConversation.data as SimpleUser).username}
            </span>
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
      <ChatInput onSend={handleSendMessage} onGetSendButtonPosition={() => {}} />
    </div>
  );
}

export default ChatPanel;
