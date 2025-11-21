"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import {
  Image as LucideImage,
  MapPin,
  X,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Music,
} from "lucide-react";

// State Management
import { useAtom } from "jotai";

// Data Fetching
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  InfiniteData,
} from "@tanstack/react-query";

// Utils & Constants
import { API_BASE_URL } from "@/lib/constants";
import { getImageUrl } from "@lib/utils"; // Adjust path as needed

// External Components
import ProfilePage from "@shared/profilePage"; // Adjust path as needed
import {
  ActivityItem,
  ActivityItemGig,
  ActivityItemPost,
  ActivityItemRoom,
  FeedPage,
  FilterState,
  Post,
  PostEntryProps,
  UserProfile,
} from "@/lib/types";
import { locationAtom, userAtom } from "@/store";

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------
type LikeMutationContext = {
  previousActivity: unknown;
  queryKey: (string | number | boolean | FilterState)[];
};

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

const DescriptionExpander = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineClampClass = "line-clamp-3";
  const needsTruncation = content.length > 150;

  if (!content) return null;

  const shouldShowButton = needsTruncation && !isExpanded;

  return (
    <div className="mt-2">
      <p
        className={`text-zinc-200 whitespace-pre-wrap wrap-break-words ${shouldShowButton ? lineClampClass : ""}`}
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

// -----------------------------------------------------------------------------
// Component: CreatePost
// -----------------------------------------------------------------------------

function CreatePost({
  onPostCreated,
}: {
  onPostCreated: (newPost: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");

  const [user] = useAtom(userAtom);
  const [coords, setCoords] = useAtom(locationAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user)
    return (
      <p className="p-4 text-center text-gray-400 border-b border-gray-700">
        Please login to post
      </p>
    );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError("You can upload max 5 images.");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    setError("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Permission denied or failed to get location"),
    );
  };

  const getCityFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      return (
        data.address?.city || data.address?.town || data.address?.village || ""
      );
    } catch {
      return "";
    }
  };

  const handleLocationToggle = async () => {
    const toggle = !includeLocation;
    setIncludeLocation(toggle);

    if (toggle && (!coords.lat || !coords.lng)) {
      await requestLocation();
    }

    if (toggle && coords.lat && coords.lng) {
      const city = await getCityFromCoords(coords.lat, coords.lng);
      setLocationName(city);
    } else {
      setLocationName("");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 5000) return;
    setContent(e.target.value);
    setError("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 250)}px`;
      el.style.overflowY = el.scrollHeight > 250 ? "auto" : "hidden";
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      setError("Write something or add at least one image!");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("name", user.name);
    formData.append("content", content);
    if (includeLocation && locationName)
      formData.append("location", locationName);
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch(`${API_BASE_URL}/feed/uploadPosts`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());

      const newPost: Post = await res.json();

      setContent("");
      setImages([]);
      setPreviews([]);
      setIncludeLocation(false);
      setLocationName("");

      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border-b border-gray-700 space-y-3"
    >
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3">
        <div className="shrink-0">
          {user.image ? (
            <Image
              src={
                user.image.startsWith("http")
                  ? user.image
                  : `${API_BASE_URL}/uploads/${user.image}`
              }
              alt={user.name}
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
            />
          ) : (
            <div className="bg-neutral-focus text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
              <span>{user.name[0].toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="What’s happening?"
            className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500 text-xl overflow-hidden"
            rows={1}
          />
          <div className="flex flex-wrap gap-3 mt-3">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-700"
              >
                <Image
                  src={src}
                  alt={`preview-${index}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-gray-400 text-sm">{content.length}/5000</span>
            <div className="flex gap-4 items-center relative text-white-500">
              <label className="cursor-pointer hover:text-white-400">
                <LucideImage className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <button
                onClick={handleLocationToggle}
                className={`flex items-center gap-1 text-sm cursor-pointer ${
                  includeLocation
                    ? "text-blue-500 hover:text-white-400"
                    : "hover:text-white-400"
                }`}
              >
                <MapPin className="w-5 h-5" />
              </button>
              <button
                onClick={handlePost}
                disabled={loading || (!content.trim() && images.length === 0)}
                className="btn btn-sm rounded-full bg-white-500 text-white font-bold px-5 py-2 border-none hover:bg-white-600 transition disabled:opacity-50 disabled:bg-white-800"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Component: PostEntry
// -----------------------------------------------------------------------------

const PostEntry = React.forwardRef<
  HTMLDivElement,
  PostEntryProps & { ref?: React.Ref<HTMLDivElement> }
>(
  (
    {
      post,
      currentUserId,
      onLikeToggle,
      onNavigate,
      onPrefetchProfile,
      onPrefetchPost,
    },
    ref,
  ) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    const isLikedByCurrentUser = post.likes.some(
      (like) => like.userId === currentUserId,
    );

    useEffect(() => {
      if (contentRef.current) {
        const hasOverflow =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        if (!isExpanded) setNeedsTruncation(hasOverflow);
      }
    }, [post.content, isExpanded]);

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    const openModal = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
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
        prev < post.imageUrls.length - 1 ? prev + 1 : 0,
      );
    };
    const showPrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setModalImageIndex((prev) =>
        prev > 0 ? prev - 1 : post.imageUrls.length - 1,
      );
    };

    const renderImageGrid = () => {
      const count = post.imageUrls.length;
      if (count === 0) return null;
      const gridBase =
        "relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-zinc-700";
      if (count === 1) {
        return (
          <div
            className={`${gridBase} cursor-pointer`}
            onClick={(e) => openModal(e, 0)}
          >
            <Image
              src={getImageUrl(post.imageUrls[0])}
              alt="Post image"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        );
      }
      if (count === 2) {
        return (
          <div className={`${gridBase} grid grid-cols-2 gap-0.5`}>
            {post.imageUrls.map((url, index) => (
              <div
                key={index}
                className="relative h-full cursor-pointer"
                onClick={(e) => openModal(e, index)}
              >
                <Image
                  src={getImageUrl(url)}
                  alt={`Post image ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        );
      }
      if (count === 3) {
        return (
          <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
            <div
              className="relative row-span-2 cursor-pointer"
              onClick={(e) => openModal(e, 0)}
            >
              <Image
                src={getImageUrl(post.imageUrls[0])}
                alt="Post image 1"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div
              className="relative col-start-2 cursor-pointer"
              onClick={(e) => openModal(e, 1)}
            >
              <Image
                src={getImageUrl(post.imageUrls[1])}
                alt="Post image 2"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div
              className="relative col-start-2 row-start-2 cursor-pointer"
              onClick={(e) => openModal(e, 2)}
            >
              <Image
                src={getImageUrl(post.imageUrls[2])}
                alt="Post image 3"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        );
      }
      return (
        <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
          {post.imageUrls.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className="relative h-full cursor-pointer"
              onClick={(e) => openModal(e, index)}
            >
              <Image
                src={getImageUrl(url)}
                alt={`Post image ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
              {count > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black flex items-center justify-center text-white text-2xl font-bold">
                  +{count - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        onClick={() => onNavigate(post.id)}
        onViewportEnter={() => {
          onPrefetchProfile(post.username);
          onPrefetchPost(post.id);
          router.prefetch(`/profile/${post.username}`);
          router.prefetch(`/post/${post.id}`);
        }}
        className="flex space-x-3 p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-900/50 transition-colors duration-200"
      >
        <div className="flex-shrink-0" onClick={stopPropagation}>
          <Link href={`/profile/${post.username}`}>
            {post.user?.image ? (
              <Image
                src={getImageUrl(post.user.image)}
                alt={post.username}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
              />
            ) : (
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                {post.username[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 flex-wrap"
              onClick={stopPropagation}
            >
              <Link
                href={`/profile/${post.username}`}
                className="text-white font-bold hover:underline"
                onMouseEnter={() => {
                  onPrefetchProfile(post.username);
                  router.prefetch(`/profile/${post.username}`);
                }}
              >
                {post.name || post.username}
              </Link>
              <Link
                href={`/profile/${post.username}`}
                className="text-zinc-400 hover:underline"
                onMouseEnter={() => {
                  onPrefetchProfile(post.username);
                  router.prefetch(`/profile/${post.username}`);
                }}
              >
                @{post.username}
              </Link>
              <p className="text-zinc-500 text-sm">
                · {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>

            {post.location && (
              <p className="text-zinc-400 text-sm flex items-center gap-1 shrink-0 ml-2">
                <MapPin size={16} />
                {post.location}
              </p>
            )}
          </div>

          <p
            ref={contentRef}
            className={`text-white mt-1 whitespace-pre-wrap wrap-break-words ${
              !isExpanded ? "line-clamp-8" : ""
            }`}
          >
            {post.content}
          </p>

          {(needsTruncation || isExpanded) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="text-blue-500 hover:underline mt-2 text-sm font-medium"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}

          {renderImageGrid()}

          <div className="flex items-center gap-6 mt-4 text-zinc-500">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLikeToggle(post.id);
              }}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 transition-colors duration-200 group ${
                isLikedByCurrentUser ? "text-red-500" : "hover:text-red-500"
              } ${!currentUserId ? "opacity-50" : ""}`}
            >
              <Heart
                size={18}
                fill={isLikedByCurrentUser ? "currentColor" : "none"}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-sm">{post._count.likes}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(post.id);
              }}
              onMouseEnter={() => {
                onPrefetchPost(post.id);
                router.prefetch(`/post/${post.id}`);
              }}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors duration-200 group"
            >
              <MessageCircle
                size={18}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-sm">{post._count.comments}</span>
            </button>
          </div>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            <button
              className="absolute top-4 right-4 text-white z-60 p-2"
              onClick={closeModal}
            >
              <X size={32} />
            </button>
            {post.imageUrls.length > 1 && (
              <button
                className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-60 hover:bg-black/80 transition-colors"
                onClick={showPrevImage}
              >
                <ChevronLeft size={32} />
              </button>
            )}
            <div
              className="relative w-[90vw] h-[90vh]"
              onClick={stopPropagation}
            >
              <Image
                src={getImageUrl(post.imageUrls[modalImageIndex])}
                alt="Post image expanded"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            {post.imageUrls.length > 1 && (
              <button
                className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-60 hover:bg-black/80 transition-colors"
                onClick={showNextImage}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  },
);
PostEntry.displayName = "PostEntry";

// -----------------------------------------------------------------------------
// Component: Feedbox
// -----------------------------------------------------------------------------

function Feedbox() {
  const [user] = useAtom(userAtom);
  const currentUserId = user!.id;
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

  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);

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
    onMutate: async ({ currentUserId }) => {
      await queryClient.cancelQueries({ queryKey: ["activity"] });
      const queryKey = [
        "activity",
        feedMode,
        currentUserId,
        JSON.stringify(filters),
      ];
      const previousActivity = queryClient.getQueryData(queryKey);
      return { previousActivity, queryKey };
    },
    onError: (err, variables, context: LikeMutationContext | undefined) => {
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
    queryClient.setQueryData<InfiniteData<FeedPage>>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => {
            if (item.type === "post" && item.data.id === postId) {
              const post = item.data as Post;
              const isLiked = post.likes.some(
                (like: { userId: string }) => like.userId === currentUserId,
              );
              const optimisticLikeEntry = { userId: currentUserId };

              if (isLiked) {
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: post.likes.filter(
                      (like: { userId: string }) =>
                        like.userId !== currentUserId,
                    ),
                    _count: {
                      ...post._count,
                      likes: Math.max(0, post._count.likes - 1),
                    },
                  },
                } as ActivityItemPost;
              } else {
                return {
                  ...item,
                  data: {
                    ...post,
                    likes: [...post.likes, optimisticLikeEntry],
                    _count: { ...post._count, likes: post._count.likes + 1 },
                  },
                } as ActivityItemPost;
              }
            }

            return item;
          }),
        })),
      };
    });

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
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
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
              <div className="flex items-center gap-1 text-zinc-500 text-sm shrink-0 ml-2 mt-1">
                <MapPin size={14} />
                <span>{locationDisplay}</span>
              </div>
            )}
          </div>

          <p className="text-white mt-1 font-bold whitespace-pre-wrap words text-lg">
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
                      (data as ActivityItemGig["data"]).createdAt,
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
        <p className="text-zinc-500 text-center p-4">
          this is the end ...
          <Music />
        </p>
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
            className="absolute top-4 right-4 text-white z-60 p-2"
            onClick={closeModal}
          >
            <X size={32} />
          </button>
          {modalImages.length > 1 && (
            <button
              className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-60 hover:bg-black/80 transition-colors"
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
              className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-60 hover:bg-black/80 transition-colors"
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

// -----------------------------------------------------------------------------
// Main Export: House
// -----------------------------------------------------------------------------

export default function House() {
  return (
    <>
      <div className="z-999 relative ">
        <ProfilePage />
      </div>
      <div className="w-full bg-black">
        <Feedbox />
      </div>
    </>
  );
}
