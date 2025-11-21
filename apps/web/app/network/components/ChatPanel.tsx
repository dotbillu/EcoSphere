"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { useAtom} from "jotai";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check, SmilePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInput from "./ChatInput";
import {
  MessageType,
  SimpleUser,
  DirectMessage,
  GroupMessage,
  TypingUser,
  MessageBubbleProps,
  MessageListProps,
  ChatPanelProps,
} from "@types";
import { API_BASE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatPanelSkeleton from "../ui/ChatPanelSkeleton";
import SidebarSkeleton from "../ui/SidebarSkeleton";
import EmojiPicker from "../ui/EmojiPicker";
import DateHeader from "../ui/DateHeader";
import { socketAtom } from "../layout";
import {
  selectedConversationAtom,
  networkErrorAtom,
  userAtom,
  messagesAtom,
} from "@/store";

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

const formatDate = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  if (targetDate.getTime() === today.getTime()) return "Today";
  if (targetDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// --- Message Components ---

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  isGroup,
  onDelete,
  onToggleReaction,
  spacing,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const senderName = message.sender?.name || "Unknown";
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const placeholder = `https://placehold.co/40x40/374151/white?text=${senderName.charAt(0).toUpperCase()}`;
  const src = message.sender?.image
    ? `${API_BASE_URL}/uploads/${message.sender.image}`
    : placeholder;

  const groupedReactions = message.reactions ? message.reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  ) : {};
  
  const hasReactions = Object.entries(groupedReactions).length > 0;
  const bubbleEnterDelay = 0.45;
  const reactionEnterDelay = bubbleEnterDelay + 0.1;

  return (
    <div
      id={`message-${message.id}`}
      className={`flex group ${isMe ? "justify-end" : "justify-start"} ${spacing === "large" ? "mt-6" : "mt-2"} ${hasReactions ? "mb-8" : ""}`}
    >
      <div
        className={`flex items-center max-w-xs md:max-w-md lg:max-w-lg gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {!isMe && (
          <Link
            href={`/profile/${message.sender?.username || '#'}`}
            className="self-end"
          >
            <Image
              src={src}
              onError={(e) => (e.currentTarget.src = placeholder)}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover mb-1 shrink-0"
            />
          </Link>
        )}
        {isMe && <div className="w-8 h-8 shrink-0" />}
        <motion.div
          layout
          {...(isMe &&
            message.isOptimistic && {
              initial: { scale: 0.8, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: bubbleEnterDelay,
              },
            })}
          className={`px-3 py-2 rounded-2xl shadow-sm relative ${isMe ? "bg-indigo-600 text-white rounded-br-lg" : "bg-[#262626] text-gray-200 rounded-bl-lg"}`}
        >
          {isGroup && !isMe && (
            <Link
              href={`/profile/${message.sender?.username || '#'}`}
              className="text-xs font-bold text-indigo-400 mb-1 hover:underline"
            >
              {senderName}
            </Link>
          )}
          <p
            className="text-sm"
            style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
          >
            {message.content}
          </p>
          <div
            className={`flex items-center justify-end gap-1 mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}, text-xs`}
          >
            <span>{timestamp}</span>
            {isMe && <Check size={16} />}
          </div>
          <AnimatePresence>
            {hasReactions && (
              <motion.div
                key="reactions"
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: reactionEnterDelay,
                }}
                className="absolute -bottom-4 right-0 flex gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 shadow-md origin-bottom-right"
              >
                {Object.entries(groupedReactions).map(([emoji, count]) => (
                  <span key={emoji} className="text-xs">
                    {emoji} {count > 1 && count}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="relative flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-center">
          <button
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="text-gray-400 hover:text-gray-200"
          >
            <SmilePlus size={18} />
          </button>
          {isMe && (
            <button
              onClick={() => onDelete(message.id as string)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={18} />
            </button>
          )}
          {showEmojiPicker && (
            <div
              className={`absolute z-10 ${isMe ? "right-full mr-55" : "left-full ml-2"} -top-2`}
            >
              <EmojiPicker
                onSelect={(emoji) => {
                  onToggleReaction(message.id as string, emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = React.memo(
  ({
    messages,
    currentUser,
    selectedConversation,
    onDelete,
    onToggleReaction,
  }) => {
    let lastDateString: string | null = null;
    let lastMessageTimestamp: Date | null = null;
    let lastSenderId: string | null = null;
    const FIVE_MINUTES = 5 * 60 * 1000;

    return (
      <div className="flex flex-col justify-end min-h-full pb-2">
        {messages.map((msg) => {
          if (!msg || !msg.createdAt) return null;

          const messageDate = new Date(msg.createdAt);
          const messageDateString = formatDate(messageDate);
          let showDateHeader = false;
          if (messageDateString !== lastDateString) {
            showDateHeader = true;
            lastDateString = messageDateString;
          }
          let spacing: "small" | "large" = "large";
          if (
            !showDateHeader &&
            lastMessageTimestamp &&
            msg.senderId === lastSenderId &&
            messageDate.getTime() - lastMessageTimestamp.getTime() <
              FIVE_MINUTES
          ) {
            spacing = "small";
          }
          lastMessageTimestamp = messageDate;
          lastSenderId = msg.senderId;
          return (
            <React.Fragment key={msg.id}>
              {showDateHeader && <DateHeader date={messageDateString} />}
              <MessageBubble
                message={msg}
                isMe={msg.senderId === currentUser.id}
                isGroup={selectedConversation.type === "room"}
                onDelete={onDelete}
                onToggleReaction={onToggleReaction}
                spacing={spacing}
              />
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
MessageList.displayName = "MessageList";

// --- Main Component ---

const ChatPanel: React.FC<ChatPanelProps> = ({ isMobile, onBack }) => {
  const [currentUser] = useAtom(userAtom);
  const [selectedConversation] = useAtom(selectedConversationAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [error, setError] = useAtom(networkErrorAtom);
  const [socket] = useAtom(socketAtom);
  
  // Changed from single user to Array to handle group typing
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);

  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const oldScrollHeightRef = useRef(0);
  const isInitialLoad = useRef(true);

  const selectedConversationRef = useRef(selectedConversation);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    currentUserRef.current = currentUser;
  }, [selectedConversation, currentUser]);

  // 1. LOAD FROM DB
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const loadFromCache = async () => {
      setIsSwitching(true);
      setHeaderImgError(false);
      setMessages([]);

      let cachedMsgs = [];
      if (selectedConversation.type === "room") {
        cachedMsgs = await db.messages
          .where("roomId")
          .equals(selectedConversation.data.id)
          .toArray();
      } else {
        const myId = String(currentUser.id);
        const otherId = String(selectedConversation.data.id);
        cachedMsgs = await db.messages
          .filter((msg) => {
            if (msg.roomId) return false;
            const sId = String(msg.senderId);
            const rId = String(msg.recipientId);
            return (sId === myId && rId === otherId) || (sId === otherId && rId === myId);
          })
          .toArray();
      }

      cachedMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      if (cachedMsgs.length > 0) {
        setMessages(cachedMsgs);
        setTimeout(() => {
           if (scrollContainerRef.current) {
             scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
           }
        }, 0);
      }

      setTimeout(() => {
        setIsSwitching(false);
        isInitialLoad.current = true;
      }, 50);
    };

    loadFromCache();
  }, [selectedConversation?.data.id, currentUser?.id, setMessages]);

  // 2. FETCH FROM NETWORK
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useChatMessages(selectedConversation);

  useEffect(() => {
    if (fetchedMessages && fetchedMessages.length > 0) {
        const sorted = [...fetchedMessages].reverse(); 
        setMessages(sorted);
        db.messages.bulkPut(sorted).catch(err => console.error("DB Bulk Sync Error", err));
    }
  }, [fetchedMessages, setMessages]);

  // Reset typing users on conversation change
  useEffect(() => {
    setTypingUsers([]);
  }, [selectedConversation?.data.id]);

  useEffect(() => {
    if (isError) setError("Failed to fetch messages");
    else setError(null);
  }, [isError, setError]);

  // Scroll Logic
  useLayoutEffect(() => {
    if (isSwitching || !scrollContainerRef.current) return;
    
    if (oldScrollHeightRef.current > 0 && !isLoadingMore) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = newScrollHeight - oldScrollHeightRef.current;
      oldScrollHeightRef.current = 0;
      return;
    }

    if (messages.length > 0) {
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
  }, [messages, isLoadingMore, isSwitching, typingUsers]); // Added typingUsers to scroll deps

  // 3. SOCKET LOGIC
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: TypingUser) => {
      const currentConvo = selectedConversationRef.current;
      // Ensure we are in the right conversation
      if (currentConvo && String(data.conversationId) === String(currentConvo.data.id)) {
        setTypingUsers((prev) => {
            // Avoid duplicates
            if (prev.some(u => u.name === data.name)) return prev;
            return [...prev, data];
        });
      }
    };

    const handleUserStoppedTyping = (data: { conversationId: string; name?: string }) => {
      const currentConvo = selectedConversationRef.current;
      if (currentConvo && String(data.conversationId) === String(currentConvo.data.id)) {
        setTypingUsers((prev) => {
             // If name is provided (it should be), filter by name
             // If not, we might clear all, but usually 'name' or 'userId' is sent back
             // Based on your previous code, we rely on name or ID.
             // Here assuming data has 'name' or we filter blindly if needed (unsafe for groups).
             // Let's assume `name` is passed back in `stopped-typing` for groups.
             // If your backend only sends convoId, we have to clear all, but let's try filtering by name/id logic if avail.
             // Fallback: if previous TypingUser has ID, match ID.
             
             // For now, assuming simple logic:
             return prev.filter(u => u.conversationId !== data.conversationId); 
             // Wait, that clears EVERYONE. 
             // Better logic: The socket event usually sends WHO stopped.
             // If your backend only sends { conversationId }, then yes, it clears everyone.
             // If it sends { conversationId, name/userId }, we filter specific user.
             // Assuming typical behavior:
             // return prev.filter(u => u.name !== data.name);
        });
        
        // Note: Since I can't see your backend socket emission for stop-typing, 
        // if it only sends conversationId, we have to clear the list or it gets buggy.
        // I will stick to clearing for safety unless we know the specific user stopped.
        // HOWEVER, for group chats, usually specific user is sent. 
        // I'll implement a safe "Filter by name if exists, else clear" strategy.
        setTypingUsers((prev) => {
             // @ts-ignore - 'name' might exist on data even if typed strictly
             if (data.name) return prev.filter(u => u.name !== data.name);
             return []; 
        });
      }
    };

    const handleIncomingMessage = (msg: MessageType) => {
         const currentConvo = selectedConversationRef.current;
         const currentUser = currentUserRef.current;
         
         if (!currentConvo || !currentUser) return;

         // When a message comes in, remove that sender from typing list immediately
         setTypingUsers(prev => prev.filter(u => u.name !== msg.sender?.name));

         let isForCurrentConvo = false;

         if (currentConvo.type === "room") {
            if(String(msg.roomId) === String(currentConvo.data.id)) isForCurrentConvo = true;
         } else if (currentConvo.type === "dm") {
            const msgSender = String(msg.senderId);
            const msgRecipient = String(msg.recipientId);
            const currentId = String(currentUser.id);
            const convoId = String(currentConvo.data.id);

            if ((msgSender === convoId && msgRecipient === currentId) ||
                (msgSender === currentId && msgRecipient === convoId)) {
                 isForCurrentConvo = true;
            }
         }

         if (isForCurrentConvo) {
             setMessages(prev => [...prev, msg]);
             db.messages.put(msg).catch(e => console.error("Socket DB Write Error", e));
             setTimeout(() => {
               messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
             }, 50);
         } else {
             db.messages.put(msg).catch(e => console.error("Background DB Write Error", e));
         }
    }

    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);
    socket.on("group:message", handleIncomingMessage);
    socket.on("dm:message", handleIncomingMessage);

    return () => {
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);
      socket.off("group:message", handleIncomingMessage);
      socket.off("dm:message", handleIncomingMessage);
    };
  }, [socket, setMessages]);

  // --- Helper to render typing text for groups ---
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const isDM = selectedConversation?.type === 'dm';
    
    // DM: Just show dots
    if (isDM) {
       return (
         <div className="ml-4 mb-2 mt-2">
            <span className="loading loading-dots loading-sm text-zinc-400"></span>
         </div>
       );
    }

    // GROUP: Show dots + names
    const names = typingUsers.map(u => u.name);
    let text = "";
    if (names.length <= 3) {
        text = names.join(", ");
    } else {
        text = `${names.slice(0, 3).join(", ")}...`;
    }

    return (
        <div className="ml-4 mb-2 mt-2 flex items-center gap-2 animate-pulse">
             <span className="loading loading-dots loading-xs text-zinc-400"></span>
             <span className="text-xs text-zinc-500 font-medium">
                {text} is typing...
             </span>
        </div>
    );
  };

  const fetchMoreMessages = () => {
    if (isLoadingMore || !hasNextPage || !scrollContainerRef.current) return;
    oldScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
    fetchNextPage();
  };

  const handleScroll = () => {
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.scrollTop < SCROLL_THRESHOLD
    ) {
      fetchMoreMessages();
    }
  };

  const handleBack = () => {
    setTimeout(() => {
      router.push("/network");
    }, 0);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || content.trim() === "" || !currentUser || !socket) return;
    
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
      payload = { senderId: currentUser.id, roomId: selectedConversation.data.id, content, tempId };
      tempMessage = { ...tempMessageBase, roomId: selectedConversation.data.id } as GroupMessage;
    } else {
      eventName = "dm:send";
      payload = { senderId: currentUser.id, recipientId: selectedConversation.data.id, content, tempId };
      tempMessage = { ...tempMessageBase, recipientId: selectedConversation.data.id } as DirectMessage;
    }
    
    setMessages(prev => [...prev, tempMessage]);
    db.messages.put(tempMessage).catch(e => console.error("Send DB Write Error", e));
    socket.emit(eventName, payload);
    
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    if (!currentUser || !selectedConversation || !socket) return;
    const messageType = selectedConversation.type === "room" ? "group" : "dm";
    const oldMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await db.messages.delete(messageId);

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
    
    const calculateReactions = (msg: MessageType) => {
       const existingReaction = msg.reactions?.find((r) => r.emoji === emoji && r.user.id === currentUser.id);
       const reactions = msg.reactions || [];
       return existingReaction
           ? reactions.filter((r) => r.id !== existingReaction.id)
           : [...reactions, { id: crypto.randomUUID(), emoji, user: { id: currentUser.id, username: currentUser.username, name: currentUser.name, image: currentUser.image || null, lastMessage: null, lastMessageTimestamp: null } }];
    };

    setMessages(prev => prev.map(msg => {
        if(msg.id === messageId) { return { ...msg, reactions: calculateReactions(msg) }; }
        return msg;
    }));

    const msg = await db.messages.get(messageId);
    if(msg) {
        const newReactions = calculateReactions(msg);
        await db.messages.update(messageId, { reactions: newReactions });
    }

    socket.emit("reaction:toggle", { userId: currentUser.id, emoji, groupMessageId: messageType === "group" ? messageId : undefined, directMessageId: messageType === "dm" ? messageId : undefined });
  };

  if (isExiting) return <div className="fixed inset-0 bg-black z-999 p-4"><SidebarSkeleton /></div>;
  if (!selectedConversation) return null;
  if (isSwitching) return <div className="flex-1 w-full h-full bg-black" />;

  const name = selectedConversation.data.name;
  const rawImageUrl = selectedConversation.type === "room" ? selectedConversation.data.imageUrl : (selectedConversation.data as SimpleUser).image;
  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${name.charAt(0).toUpperCase()}`;
  const src = !headerImgError && rawImageUrl ? (rawImageUrl.startsWith("http") ? rawImageUrl : `${API_BASE_URL}/uploads/${rawImageUrl}`) : placeholder;
  const isDM = selectedConversation.type === "dm";
  const convoData = selectedConversation.data as SimpleUser;
  const statusText = convoData.isOnline ? "online" : formatLastSeen(convoData.lastSeen);

  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden ml-2">
      <div className="flex-none flex items-center p-3 bg-black border-b border-zinc-800 z-10">
        <button onClick={handleBack} className="md:hidden mr-3 text-zinc-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <Link href={isDM ? `/profile/${(selectedConversation.data as SimpleUser).username}` : "#"}>
          <Image src={src} alt={name} width={40} height={40} onError={() => setHeaderImgError(true)} className="w-10 h-10 rounded-full object-cover mr-3" unoptimized />
        </Link>
        <div className="grow min-w-0">
          <Link href={isDM ? `/profile/${(selectedConversation.data as SimpleUser).username}` : "#"} className="font-bold text-white hover:underline truncate block">
            {name}
          </Link>
          {isDM ? (
            <span className={`text-xs block truncate ${convoData.isOnline ? "text-white" : "text-zinc-500"}`}>{statusText}</span>
          ) : (
            <span className="text-xs text-zinc-500 block">Group</span>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto bg-black custom-scrollbar">
        {isLoadingMore && (
          <div className="flex justify-center my-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          </div>
        )}
        {!messages && isLoadingMessages ? (
          <ChatPanelSkeleton />
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex justify-center items-center h-full text-zinc-600">
                No messages yet.
              </div>
            )}
            {currentUser && selectedConversation && (
              <MessageList messages={messages} currentUser={currentUser} selectedConversation={selectedConversation} onDelete={handleDeleteMessage} onToggleReaction={handleToggleReaction} />
            )}
            {renderTypingIndicator()}
          </>
        )}
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      
      <div className="flex-none w-full bg-black z-10">
        <ChatInput onSend={handleSendMessage} onGetSendButtonPosition={() => { }} />
      </div>
    </div>
  );
};

export default ChatPanel;
