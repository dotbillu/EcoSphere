import { MapRoom, UserProfile } from "../store";

export interface SimpleUser {
  id: string; // CHANGED: from number to string (UUID)
  username: string;
  name: string;
  image: string | null;
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
}

export interface Reaction {
  id: string; // CHANGED: from number to string (UUID)
  emoji: string;
  user: SimpleUser;
}

export type ChatMapRoom = Omit<MapRoom, "latitude" | "longitude"> & {
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
  id: string; // CHANGED: from number to string (UUID)
  content: string;
  createdAt: string;
  senderId: string; // CHANGED: from number to string (UUID)
  sender: SimpleUser;
  roomId: string; // CHANGED: from number to string (UUID)
  reactions: Reaction[];
}

export interface DirectMessage {
  id: string; // CHANGED: from number to string (UUID)
  content: string;
  createdAt: string;
  senderId: string; // CHANGED: from number to string (UUID)
  sender: SimpleUser;
  recipientId: string; // CHANGED: from number to string (UUID)
  reactions: Reaction[];
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
