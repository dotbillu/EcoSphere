import { atom } from "jotai";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");
