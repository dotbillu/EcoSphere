import { Gig, MapRoom } from "@/store";
import { SimpleUser } from "@lib/types";

export interface MapElement extends Omit<MapRoom, "members"> {
  id: string;
  creatorId?: string;
  createdBy?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  members?: SimpleUser[];
}

export interface GigElement extends Gig {
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
}
