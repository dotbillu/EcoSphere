"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Filter } from "lucide-react";
import { useAtom } from "jotai";
import { userAtom, type Post, type UserProfile } from "@/store";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";

// Components
import CreatePost from "./CreatePost";
import PostEntry from "./PostEntry";
import GigRoomEntry from "./GigRoomEntry";

// Types
import { FilterState, FeedPage, ActivityItem } from "../housetypes";

// -----------------------------------------------------------------------------
// API Helper Functions
// -----------------------------------------------------------------------------

const fetchGlobalActivity = async ({
  pageParam = 0,
  filters,
}: {
  pageParam: number;
  filters: FilterState;
}): Promise<FeedPage> => {
  const res = await fetch(
    `${API_BASE_URL}/global/feed?skip=${pageParam * 10}&take=10&posts=${filters.posts}&gigs=${filters.gigs}&rooms=${filters.rooms}`,
  );
  if (!res.ok) throw new Error("Failed to fetch global activity");
  return res.json();
};

const fetchNetworkActivity = async ({
  pageParam = 0,
  currentUserId,
  filters,
}: {
  pageParam: number;
  currentUserId: string;
  filters: FilterState;
}): Promise<FeedPage> => {
  if (!currentUserId) return { items: [], hasNextPage: false };

  const res = await fetch(
    `${API_BASE_URL}/feed/feed?userId=${currentUserId}&skip=${pageParam * 10}&take=10&posts=${filters.posts}&gigs=${filters.gigs}&rooms=${filters.rooms}`,
  );
  if (!res.ok) throw new Error("Failed to fetch network activity");
  return res.json();
};

const fetchPost = async (postId: string): Promise<Post> => {
  const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
};

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE_URL}/user/profile/${username}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

const toggleLike = async ({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUserId }),
  });
  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
};

const toggleFollow = async ({
  currentUserId,
  targetUsername,
}: {
  currentUserId: string;
  targetUsername: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/user/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUsername }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle follow");
  }
  return res.json();
};

// -----------------------------------------------------------------------------
// Sub-Components
// -----------------------------------------------------------------------------

const FilterToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label className="flex items-center space-x-2 cursor-pointer text-sm text-white hover:text-white-400 transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="form-checkbox h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-white-500 focus:ring-white-500"
    />
    <span>{label}</span>
  </label>
);

// -----------------------------------------------------------------------------
// Component: Feedbox
// -----------------------------------------------------------------------------

