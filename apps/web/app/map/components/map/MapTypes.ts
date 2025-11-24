import { Gig, MapRoom, SimpleUser } from "@/lib/types";

export interface MapElement extends Omit<MapRoom, "members" | "createdBy"> {
  id: string;
  creatorId?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  members?: SimpleUser[];
}

export interface GigElement extends Omit<Gig, "createdBy"> {
  id: string;
  creatorId?: string;
  createdBy?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  room?: {
    id: string;
    name: string;
    type: string;
  } | null;
  reward?: string | null;
  expiresAt?: string | null;
}
