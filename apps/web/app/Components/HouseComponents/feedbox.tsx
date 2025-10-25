"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import CreatePost from "./createPost";
import Image from "next/image"; // Correct import
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";

// --- UPDATED INTERFACE ---
interface Post {
  id: number;
  username: string;
  name?: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
  location?: string;
  // This nested object will now be included from the backend
  user: {
    image?: string | null;
  };
}
// -------------------------

const PostEntry = React.forwardRef<HTMLDivElement, { post: Post }>(
  ({ post }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    useEffect(() => {
      if (contentRef.current) {
        const hasOverflow =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        if (!isExpanded) setNeedsTruncation(hasOverflow);
      }
    }, [post.content, isExpanded]);

    // --- (Image Modal Logic - No changes) ---
    const openModal = (index: number) => {
      setModalImageIndex(index);
      setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);
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
            onClick={() => openModal(0)}
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
                onClick={() => openModal(index)}
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
              onClick={() => openModal(0)}
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
              onClick={() => openModal(1)}
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
              onClick={() => openModal(2)}
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
              onClick={() => openModal(index)}
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
    // ---------------------------------------------

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.3 }}
        className="flex space-x-3 p-4 border-b border-gray-700"
      >
        {/* --- UPDATED AVATAR SECTION --- */}
        <div className="flex-shrink-0">
          {post.user?.image ? (
            <Image
              src={
                // This handles both external (Google) and internal (uploads) images
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
        {/* ------------------------------- */}

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {" "}
              <p className="text-white font-bold">{post.name || post.username}</p>
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
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-blue-500 hover:underline mt-2 text-sm font-medium"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}

          {/* Post Image Grid */}
          {renderImageGrid()}
        </div>

        {/* --- (Image Modal - No changes) --- */}
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
            <div
              className="relative w-[90vw] h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
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
  },
);
PostEntry.displayName = "PostEntry";

// --- (Main Feedbox Component - No changes) ---
export default function Feedbox() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

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
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/posts?skip=${page * 5}&take=5`,
        );
        const data: Post[] = await res.json();

        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });

        if (data.length < 5) setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700  min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-white p-4 border-b border-gray-700">
          Home
        </h1>
      </div>

      {/* Create Post component */}
      <CreatePost />

      {/* Feed */}
      <AnimatePresence>
        {posts.map((post, idx) => {
          const isLast = idx === posts.length - 1;
          return (
            <PostEntry
              key={`${post.id}-${idx}`}
              ref={isLast ? lastPostRef : null}
              post={post}
            />
          );
        })}
      </AnimatePresence>

      {loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-center p-4"
        >
          Loading...
        </motion.p>
      )}
      {!hasMore && (
        <p className="text-gray-500 text-center p-4">
          You've reached the end
        </p>
      )}
    </div>
  );
}
