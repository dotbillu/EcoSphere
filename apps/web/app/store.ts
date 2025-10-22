import { atom } from "jotai";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");
interface LocationState {
  lat: number | null;
  lng: number | null;
}

// Create an atom to store the user's coordinates
export const locationAtom = atom<LocationState>({ lat: null, lng: null });
