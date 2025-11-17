"use client";

import React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  selectedConversationAtom,
  userRoomsAtom,
  dmConversationsAtom,
} from "@/store";
import { ChatMapRoom, SimpleUser } from "@lib/types";
import ConversationItem from "./ConversationItem";
import { useRouter } from "next/navigation";

type ConversationItemType = (ChatMapRoom | SimpleUser) & { type: "room" | "dm" };

interface ConversationListProps {
  items: ConversationItemType[];
  searchTerm: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  items,
  searchTerm,
}) => {
  const [selectedConversation, setSelectedConversation] = useAtom(
    selectedConversationAtom
  );
  const setUserRooms = useSetAtom(userRoomsAtom);
  const setDmConversations = useSetAtom(dmConversationsAtom);
  const router = useRouter();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: ConversationItemType) => {
    const data = { type: item.type, data: item as any };

    if (item.unseenCount && item.unseenCount > 0) {
      const setter =
        item.type === "room" ? setUserRooms : setDmConversations;
      setter((prev: any) =>
        prev.map((i: any) =>
          i.id === item.id ? { ...i, unseenCount: 0 } : i
        )
      );
    }

    if (
      selectedConversation?.type === item.type &&
      selectedConversation?.data.id === item.id
    ) {
      router.push(`/network/${item.id}`);
      return;
    }
    setSelectedConversation(data);
    router.push(`/network/${item.id}`);
  };

  if (filteredItems.length === 0 && searchTerm) {
    return (
      <div className="p-4 text-center text-zinc-400">No results found.</div>
    );
  }

  return (
    <nav className="px-4 rounded-2xl">
      {filteredItems.map((item) => (
        <ConversationItem
          key={item.id}
          item={item}
          type={item.type}
          isSelected={item.id === selectedConversation?.data.id}
          onClick={() => handleSelect(item)}
        />
      ))}
    </nav>
  );
};

export default ConversationList;
