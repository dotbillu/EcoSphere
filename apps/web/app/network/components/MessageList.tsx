"use client";

import React from "react";
import { MessageType, SimpleUser, SelectedConversation } from "@lib/types";
import MessageBubble from "./MessageBubble";
import DateHeader from "../ui/DateHeader";

// Helper function to format dates
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

  if (targetDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface MessageListProps {
  messages: MessageType[];
  currentUser: SimpleUser;
  selectedConversation: NonNullable<SelectedConversation>;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  selectedConversation,
  onDelete,
  onToggleReaction,
}) => {
  let lastDateString: string | null = null;
  let lastMessageTimestamp: Date | null = null;
  let lastSenderId: string | null = null; // CHANGED: from number to string | null

  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

  return (
    <div className="space-y-0">
      {messages.map((msg) => {
        const messageDate = new Date(msg.createdAt);
        const messageDateString = formatDate(messageDate);
        let showDateHeader = false;
        
        // Logic to determine if a date header is needed
        if (messageDateString !== lastDateString) {
          showDateHeader = true;
          lastDateString = messageDateString;
        }

        let spacing: "small" | "large" = "large";
        
        // Logic to determine tight or large spacing
        if (
          !showDateHeader && 
          lastMessageTimestamp && 
          msg.senderId === lastSenderId && // Compare string IDs
          messageDate.getTime() - lastMessageTimestamp.getTime() < FIVE_MINUTES
        ) {
          spacing = "small";
        }

        lastMessageTimestamp = messageDate;
        lastSenderId = msg.senderId;

        const elements = [];

        if (showDateHeader) {
          elements.push(
            <DateHeader
              key={`date-${messageDateString}`}
              date={messageDateString}
            />,
          );
        }

        elements.push(
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderId === currentUser.id} // Compare string IDs
            isGroup={selectedConversation.type === "room"}
            onDelete={onDelete}
            onToggleReaction={onToggleReaction}
            spacing={spacing}
          />,
        );
        
        // Ensure keys are unique across the elements array
        return elements;
      })}
    </div>
  );
};

export default MessageList;
