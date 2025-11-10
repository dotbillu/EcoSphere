"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import CreatePost from "./createPost";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAtom } from "jotai";
import {
  User,
  UserProfile,
  Post,
  Gig,
  MapRoom,
  Following,
  userAtom,
} from "../../store";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import PostEntry from "./PostEntry";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "../../lib/utils";
import SearchBar from "../SearchBar";

interface ActivityItemPost {
  type: "post";
  data: Post & { createdAt: string };
}
interface ActivityItemGig {
  type: "gig";
  data: Gig & {
    createdAt: string;
    imageUrls: string[];
    createdBy: Following;
    reward?: string;
    type?: string;
    date: string;
  };
}
interface ActivityItemRoom {
  type: "room";
  data: MapRoom & {
    createdAt: string;
    imageUrl: string | null;
    createdBy: Following;
    type?: string;
  };
}

type ActivityItem = ActivityItemPost | ActivityItemGig | ActivityItemRoom;

interface FeedPage {
  items: ActivityItem[];
  hasNextPage: boolean;
}

interface FilterState {
  posts: boolean;
  gigs: boolean;
  rooms: boolean;
}

const fetchGlobalActivity = async ({
  pageParam = 0,
  filters,
}: {
  pageParam: number;
  filters: FilterState;
}): Promise<FeedPage> => {
  const res = await fetch(
    `http://localhost:4000/global/feed?skip=${pageParam * 10}&take=10&posts=${filters.posts}&gigs=${filters.gigs}&rooms=${filters.rooms}`,
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
  currentUserId: number;
  filters: FilterState;
}): Promise<FeedPage> => {
  if (!currentUserId) return { items: [], hasNextPage: false };

  const res = await fetch(
    `http://localhost:4000/network/feed?userId=${currentUserId}&skip=${pageParam * 10}&take=10&posts=${filters.posts}&gigs=${filters.gigs}&rooms=${filters.rooms}`,
  );
  if (!res.ok) throw new Error("Failed to fetch network activity");
  return res.json();
};

