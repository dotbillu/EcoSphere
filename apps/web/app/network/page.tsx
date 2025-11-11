"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { selectedConversationAtom } from "../store"; // Path: ../store

export default function NetworkBasePage() {
  const setSelectedConversation = useSetAtom(selectedConversationAtom);

  useEffect(() => {
    // When at /network, ensure no conversation is selected
    setSelectedConversation(null);
  }, [setSelectedConversation]);

  // The layout.tsx renders all the UI. This page just runs logic.
  return null;
}
