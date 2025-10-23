import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");
interface LocationState {
  lat: number | null;
  lng: number | null;
}

// Create an atom to store the user's coordinates
export const locationAtom = atom<LocationState>({ lat: null, lng: null });

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  image?: string | null;
  createdAt: string;
}

// Atom to hold the logged-in user
export const userAtom = atomWithStorage<User | null>("user", null);
