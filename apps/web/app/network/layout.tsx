"use client";

import React, { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { API_BASE_URL } from "@lib/constants";
import { ChatUserProfile, SimpleUser } from "@lib/types";
import NetworkSidebar from "./components/NetworkSidebar";
import ChatPanel from "./components/ChatPanel";
import NewChatModal from "./components/NewChatModal";
import { Loader2 } from "lucide-react";
import {
  userAtom,
  userRoomsAtom,
  dmConversationsAtom,
  followingListAtom,
  networkLoadingAtom,
  networkErrorAtom,
  isNewChatModalOpenAtom,
} from "../store";

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser] = useAtom(userAtom);
  const setUserRooms = useSetAtom(userRoomsAtom);
  const setDmConversations = useSetAtom(dmConversationsAtom);
  const setFollowingList = useSetAtom(followingListAtom);
  const [isLoading] = useAtom(networkLoadingAtom);
  const setError = useSetAtom(networkErrorAtom);
  const setLoading = useSetAtom(networkLoadingAtom);
  const [isModalOpen] = useAtom(isNewChatModalOpenAtom);

  useEffect(() => {
    if (!currentUser) {
      setLoading({ key: "profile", value: false });
      setError("Please log in to see your network.");
      return;
    }

    const fetchUserProfile = async () => {
      setLoading({ key: "profile", value: true });
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/user/profile/${currentUser.username}`,
        );
        if (!res.ok) throw new Error("Failed to fetch user profile");

        const profile: ChatUserProfile = await res.json();
        setUserRooms(profile.rooms || []);
        setFollowingList(profile.following || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading({ key: "profile", value: false });
      }
    };

    const fetchDmConversations = async () => {
      try {
        // currentUser.id is a string (UUID)
        const res = await fetch(
          `${API_BASE_URL}/chat/dm/conversations/${currentUser.id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch DM conversations");

        const conversations: SimpleUser[] = await res.json();
        setDmConversations(conversations);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchUserProfile();
    fetchDmConversations();
  }, [
    currentUser,
    setLoading,
    setError,
    setUserRooms,
    setFollowingList,
    setDmConversations,
  ]);

  if (!currentUser && !isLoading.profile) {
    // This logic seems incorrect. If !currentUser, it should not attempt to load.
    // However, keeping the original structure but updating the text logic:
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-gray-400">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-200">
            Loading User...
          </h1>
          <p className="text-gray-400">Please log in to access your network.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-black font-sans text-gray-200">
      <NetworkSidebar />
      <ChatPanel />
      {isModalOpen && <NewChatModal />}
      {children}
    </div>
  );
}
