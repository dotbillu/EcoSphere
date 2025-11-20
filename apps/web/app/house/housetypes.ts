import {
  type Post,
  type UserProfile,
  type Gig,
  type MapRoom,
  type Following,
} from "@/store"; 

export type { Post, UserProfile, Gig, MapRoom, Following };

export interface FilterState {
  posts: boolean;
  gigs: boolean;
  rooms: boolean;
}

export interface ActivityItemPost {
  type: "post";
  data: Post;
}

export interface ActivityItemGig {
  type: "gig";
  data: Gig & {
    description: string;
    createdBy: UserProfile;
    createdAt: string;
    imageUrls: string[];
  }; 
}

export interface ActivityItemRoom {
  type: "room";
  data: MapRoom & {
    name: string;
    description: string;
    createdBy: UserProfile;
    createdAt: string;
    imageUrl?: string;
    type?: string;
  };
}

export type ActivityItem = ActivityItemPost | ActivityItemGig | ActivityItemRoom;

export interface FeedPage {
  items: ActivityItem[];
  hasNextPage: boolean;
}

export interface PostEntryProps {
  post: Post;
  currentUserId: string;
  onLikeToggle: (postId: string) => void;
  onNavigate: (postId: string) => void;
  onPrefetchProfile: (username: string) => void;
  onPrefetchPost: (postId: string) => void;
  loggedInUser?: UserProfile;
  followingList?: Following[];
  onFollowToggle?: (username: string) => void;
}
