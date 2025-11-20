"use client";

import React, { useEffect, use } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  selectedConversationAtom,
  userRoomsAtom,
  dmConversationsAtom,
  networkLoadingAtom,
} from "@/store"; // Fixed import path
import ChatPanel from "../components/ChatPanel";
import { ChatMapRoom, SimpleUser } from "@lib/types"; // Fixed import path

export default function NetworkChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const conversationId = unwrappedParams.id;

  const [selectedConversation, setSelectedConversation] = useAtom(selectedConversationAtom);
  const [userRooms] = useAtom(userRoomsAtom);
  const [dmConversations] = useAtom(dmConversationsAtom);
  const [loading] = useAtom(networkLoadingAtom);

  useEffect(() => {
    // Wait for profile to load
    if (loading.profile) return;
    
    // Avoid redundant updates
    if (selectedConversation?.data.id === conversationId) return;

    // Logic to find conversation in User's Lists
    let foundConvo: any = null;
    let foundType: "room" | "dm" | null = null;

    if (userRooms) {
        const room = userRooms.find((r: ChatMapRoom) => r.id === conversationId);
        if (room) {
            foundConvo = room;
            foundType = "room";
        }
    }

    if (!foundConvo && dmConversations) {
        const dm = dmConversations.find((d: SimpleUser) => d.id === conversationId);
        if (dm) {
            foundConvo = dm;
            foundType = "dm";
        }
    }

    if (foundConvo && foundType) {
      setSelectedConversation({
        type: foundType,
        data: foundConvo,
      });
    }
  }, [
    conversationId,
    userRooms,
    dmConversations,
    loading.profile,
    selectedConversation,
    setSelectedConversation,
  ]);

  // On this route, we just render the ChatPanel. 
  // The Layout handles the Desktop Sidebar.
  // On Mobile, this takes up the full screen.
  return <ChatPanel />;
}
