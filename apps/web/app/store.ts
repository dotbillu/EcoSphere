// src/store.ts

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type PageName = "House" | "Map" | "Search" | "Network" | "Activity";
export const CurrentPageAtom = atom<PageName>("House");

interface LocationState {
  lat: number | null;
  lng: number | null;
}

export const locationAtom = atom<LocationState>({ lat: null, lng: null });

// --- Base User Atom ---
// This stores the basic info of the *logged-in* user
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  image?: string | null;
  createdAt: string;
  // Note: We remove posts, gigs, etc. from here
  // as they will be fetched in the full UserProfile
}

export const userAtom = atomWithStorage<User | null>("user", null);

// --- Full Profile Data Types ---
// These interfaces match your new backend response

export interface Post {
  id: number;
  username: string;
  name: string;
  content: string;
  imageUrls: string[];
  location?: string;
  createdAt: string;
}

export interface Gig {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  date: string | null; // Dates come as strings from JSON
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

// This is the main interface for the profile page
export interface UserProfile extends User {
  posts: Post[];
  gigs: Gig[];
  rooms: MapRoom[]; // Rooms user has joined
  mapRooms: MapRoom[]; // Rooms user has created
}
