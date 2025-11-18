"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  InfiniteData,
} from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { userAtom, Post, UserProfile } from "@/store";
import { API_BASE_URL } from "@/lib/constants";
import CreatePost from "./CreatePost";
import PostEntry from "./PostEntry";
import MapActivityEntry from "./MapActivityEntry";
import FeedFilters from "./FeedFilters";

const LoaderIcon = Loader2 as any;

interface FilterState {
  posts: boolean;
  gigs: boolean;
  rooms: boolean;
}

interface LikeData {
  userId: number;
  postId?: number;
}

interface FeedItem {
  type: "post" | "gig" | "room";
  data: any;
}

interface FeedPage {
  items: FeedItem[];
  hasNextPage: boolean;
}

const fetchFeed = async ({
  pageParam = 0,
  mode,
  userId,
  filters,
}: {
  pageParam: number;
  mode: "global" | "network";
  userId?: string;
  filters: FilterState;
}): Promise<FeedPage> => {
  const endpoint = mode === "global" ? "/global/feed" : "/feed/feed";
  const userQuery = mode === "network" && userId ? `&userId=${userId}` : "";
  const res = await fetch(
    `${API_BASE_URL}${endpoint}?skip=${pageParam * 10}&take=10&posts=${filters.posts}&gigs=${filters.gigs}&rooms=${filters.rooms}${userQuery}`,
  );
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
};

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE_URL}/user/profile/${username}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

const fetchPost = async (postId: number): Promise<Post> => {
  const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
};

const toggleLike = async ({
  postId,
  currentUserId,
}: {
  postId: number;
  currentUserId: number;
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
  currentUserId: number;
  targetUsername: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/user/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUsername }),
  });
  if (!res.ok) throw new Error("Failed to toggle follow");
  return res.json();
};

export default function Feedbox() {
  const [user] = useAtom(userAtom);

  const currentUserId = user?.id ? String(user.id) : undefined;
  const currentUserIdNum = user?.id ? Number(user.id) : undefined;

  const router = useRouter();
  const queryClient = useQueryClient();
  const observer = useRef<IntersectionObserver | null>(null);

  const filterMenuRef = useRef<HTMLDivElement>(null);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: loggedInUserProfile } = useQuery<UserProfile>({
    queryKey: ["profile", user?.username],
    queryFn: () => fetchProfile(user!.username),
    enabled: !!user?.username,
    staleTime: 1000 * 60 * 5,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["activity", feedMode, currentUserId, filters],
      queryFn: ({ pageParam }) =>
        fetchFeed({
          pageParam: pageParam as number,
          mode: feedMode,
          userId: currentUserId,
          filters,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasNextPage ? allPages.length : undefined,
      enabled:
        feedMode === "global" || (feedMode === "network" && !!currentUserId),
    });

  const feedItems = data?.pages.flatMap((page) => page.items) ?? [];

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ postId, currentUserId }) => {
      await queryClient.cancelQueries({ queryKey: ["activity"] });
      const queryKey = ["activity", feedMode, String(currentUserId), filters];
      const previousActivity =
        queryClient.getQueryData<InfiniteData<FeedPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<FeedPage>>(queryKey, (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => {
              if (item.type === "post" && item.data.id === postId) {
                const post = item.data;
                const isLiked = post.likes.some(
                  (like: LikeData) => like.userId === currentUserId,
                );
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: isLiked
                      ? post.likes.filter(
                          (l: LikeData) => l.userId !== currentUserId,
                        )
                      : [...post.likes, { userId: currentUserId, postId }],
                    _count: {
                      ...post._count,
                      likes: post._count.likes + (isLiked ? -1 : 1),
                    },
                  },
                };
              }
              return item;
            }),
          })),
        };
      });
      return { previousActivity, queryKey };
    },
    onError: (err, vars, context) => {
      if (context?.previousActivity)
        queryClient.setQueryData(context.queryKey, context.previousActivity);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["activity"] }),
  });

  const followMutation = useMutation({
    mutationFn: toggleFollow,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const handleLikeToggle = (postId: number) => {
    if (!currentUserIdNum) return;
    if (likeDebounceTimer.current) clearTimeout(likeDebounceTimer.current);
    likeDebounceTimer.current = setTimeout(
      () => likeMutation.mutate({ postId, currentUserId: currentUserIdNum }),
      500,
    );
  };

  const handleFollowToggle = (targetUsername: string) => {
    if (currentUserIdNum)
      followMutation.mutate({
        currentUserId: currentUserIdNum,
        targetUsername,
      });
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
    (postId: number) => {
      queryClient.prefetchQuery({
        queryKey: ["post", postId],
        queryFn: () => fetchPost(postId),
      });
    },
    [queryClient],
  );

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-zinc-700 min-h-screen bg-black">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-20 border-b border-zinc-700">
        <div className="flex justify-around">
          {["global", "network"].map((mode) => (
            <button
              key={mode}
              onClick={() => setFeedMode(mode as "global" | "network")}
              className={`py-3 text-sm font-bold w-full border-b-4 transition-colors ${
                feedMode === mode
                  ? "text-white border-blue-500"
                  : "text-zinc-500 border-transparent hover:bg-zinc-900"
              }`}
            >
              {mode === "global" ? "For you" : "Following"}
            </button>
          ))}
        </div>
      </div>

      <CreatePost
        onPostCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["activity"] })
        }
      />

      <motion.div
        key={feedMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence mode="popLayout">
          {feedItems.map((item, idx) => {
            const isLast = idx === feedItems.length - 1;
            return item.type === "post" ? (
              <PostEntry
                key={item.data.id}
                itemRef={isLast ? lastItemRef : null}
                post={item.data}
                currentUserId={currentUserId}
                loggedInUser={loggedInUserProfile}
                onLikeToggle={() => handleLikeToggle(Number(item.data.id))}
                onNavigate={(id) => router.push(`/post/${id}`)}
                onFollowToggle={handleFollowToggle}
                onPrefetchProfile={handlePrefetchProfile}
                onPrefetchPost={() => handlePrefetchPost(Number(item.data.id))}
              />
            ) : (
              <MapActivityEntry
                key={`${item.type}-${item.data.id}`}
                itemRef={isLast ? lastItemRef : null}
                item={item as any}
                onNavigate={(type, id) => router.push(`/map?${type}Id=${id}`)}
                onPrefetchProfile={handlePrefetchProfile}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {(isLoading || isFetchingNextPage) && (
        <div className="flex justify-center p-8">
          <LoaderIcon className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {!isLoading && !hasNextPage && feedItems.length > 0 && (
        <p className="text-zinc-600 text-center p-8 text-sm">
          You&apos;ve reached the end.
        </p>
      )}

      <FeedFilters
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
        filters={filters}
        onFilterChange={(k) =>
          setFilters((prev) => ({ ...prev, [k]: !prev[k] }))
        }
        menuRef={filterMenuRef as React.RefObject<HTMLDivElement>}
      />
    </div>
  );
}