export default function Feedbox() {
  const [user] = useAtom(userAtom);
  const currentUserId = user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const observer = useRef<IntersectionObserver | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // State
  const [feedMode, setFeedMode] = useState<"global" | "network">("global");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    posts: true,
    gigs: true,
    rooms: true,
  });

  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFilterChange = (filterName: keyof FilterState) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: !prevFilters[filterName],
    }));
  };

  // Queries
  const { data: loggedInUserProfile } = useQuery<UserProfile>({
    queryKey: ["profile", user?.username],
    queryFn: () => fetchProfile(user!.username),
    enabled: !!user?.username,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: activityData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["activity", feedMode, currentUserId, filters],
    queryFn: ({ pageParam }) => {
      if (feedMode === "global") {
        return fetchGlobalActivity({ pageParam: pageParam as number, filters });
      } else {
        if (!currentUserId) return { items: [], hasNextPage: false };
        return fetchNetworkActivity({
          pageParam: pageParam as number,
          currentUserId: currentUserId,
          filters,
        });
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentPageIndex = allPages.length;
      return lastPage.hasNextPage ? currentPageIndex : undefined;
    },
    enabled:
      feedMode === "global" || (feedMode === "network" && !!currentUserId),
  });

  const feedItems = activityData?.pages.flatMap((page) => page.items) ?? [];

  // Mutations & Actions
  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ postId, currentUserId }) => {
      await queryClient.cancelQueries({ queryKey: ["activity"] });
      const queryKey = ["activity", feedMode, currentUserId, filters];
      const previousActivity = queryClient.getQueryData(queryKey);
      return { previousActivity, queryKey };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(context.queryKey, context.previousActivity);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: toggleFollow,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const handleLikeToggle = (postId: string) => {
    if (!currentUserId) return;
    const queryKey = ["activity", feedMode, currentUserId, filters];

    // Optimistic Update
    queryClient.setQueryData<any>(queryKey, (oldData) => {
      if (!oldData) return;
      return {
        ...oldData,
        pages: oldData.pages.map((page: FeedPage) => ({
          ...page,
          items: page.items.map((item) => {
            if (item.type === "post" && item.data.id === postId) {
              const post = item.data as Post;
              const isLiked = post.likes.some(
                (like: any) => like.userId === currentUserId,
              );
              const optimisticLikeEntry = {
                userId: currentUserId,
                postId: postId,
              };

              if (isLiked) {
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: post.likes.filter(
                      (like: any) => like.userId !== currentUserId,
                    ),
                    _count: { ...post._count, likes: post._count.likes - 1 },
                  },
                };
              } else {
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: [...post.likes, optimisticLikeEntry],
                    _count: { ...post._count, likes: post._count.likes + 1 },
                  },
                };
              }
            }
            return item;
          }),
        })),
      };
    });

    // Debounced Mutation
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }
    likeDebounceTimer.current = setTimeout(() => {
      likeMutation.mutate({ postId, currentUserId });
    }, 1000);
  };

  const handleFollowToggle = (targetUsername: string) => {
    if (!currentUserId) return;
    followMutation.mutate({ currentUserId, targetUsername });
  };

  const handleNavigateToPost = (postId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["post", postId],
      queryFn: () => fetchPost(postId),
    });
    router.push(`/post/${postId}`);
  };

  const onPostCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["activity"] });
  };

  const handlePrefetchProfile = useCallback(
    (username: string) => {
      queryClient.prefetchQuery({
        queryKey: ["profile", username],
        queryFn: () => fetchProfile(username),
      });
    },
    [queryClient],
  );

  const handlePrefetchPost = useCallback(
    (postId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["post", postId],
        queryFn: () => fetchPost(postId),
      });
    },
    [queryClient],
  );

  const handleNavigateToMapItem = (type: "gig" | "room", id: string) => {
    router.push(`/map?${type}Id=${id}`);
  };

  // Infinite Scroll Observer
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const renderItem = (item: ActivityItem, index: number) => {
    const isLast = index === feedItems.length - 1;
    const ref = isLast ? lastItemRef : null;

    if (item.type === "post") {
      return (
        <PostEntry
          key={`post-${item.data.id}`}
          ref={ref}
          post={item.data}
          currentUserId={currentUserId}
          // @ts-ignore
          loggedInUser={loggedInUserProfile}
          // @ts-ignore
          followingList={loggedInUserProfile?.following}
          onLikeToggle={handleLikeToggle}
          onNavigate={handleNavigateToPost}
          // @ts-ignore
          onFollowToggle={handleFollowToggle}
          onPrefetchProfile={handlePrefetchProfile}
          onPrefetchPost={handlePrefetchPost}
        />
      );
    } else {
      return (
        <GigRoomEntry
          key={`${item.type}-${item.data.id}`}
          ref={ref}
          item={item}
          onNavigate={handleNavigateToMapItem}
          onPrefetchProfile={handlePrefetchProfile}
        />
      );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-zinc-700 min-h-screen bg-black">
      {/* Feed Toggle Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-20 border-b border-zinc-700">
        <div className="flex justify-around bg-black border-b border-zinc-700">
          <button
            onClick={() => setFeedMode("global")}
            className={`py-3 text-sm font-bold transition-colors w-full border-b-4 ${
              feedMode === "global"
                ? "text-white-500 border-white-500"
                : "text-zinc-400 border-transparent hover:bg-zinc-900"
            } cursor-pointer`}
          >
            For you
          </button>
          <button
            onClick={() => setFeedMode("network")}
            className={`py-3 text-sm font-bold transition-colors w-full border-b-4 ${
              feedMode === "network"
                ? "text-white-500 border-white-500"
                : "text-zinc-400 border-transparent hover:bg-zinc-900"
            } cursor-pointer`}
          >
            Following
          </button>
        </div>
      </div>

      <CreatePost onPostCreated={onPostCreated} />

      {/* Feed List */}
      <motion.div
        key={feedMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence>
          {feedItems.map((item, idx) => renderItem(item, idx))}
        </AnimatePresence>
      </motion.div>

      {/* Loading States */}
      {(isLoading || isFetchingNextPage) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-black flex items-center justify-center m-10"
        >
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </motion.div>
      )}

      {!isLoading && !hasNextPage && feedItems.length > 0 && (
        <p className="text-zinc-500 text-center p-4">You've reached the end</p>
      )}

      {!isLoading && !isFetchingNextPage && feedItems.length === 0 && (
        <p className="text-zinc-500 text-center p-10">
          No activity matches your current filters or mode.
        </p>
      )}

      {/* Filter Button & Menu */}
      <div
        className="fixed bottom-5 z-50"
        ref={filterMenuRef}
        style={{ right: `max(1.25rem, calc((100vw - 672px) / 2))` }}
        onClick={() => setIsFilterOpen(true)}
      >
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center space-x-1 p-3 rounded-full text-white bg-black-600 hover:bg-zinc-900 transition-colors shadow shadow-white cursor-pointer"
        >
          <Filter size={22} />
        </button>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 p-4"
            >
              <div className="flex flex-col space-y-3">
                <FilterToggle
                  label="Posts"
                  checked={filters.posts}
                  onChange={() => handleFilterChange("posts")}
                />
                <FilterToggle
                  label="Gigs"
                  checked={filters.gigs}
                  onChange={() => handleFilterChange("gigs")}
                />
                <FilterToggle
                  label="Rooms"
                  checked={filters.rooms}
                  onChange={() => handleFilterChange("rooms")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
