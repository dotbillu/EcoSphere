"use client";

import { useAtom, useSetAtom } from "jotai";
import { selectedConversationAtom } from "@/store"; // Fixed import path
import NetworkSidebar from "./components/NetworkSidebar";

import { MessageSquare } from "lucide-react";
import { useEffect } from "react";

export default function NetworkPage() {
  const setSelectedConversation = useSetAtom(selectedConversationAtom);

  useEffect(() => {
    // Clear selected conversation when user navigates to root /network
    setSelectedConversation(null);
  }, [setSelectedConversation]);

  return (
    <div className="h-full w-full flex bg-black">
      {/* Mobile: Show Sidebar here since Layout hides it on mobile */}
      <div className="flex md:hidden w-full h-full">
        <NetworkSidebar />
      </div>

      {/* Desktop: Show Placeholder */}
      <div className="hidden md:flex w-full h-full items-center justify-center bg-black text-zinc-500 border-l border-zinc-800">
        <div className="flex flex-col items-center">
          <MessageSquare size={80} className="mb-4 text-zinc-700" />
          <p className="text-lg font-medium text-zinc-400">Select a chat to start messaging</p>
        </div>
      </div>
    </div>
  );
}
