"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import CreatePost from "./createPost";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Loader2, 
} from "lucide-react";

import { useAtom } from "jotai";
import { userAtom, User } from "../../store";
import { useRouter } from "next/navigation";



interface Comment {
  id: number;
  content: string;
  userId: number;
  user: {
    username: string;
    image?: string | null;
  };
}
interface Like {
  userId: number;
}
interface Post {
  id: number;
  username: string;
  name?: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
  location?: string;
  user: {
    image?: string | null;
  };
  likes: Like[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}



interface PostEntryProps {
  post: Post;
  currentUserId?: number;
  onLikeToggle: (postId: number) => void; 
  onNavigate: (postId: number) => void; 
}

const PostEntry = React.forwardRef<
  HTMLDivElement,
  PostEntryProps & { ref?: React.Ref<HTMLDivElement> }
>(({ post, currentUserId, onLikeToggle, onNavigate }, ref) => {
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

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
      "relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-gray-700";
    if (count === 1) {
      return (
        <div
          className={`${gridBase} cursor-pointer`}
          onClick={(e) => openModal(e, 0)}
        >
          <Image
            src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
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
                src={`http://localhost:4000/uploads/${url}`}
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
              src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
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
              src={`http://localhost:4000/uploads/${post.imageUrls[1]}`}
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
              src={`http://localhost:4000/uploads/${post.imageUrls[2]}`}
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
              src={`http://localhost:4000/uploads/${url}`}
              alt={`Post image ${index + 1}`}
              fill
              style={{ objectFit: "cover" }}
            />
            {count > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
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
      className="flex space-x-3 p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-900/50 transition-colors duration-200"
    >
      {/* Avatar */}
      <div className="flex-shrink-0" onClick={stopPropagation}>
        {post.user?.image ? (
          <Image
            src={
              post.user.image.startsWith("http")
                ? post.user.image
                : `http://localhost:4000/uploads/${post.user.image}`
            }
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
      </div>

      {/* Post Content */}
      <div className="flex-1 min-w-0">
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 flex-wrap"
            onClick={stopPropagation}
          >
            <p className="text-white font-bold hover:underline">
              {post.name || post.username}
            </p>
            <p className="text-gray-400">@{post.username}</p>
            <p className="text-gray-500 text-sm">
              · {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>

          {post.location && (
            <p className="text-gray-400 text-sm flex items-center gap-1 flex-shrink-0 ml-2">
              <MapPin size={16} />
              {post.location}
            </p>
          )}
        </div>

        {/* Post Body */}
        <p
          ref={contentRef}
          className={`text-white mt-1 whitespace-pre-wrap break-words ${
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

        {/* Post Image Grid */}
        {renderImageGrid()}

        {/* LIKE & COMMENT ACTION BAR */}
        <div className="flex items-center gap-6 mt-4 text-gray-500">
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle(post.id);
            }}
            // Disable if not logged in
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

          {/* Comment Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(post.id); 
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

      {/* Image Modal (Unchanged) */}
      {isModalOpen && (
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
          {post.imageUrls.length > 1 && (
            <button
              className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showPrevImage}
            >
              <ChevronLeft size={32} />
            </button>
          )}
          <div className="relative w-[90vw] h-[90vh]" onClick={stopPropagation}>
            <Image
              src={`http://localhost:4000/uploads/${post.imageUrls[modalImageIndex]}`}
              alt="Post image expanded"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          {post.imageUrls.length > 1 && (
            <button
              className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showNextImage}
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
});
PostEntry.displayName = "PostEntry";


export default function Feedbox() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

 
  const [user] = useAtom(userAtom);
  const currentUserId = user?.id; 
  const router = useRouter();

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  useEffect(() => {
    if (!hasMore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchPosts = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/posts?skip=${page * 5}&take=5`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Post[] = await res.json();

        if (data.length === 0) {
          setHasMore(false);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newPosts = data.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        }
        if (data.length < 5) setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, hasMore]);

  // --- 3. UPDATED LIKE FUNCTION ---
  const handleLikeToggle = async (postId: number) => {
    
    if (!currentUserId) {
      console.error("User not found, cannot like post");
      return;
    }

    
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likes.some(
            (like) => like.userId === currentUserId,
          );
          if (isLiked) {
           
            return {
              ...post,
              likes: post.likes.filter((like) => like.userId !== currentUserId),
              _count: { ...post._count, likes: post._count.likes - 1 },
            };
          } else {
        
            return {
              ...post,
              likes: [...post.likes, { userId: currentUserId }],
              _count: { ...post._count, likes: post._count.likes + 1 },
            };
          }
        }
        return post;
      }),
    );

  
    try {
      await fetch(`http://localhost:4000/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }), 
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
     
    }
  };

  const handleNavigateToPost = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  const onPostCreated = async (newPost: Post) => {
    try {
   
    
    
      const res = await fetch(`http://localhost:4000/posts/${newPost.id}`);
      if (!res.ok) throw new Error("Failed to fetch new post details");

      const fullPost: Post = await res.json();

    
      setPosts((prevPosts) => [fullPost, ...prevPosts]);
    } catch (err) {
      console.error(err);
    
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    }
  };
  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700 min-h-screen bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-white p-4 border-b border-gray-700">
          Home
        </h1>
      </div>

      {/* 4. Pass user to CreatePost */}
      <CreatePost onPostCreated={onPostCreated} />

      {/* Feed */}
      <AnimatePresence>
        {posts.map((post, idx) => {
          const isLast = idx === posts.length - 1;
          return (
            <PostEntry
              key={`${post.id}-${idx}`}
              ref={isLast ? lastPostRef : null}
              post={post}
              // 5. Pass down the correct ID
              currentUserId={currentUserId}
              onLikeToggle={handleLikeToggle}
              onNavigate={handleNavigateToPost}
            />
          );
        })}
      </AnimatePresence>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-black flex items-center justify-center m-10"
        >
          {/* Use Loader2 for consistency */}
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </motion.div>
      )}

      {!loading && !hasMore && (
        <p className="text-gray-500 text-center p-4">You've reached the end</p>
      )}
    </div>
  );
}
