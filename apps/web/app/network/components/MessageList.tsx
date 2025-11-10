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

interface TempAnimatedMessage {
  id: string;
  content: string;
  initialX: number;
  initialY: number;
  finalY: number;
}

interface MessageListProps {
  messages: MessageType[];
  currentUser: SimpleUser;
  selectedConversation: NonNullable<SelectedConversation>;
  onDelete: (messageId: number | string) => void;
  onToggleReaction: (messageId: number | string, emoji: string) => void; // ADDED PROP: state of the floating message
  tempAnimatedMessage: TempAnimatedMessage | null;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  selectedConversation,
  onDelete,
  onToggleReaction,
  tempAnimatedMessage, // <-- DESTRUCTURE NEW PROP
}) => {
  let lastDateString: string | null = null;
  let lastMessageTimestamp: Date | null = null;
  let lastSenderId: number | null = null;

  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds

  return (
    <div className="space-y-0">
           {" "}
      {messages.map((msg) => {
        const messageDate = new Date(msg.createdAt);
        const messageDateString = formatDate(messageDate);
        let showDateHeader = false;
        if (messageDateString !== lastDateString) {
          showDateHeader = true;
          lastDateString = messageDateString;
        }

        let spacing: "small" | "large" = "large";
        if (
          !showDateHeader && // Not the first message of the day
          lastMessageTimestamp && // We have a previous message
          msg.senderId === lastSenderId && // Same sender
          messageDate.getTime() - lastMessageTimestamp.getTime() < FIVE_MINUTES
        ) {
          // Within 5 minutes
          spacing = "small";
        }

        lastMessageTimestamp = messageDate;
        lastSenderId = msg.senderId; // Create an array to hold the elements to render for this message

        const elements = [];

        if (showDateHeader) {
          // DateHeader is rendered only if the date changes
          elements.push(
            <DateHeader
              key={`date-${messageDateString}`}
              date={messageDateString}
            />,
          );
        } // MessageBubble is rendered for every message

        elements.push(
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderId === currentUser.id}
            isGroup={selectedConversation.type === "room"}
            onDelete={onDelete}
            onToggleReaction={onToggleReaction}
            spacing={spacing}
          />,
        ); // Return the array of elements (DateHeader and/or MessageBubble)

        return elements;
      })}
           {" "}
      {/* NEW: Placeholder to reserve space for the message being animated */} 
         {" "}
      {tempAnimatedMessage && (
        <div
          className={`
            flex group justify-end 
            ${lastSenderId === currentUser.id ? "mt-2" : "mt-6"}
            **h-10 opacity-0** // Set a reasonable height and hide it
          `}
          id={`message-${tempAnimatedMessage.id}`}
        >
                    <div className="w-8 h-8 flex-shrink-0" />{" "}
          {/* Avatar space (for consistent alignment) */}         {" "}
          <div className="px-3 py-2 rounded-2xl max-w-xs md:max-w-md lg:max-w-lg">
                        {/* Content space (empty) */}         {" "}
          </div>
                 {" "}
        </div>
      )}
         {" "}
    </div>
  );
};

export default MessageList;
