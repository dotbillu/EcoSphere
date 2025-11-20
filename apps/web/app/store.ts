import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  SelectedConversation,
  ChatMapRoom,
  SimpleUser,
  MessageType,
} from "./lib/types";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");

interface LocationState {
  lat: number | null;
  lng: number | null;
}

export const locationAtom = atom<LocationState>({ lat: null, lng: null });

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  image?: string | null;
  createdAt: string;
}

export const userAtom = atomWithStorage<User | null>("user", null);

export interface Following {
  id: number;
  username: string;
  name: string;
  image: string | null;
}

export interface Post {
  id: number;
  username: string;
  name?: string;
  content: string;
  createdAt: string;
  imageUrls: string[];
  location?: string;
  user?: { image?: string; id?: number };
  likes: { userId: number }[];
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Gig {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  date: string | null;
  imageUrls: string[];
  type: string | null;
}

export interface MapRoom {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  type: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  image: string | null;
  posterImage: string | null;
  createdAt: string;
  posts: Post[];
  gigs: Gig[];
  rooms: MapRoom[];
  mapRooms: MapRoom[];
  followers: Following[];
  following: Following[];
}

export const followingListAtom = atomWithStorage<Following[]>(
  "followingList",
  [],
);

export const toggleFollowAtom = atom(null, (get, set, username: string) => {
  const user = get(userAtom);
  if (!user) return;

  const currentList = get(followingListAtom);
  const isFollowing = currentList.some((u) => u.username === username);

  if (isFollowing) {
    set(
      followingListAtom,
      currentList.filter((u) => u.username !== username),
    );
  } else {
    set(followingListAtom, [
      ...currentList,
      { id: Math.random(), username: username, name: username, image: null },
    ]);
  }

  console.log(`Calling API to toggle follow for: ${username}`);
});

export const likePostAtom = atom(null, (get, set, postId: number) => {
  const user = get(userAtom);
  if (!user) return;

  console.log(`Calling API to like post: ${postId}`);
});

// --- NEW ATOMS FOR NETWORK PAGE ---

export const selectedConversationAtom = atom<SelectedConversation>(null);
export const userRoomsAtom = atom<ChatMapRoom[]>([]);
export const dmConversationsAtom = atom<SimpleUser[]>([]);
export const messagesAtom = atom<MessageType[]>([]);

export const networkLoadingAtom = atom(
  (get) => ({
    profile: get(profileLoadingAtom),
    messages: get(messagesLoadingAtom),
  }),
  (get, set, update: { key: "profile" | "messages"; value: boolean }) => {
    if (update.key === "profile") {
      set(profileLoadingAtom, update.value);
    } else {
      set(messagesLoadingAtom, update.value);
    }
  },
);
const profileLoadingAtom = atom<boolean>(true);
const messagesLoadingAtom = atom<boolean>(false);

export const networkErrorAtom = atom<string | null>(null);
export const isNewChatModalOpenAtom = atom<boolean>(false);

export type NetworkFilter = "all" | "rooms" | "dms";
export const networkFilterAtom = atom<NetworkFilter>("all");


export const sidebarTransitionLoadingAtom = atom(false);
