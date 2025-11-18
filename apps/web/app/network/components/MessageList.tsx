"use client";

import React from "react";
import { MessageType, SimpleUser, SelectedConversation } from "@lib/types";
import MessageBubble from "./MessageBubble";
import DateHeader from "../ui/DateHeader";

const formatDate = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (targetDate.getTime() === today.getTime()) return "Today";
  if (targetDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

interface MessageListProps {
  messages: MessageType[];
  currentUser: SimpleUser;
  selectedConversation: NonNullable<SelectedConversation>;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
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
        const messageDate = new Date(msg.createdAt);
        const messageDateString = formatDate(messageDate);
        let showDateHeader = false;
        
        if (messageDateString !== lastDateString) {
          showDateHeader = true;
          lastDateString = messageDateString;
        }

        let spacing: "small" | "large" = "large";
        if (!showDateHeader && lastMessageTimestamp && msg.senderId === lastSenderId && messageDate.getTime() - lastMessageTimestamp.getTime() < FIVE_MINUTES) {
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
});

MessageList.displayName = 'MessageList';
export default MessageList;
