import { MapRoom, UserProfile } from "@/store";

export interface SimpleUser {
  id: string;
  username: string;
  name: string;
  image: string | null;
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unseenCount?: number;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: SimpleUser;
}

export type ChatMapRoom = Omit<MapRoom, "latitude" | "longitude"> & {
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unseenCount?: number;
  isOnline?: boolean;
  lastSeen?: string | null;
};

export type ChatUserProfile = Omit<
  UserProfile,
  | "email"
  | "posterImage"
  | "createdAt"
  | "posts"
  | "gigs"
  | "mapRooms"
  | "followers"
> & {
  rooms: ChatMapRoom[];
  following: SimpleUser[];
};

export interface GroupMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: SimpleUser;
  roomId: string;
  reactions: Reaction[];
  isOptimistic?: boolean;
}

export interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: SimpleUser;
  recipientId: string;
  reactions: Reaction[];
  isOptimistic?: boolean;
  isRead?: boolean;
}
export interface ConversationItem {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  updatedAt?: string;
}

export type MessageType = GroupMessage | DirectMessage;

export type SelectedConversation =
  | {
      type: "room";
      data: ChatMapRoom;
    }
  | {
      type: "dm";
      data: SimpleUser;
    }
  | null;

// --- ADD/UPDATE THESE TYPES in @lib/types.ts ---

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  image: string | null;
  posterImage?: string | null;
}

export interface SearchPost {
  id: string;
  content: string;
  user: { username: string };
}

export interface SearchGig {
  id: string;
  title: string;
  description?: string | null;
  createdBy: { username: string };
  imageUrls: string[]; // <-- ADDED THIS
}

export interface SearchRoom {
  id: string;
  name: string;
  description?: string | null;
  createdBy: { username: string };
  imageUrl: string | null; // <-- ADDED THIS
}

export type SearchResult =
  | { type: "user"; data: SearchUser }
  | { type: "post"; data: SearchPost }
  | { type: "gig"; data: SearchGig }
  | { type: "room"; data: SearchRoom };