const fetchPost = async (postId: number): Promise<Post> => {
  const res = await fetch(`http://localhost:4000/posts/${postId}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
};

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`http://localhost:4000/user/profile/${username}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

const toggleLike = async ({
  postId,
  currentUserId,
}: {
  postId: number;
  currentUserId: number;
}) => {
  const res = await fetch(`http://localhost:4000/posts/${postId}/like`, {
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
  const res = await fetch(`http://localhost:4000/user/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUsername }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle follow");
  }
  return res.json();
};

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

const DescriptionExpander = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineClampClass = "line-clamp-3";
  const needsTruncation = content.length > 150;

  if (!content) return null;

  const shouldShowButton = needsTruncation && !isExpanded;

  return (
    <div className="mt-2">
      <p
        className={`text-zinc-200 whitespace-pre-wrap break-words ${shouldShowButton ? lineClampClass : ""}`}
      >
        {content}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-white-500 hover:underline mt-1 text-sm font-medium flex items-center"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={16} className="ml-1" />
            </>
          ) : (
            <>
              Know More <ChevronDown size={16} className="ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default function Feedbox() {
  const [user] = useAtom(userAtom);
  const currentUserId = user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const observer = useRef<IntersectionObserver | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [feedMode, setFeedMode] = useState<"global" | "network">("global");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    posts: true,
    gigs: true,
    rooms: true,
  });

  // [NEW] Ref to hold the like debounce timer, mimicking Profile.tsx
  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  // [REMOVED] const [pendingLikeToggle, setPendingLikeToggle] = useState<...>(null);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const openModal = (e: React.MouseEvent, images: string[], index: number) => {
    e.stopPropagation();
    setModalImages(images);
    setModalImageIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsModalOpen(false);
  };
  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev < modalImages.length - 1 ? prev + 1 : 0,
    );
  };
  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev > 0 ? prev - 1 : modalImages.length - 1,
    );
  };

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
    isError,
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

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ postId, currentUserId }) => {
      // Note: The optimistic update is now primarily in handleLikeToggle,
      // but we cancel and return previous data here for rollback.
      await queryClient.cancelQueries({ queryKey: ["activity"] });
      
      const queryKey = ["activity", feedMode, currentUserId, filters];
      const previousActivity = queryClient.getQueryData(queryKey);

      // We skip the complex optimistic setQueryData here because it's already done
      // in the handler (handleLikeToggle) for immediate visual feedback.
      // This onMutate is primarily for saving rollback data.
      
      return { previousActivity, queryKey };
    },
    onError: (err, variables, context: any) => {
      // Rollback to previous state
      if (context?.previousActivity) {
        queryClient.setQueryData(
          context.queryKey,
          context.previousActivity
        );
      }
      console.error("Like toggle failed:", err);
    },
    onSettled: () => {
      // Ensure data is eventually consistent, regardless of success/failure
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

  // [UPDATED] Like Handler uses optimistic update and debounced mutation (mimicking Profile.tsx)
  const handleLikeToggle = (postId: number) => {
    if (!currentUserId) return;
    const queryKey = ["activity", feedMode, currentUserId, filters];

    // 1. Optimistic Update (immediate UI change)
    queryClient.setQueryData<any>(queryKey, (oldData) => {
      if (!oldData) return;
      
      return {
        ...oldData,
        pages: oldData.pages.map((page: FeedPage) => ({
          ...page,
          items: page.items.map((item) => {
            if (item.type === "post" && item.data.id === postId) {
              const post = item.data as Post;
              const isLiked = post.likes.some((like: any) => like.userId === currentUserId);
              
              const optimisticLikeEntry = { userId: currentUserId, postId: postId };

              if (isLiked) {
                // Optimistically unlike
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: post.likes.filter((like: any) => like.userId !== currentUserId),
                    _count: { ...post._count, likes: post._count.likes - 1 },
                  },
                };
              } else {
                // Optimistically like
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

    // 2. Clear any pending network request
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }

    // 3. Set a new timer to send the actual request via mutation
    likeDebounceTimer.current = setTimeout(() => {
      likeMutation.mutate({
        postId: postId,
        currentUserId: currentUserId,
      });
    }, 1000); // 1-second debounce delay
  };

  // [REMOVED] The old useEffect for debouncing is removed as the logic is in handleLikeToggle

  const handleFollowToggle = (targetUsername: string) => {
    if (!currentUserId) return;
    followMutation.mutate({ currentUserId, targetUsername });
  };
  const handleNavigateToPost = (postId: number) => {
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
    (postId: number) => {
      queryClient.prefetchQuery({
        queryKey: ["post", postId],
        queryFn: () => fetchPost(postId),
      });
    },
    [queryClient],
  );

  const handleNavigateToMapItem = (type: "gig" | "room", id: number) => {
    router.push(`/map?${type}Id=${id}`);
  };

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

  const renderActivityItem = (item: ActivityItem, index: number) => {
    const isLast = index === feedItems.length - 1;

    if (item.type === "post") {
      return (
        <PostEntry
          key={`post-${item.data.id}`}
          ref={isLast ? lastItemRef : null}
          post={item.data}
          currentUserId={currentUserId}
          loggedInUser={loggedInUserProfile}
          followingList={loggedInUserProfile?.following}
          onLikeToggle={handleLikeToggle}
          onNavigate={handleNavigateToPost}
          onFollowToggle={handleFollowToggle}
          onPrefetchProfile={handlePrefetchProfile}
          onPrefetchPost={handlePrefetchPost}
        />
      );
    }

    const data = item.data as
      | ActivityItemGig["data"]
      | ActivityItemRoom["data"];
    const author = data.createdBy;
    const title =
      "title" in data
        ? (data as ActivityItemGig["data"]).title
        : (data as ActivityItemRoom["data"]).name;
    const description = data.description;
    const imageUrls =
      "imageUrls" in data
        ? (data as ActivityItemGig["data"]).imageUrls
        : (data as ActivityItemRoom["data"]).imageUrl
          ? [(data as ActivityItemRoom["data"]).imageUrl as string]
          : [];
    const navigationId = data.id;
    const profileUrl = `/profile/${author.username}`;

    const handleNavigation = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleNavigateToMapItem(item.type, navigationId);
    };

    const handleImageClick = (e: React.MouseEvent, index: number) => {
      openModal(e, imageUrls, index);
    };

    const isGig = item.type === "gig";
    const locationDisplay = "New Delhi, India";

    return (
      <div
        key={`${item.type}-${navigationId}`}
        ref={isLast ? lastItemRef : null}
        onClick={handleNavigation}
        className="flex space-x-3 p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-900/50 transition-colors duration-200"
      >
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link href={profileUrl}>
            {author.image ? (
              <Image
                src={getImageUrl(author.image)}
                alt={author.username}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
              />
            ) : (
              <div classNameName="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                {author.username[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center justify-between mt-0.5">
            <div
              className="flex items-center gap-2 flex-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href={profileUrl}
                className="text-white font-bold hover:underline text-sm"
                onMouseEnter={() => handlePrefetchProfile(author.username)}
              >
                {author.name || author.username}
              </Link>
              <Link
                href={profileUrl}
                className="text-zinc-400 hover:underline text-sm"
                onMouseEnter={() => handlePrefetchProfile(author.username)}
              >
                @{author.username}
              </Link>
              <p className="text-zinc-500 text-sm">
                · {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
            {locationDisplay && (
              <div className="flex items-center gap-1 text-zinc-500 text-sm flex-shrink-0 ml-2 mt-1">
                <MapPin size={14} />
                <span>{locationDisplay}</span>
              </div>
            )}
          </div>
          
          <p className="text-white mt-1 font-bold whitespace-pre-wrap break-words text-lg">
            {title}
          </p>

          <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-700">
            <p className="text-sm font-semibold text-zinc-400 mb-2">
              {isGig ? "Gig Details:" : "Room Type:"}
            </p>

            {isGig ? (
              <div className="space-y-1 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-500" />
                  <span className="font-medium">Reward:</span>
                  <span>
                    {(data as ActivityItemGig["data"]).reward ||
                      "Not specified"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-white-400" />
                  <span className="font-medium">Date:</span>
                  <span>
                    {new Date(
                      (data as ActivityItemGig["data"]).date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-purple-400" />
                  <span className="font-medium">Type:</span>
                  <span>
                    {(data as ActivityItemGig["data"]).type || "General"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-yellow-400" />
                  <span className="font-medium">Type:</span>
                  <span>
                    {(data as ActivityItemRoom["data"]).type || "Public"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-cyan-400" />
                  <span className="font-medium">Creator:</span>
                  <span>{author.name || author.username}</span>
                </div>
              </div>
            )}
          </div>

          {description && <DescriptionExpander content={description} />}

          {imageUrls.length > 0 && (
            <div
              className="relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-zinc-700 cursor-pointer"
              onClick={(e) => handleImageClick(e, 0)}
            >
              <Image
                src={getImageUrl(imageUrls[0])}
                alt={title}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}

          <p className="text-sm font-medium text-zinc-500 mt-2">
            Activity Type: {isGig ? "Gig" : "Room"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-zinc-700 min-h-screen bg-black">
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

      <motion.div
        key={feedMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence>
          {feedItems.map((item, idx) => renderActivityItem(item, idx))}
        </AnimatePresence>
      </motion.div>

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

      {isModalOpen && modalImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white z-[60] p-2"
            onClick={closeModal}
          >
            <X size={32} />
          </button>
          {modalImages.length > 1 && (
            <button
              className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showPrevImage}
            >
              <ChevronLeft size={32} />
            </button>
          )}
          <div className="relative w-[90vw] h-[90vh]" onClick={stopPropagation}>
            <Image
              src={getImageUrl(modalImages[modalImageIndex])}
              alt="Expanded image"
              fill
              style={{ objectFit: "contain" }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {modalImageIndex + 1} / {modalImages.length}
            </div>
          </div>
          {modalImages.length > 1 && (
            <button
              className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showNextImage}
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}

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
