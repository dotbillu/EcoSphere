"use client";

import React, { useEffect, use } from "react";
import { useAtom } from "jotai";
import {
  selectedConversationAtom,
  userRoomsAtom,
  dmConversationsAtom,
  networkLoadingAtom,
} from "../../store";
import { ChatMapRoom, SimpleUser } from "@lib/types";

// The 'params' prop is now a Promise
export default function NetworkChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the promise at the top level of the component
  const unwrappedParams = use(params);

  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom,
  );
  const [userRooms] = useAtom(userRoomsAtom);
  const [dmConversations] = useAtom(dmConversationsAtom);
  const [loading] = useAtom(networkLoadingAtom);

  useEffect(() => {
    if (loading.profile || !userRooms || !dmConversations) {
      return;
    }

    // conversationId is ALREADY a string (UUID) from the route parameter
    const conversationId = unwrappedParams.id;
    // REMOVED: parseInt(conversationId, 10) and isNaN check

    // The ID comparison is now straight string comparison
    if (selectedConversation?.data.id === conversationId) {
      return;
    }

    let foundConvo: any = null;
    let foundType: "room" | "dm" | null = null;

    // Compare string IDs
    const room = userRooms.find((r: ChatMapRoom) => r.id === conversationId);
    if (room) {
      foundConvo = room;
      foundType = "room";
    } else {
      // Compare string IDs
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
    } else {
      console.warn(`Conversation with ID ${conversationId} not found.`);
      setSelectedConversation(null);
    }
  }, [
    unwrappedParams.id,
    userRooms,
    dmConversations,
    loading.profile,
    setSelectedConversation,
    selectedConversation,
  ]);

  return null;
}
