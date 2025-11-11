import { Gig, MapRoom } from "@/store";

// Extended types for use within the map components
export interface MapElement extends MapRoom {
  creatorId?: string;
}
export interface GigElement extends Gig {
  creatorId?: string;
}
