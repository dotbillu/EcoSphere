import { Gig, MapRoom } from "../../../store";

// Extended types for use within the map components
export interface MapElement extends MapRoom {
  creatorId?: number;
}
export interface GigElement extends Gig {
  creatorId?: number;
}
