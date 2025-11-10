import { MapRoom, UserProfile } from "../store";

export interface SimpleUser {
  id: number;
  username: string;
  name: string;
  image: string | null;
  // New fields for real data
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
}

export interface Reaction {
  id: number;
  emoji: string;
  user: SimpleUser;
}

export type ChatMapRoom = Omit<MapRoom, "latitude" | "longitude"> & {
  // New fields for real data
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
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
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  sender: SimpleUser;
  roomId: number;
  reactions: Reaction[];
}

export interface DirectMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  sender: SimpleUser;
  recipientId: number;
  reactions: Reaction[];
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
