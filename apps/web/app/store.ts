import { atom } from "jotai";

export type PageName = "House" | "Map" | "Search" | "Network" | "Settings";
export const CurrentPageAtom = atom<PageName>("House");
