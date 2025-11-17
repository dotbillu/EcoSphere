"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { socketAtom } from "../layout";
import { selectedConversationAtom, userAtom } from "@/store";

const INITIAL_WIDTH = 900;
const MAX_WIDTH_PERCENTAGE = 0.9;
const PADDING_AND_BUTTONS = 100;

const TEXTAREA_CLASS = `
  bg-transparent border-none resize-none 
  text-white placeholder:text-gray-500 focus:outline-none focus:ring-0
  max-h-60 overflow-y-auto px-2 py-2
  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
`;

interface ChatInputProps {
  onSend: (content: string) => void;
  onGetSendButtonPosition: (buttonElement: HTMLButtonElement) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onGetSendButtonPosition,
}) => {
  const [content, setContent] = useState("");
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [dynamicWidth, setDynamicWidth] = useState(INITIAL_WIDTH);

  const [socket] = useAtom(socketAtom);
  const [currentUser] = useAtom(userAtom);
  const [selectedConversation] = useAtom(selectedConversationAtom);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const widthMeasureRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const isEnabled = content.trim() !== "";

  const emitStopTyping = () => {
    if (!socket || !selectedConversation) return;
    socket.emit("typing:stop", {
      conversationId: selectedConversation.data.id,
      isGroup: selectedConversation.type === "room",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnabled) return;

    if (sendButtonRef.current) {
      onGetSendButtonPosition(sendButtonRef.current);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitStopTyping();
    onSend(content);
    setContent("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (!socket || !selectedConversation || !currentUser) return;

    if (!typingTimeoutRef.current) {
      socket.emit("typing:start", {
        conversationId: selectedConversation.data.id,
        isGroup: selectedConversation.type === "room",
        senderName: currentUser.name || currentUser.username,
      });
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current && formRef.current && widthMeasureRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      const parentWidth = formRef.current.clientWidth - 32;
      const maxWidth = parentWidth * MAX_WIDTH_PERCENTAGE;

      const textWidth = widthMeasureRef.current.scrollWidth;

      const buttonSpace = isEnabled
        ? PADDING_AND_BUTTONS
        : PADDING_AND_BUTTONS - 40;
      const newDynamicWidth = textWidth + buttonSpace;

      let targetWidth = Math.max(INITIAL_WIDTH, newDynamicWidth);
      targetWidth = Math.min(targetWidth, maxWidth);

      setDynamicWidth(targetWidth);
    }

    if (content === "") {
      setDynamicWidth(INITIAL_WIDTH);
    }
  }, [content, isEnabled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formRef]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-4 relative">
      <div
        ref={widthMeasureRef}
        className={`${TEXTAREA_CLASS} absolute left-[-9999px] z-[-1] visibility-hidden whitespace-pre w-auto`}
      >
        {content || "Type a message..."}
      </div>
      {isEmojiPickerOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="dark"
            lazyLoadEmojis={true}
            height={400}
            width={350}
          />
        </div>
      )}

      <div className="flex justify-center">
        <motion.div
          layout
          animate={{ width: dynamicWidth }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="flex items-end gap-2 bg-zinc-900 rounded-4xl p-2"
        >
          <button
            type="button"
            className="flex-shrink-0 w-10 h-10 mb-1 rounded-full text-gray-400 hover:text-gray-200 flex items-center justify-center transition-colors"
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
          >
            <Smile size={20} />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            className={`flex-grow mb-1 w-full ${TEXTAREA_CLASS}`}
          />

          <AnimatePresence>
            {isEnabled && (
              <motion.button
                ref={sendButtonRef}
                layout
                initial={{ opacity: 0, scale: 0.7, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "2.5rem" }}
                exit={{ opacity: 0, scale: 0.7, width: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                type="submit"
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
                                 transition-colors duration-200 ease-out
                                 bg-indigo-600 hover:bg-indigo-700 text-white
                                 mb-1`}
              >
                <SendHorizontal size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </form>
  );
};

export default ChatInput;
