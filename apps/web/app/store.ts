import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  User,
  Following,
  SelectedConversation,
  ChatMapRoom,
  SimpleUser,
  MessageType,
} from "@/lib/types";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");

interface LocationState {
  lat: number | null;
  lng: number | null;
}

export const locationAtom = atom<LocationState>({ lat: null, lng: null });

export const userAtom = atomWithStorage<User | null>("user", null);

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
      {
        id:
          typeof crypto !== "undefined"
            ? crypto.randomUUID()
            : Date.now().toString(),
        username: username,
        name: username,
        image: null,
      },
    ]);
  }
});

export const likePostAtom = atom(null, (get, set, postId: number) => {
  const user = get(userAtom);
  if (!user) return;
});

export const selectedConversationAtom = atom<SelectedConversation>(null);
export const userRoomsAtom = atom<ChatMapRoom[]>([]);
export const dmConversationsAtom = atom<SimpleUser[]>([]);
export const messagesAtom = atom<MessageType[]>([]);

const profileLoadingAtom = atom<boolean>(true);
const messagesLoadingAtom = atom<boolean>(false);

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

export const networkErrorAtom = atom<string | null>(null);
export const isNewChatModalOpenAtom = atom<boolean>(false);

export type NetworkFilter = "all" | "rooms" | "dms";
export const networkFilterAtom = atom<NetworkFilter>("all");

export const sidebarTransitionLoadingAtom = atom(false);
