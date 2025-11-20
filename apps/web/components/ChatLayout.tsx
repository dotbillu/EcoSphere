"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedConversationAtom } from "@/store";
import { useRouter } from "next/navigation";
import NetworkSidebar from "./NetworkSidebar";
import ChatPanel from "./ChatPanel";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    if (media.addEventListener) media.addEventListener("change", listener);
    else media.addListener(listener);

    return () => {
      if (media.removeEventListener) media.removeEventListener("change", listener);
      else media.removeListener(listener);
    };
  }, [query, matches]);
  return matches;
};

export default function ChatLayout() {
  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom
  );
  // Removed: [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const isMobile = useMediaQuery("(max-width: 800px)");
  const router = useRouter();

  const handleBackToSidebar = () => {
    setSelectedConversation(null);
    router.push("/network");
    // Removed: setIsSidebarVisible(true);
  };

  // Determine what ID to pass to the sidebar (it's a string/UUID)
  const selectedId = selectedConversation?.data.id || null;

  // Render logic simplified based on selectedId and mobile state
  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* 1. Sidebar is visible if it's not mobile OR if it's mobile and no conversation is selected */}
      {(!isMobile || !selectedConversation) && (
        <NetworkSidebar
          selectedId={selectedId} // selectedId is a string (UUID)
        />
      )}

      {/* 2. Chat Panel (Visible only if a conversation is selected) */}
      {selectedConversation ? (
        // On desktop, ChatPanel is always visible. On mobile, it hides the sidebar.
        <ChatPanel
          isMobile={isMobile}
          onBack={isMobile ? handleBackToSidebar : undefined}
        />
      ) : (
        // 3. Placeholder (Visible only if no conversation is selected AND on desktop or sidebar is visible on mobile)
        !isMobile && (
          <div className="flex-grow flex items-center justify-center text-zinc-500 border-l border-zinc-800 w-full md:w-auto">
            Select a conversation to start chatting.
          </div>
        )
      )}
    </div>
  );
}
