"use client";

import { useAtom } from "jotai";
import { selectedConversationAtom } from "../store";
import NetworkSidebar from "./components/NetworkSidebar";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useSetAtom } from "jotai";

export default function NetworkPage() {
  const setSelectedConversation = useSetAtom(selectedConversationAtom);

  useEffect(() => {
    // Ensure no conversation is selected when on the root network page
    setSelectedConversation(null);
  }, [setSelectedConversation]);

  return (
    <div className="h-full w-full flex">
      {/* Mobile: Show Sidebar */}
      <div className="flex md:hidden w-full h-full">
        <NetworkSidebar />
      </div>

      {/* Desktop: Show Placeholder */}
      <div className="hidden md:flex w-full h-full items-center justify-center bg-black text-zinc-500">
        <div className="flex flex-col items-center">
          <MessageSquare size={80} className="mb-4 text-zinc-700" />
          <p className="text-lg font-medium text-zinc-400">Select a chat to start messaging</p>
        </div>
      </div>
    </div>
  );
}
