"use client";

import React from "react";
import { useAtom } from "jotai";
import { selectedConversationAtom } from "@/store";
import { ChatMapRoom, SimpleUser } from "@lib/types";
import ConversationItem from "./ConversationItem";
import { useRouter } from "next/navigation";

interface ConversationListProps {
  items: (ChatMapRoom | SimpleUser)[];
  type: "room" | "dm";
  searchTerm: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  items,
  type,
  searchTerm,
}) => {
  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom
  );
  const router = useRouter();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: ChatMapRoom | SimpleUser) => {
    const data = { type, data: item as any };
    if (
      selectedConversation?.type === type &&
      selectedConversation?.data.id === item.id
    ) {
      router.push(`/network/${item.id}`); // <-- Corrected path
      return;
    }
    setSelectedConversation(data);
    
    router.push(`/network/${item.id}`); // <-- Corrected path
  };

  if (filteredItems.length === 0 && searchTerm) {
    return (
      <div className="p-4 text-center text-black">No results found.</div>
    );
  }

  if (filteredItems.length === 0 && !searchTerm) {
    return null;
  }

  return (
    <nav className="px-4 rounded-2xl">
      {filteredItems.map((item) => (
        <ConversationItem
          key={item.id}
          item={item}
          type={type}
          isSelected={item.id === selectedConversation?.data.id}
          onClick={() => handleSelect(item)}
        />
      ))}
    </nav>
  );
};

export default ConversationList;
