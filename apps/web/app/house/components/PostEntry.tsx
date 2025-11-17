"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getImageUrl } from "../../lib/utils";
import { Post } from "../../store";

interface PostEntryProps {
  post: Post;
  currentUserId?: string;
  onLikeToggle: (postId: string) => void;
  onNavigate: (postId: string) => void;
  onPrefetchProfile: (username: string) => void;
  onPrefetchPost: (postId: string) => void;
}

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
              <p className="text-zinc-400 text-sm flex items-center gap-1 flex-shrink-0 ml-2">
                <MapPin size={16} />
                {post.location}
              </p>
            )}
          </div>

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
                src={getImageUrl(post.imageUrls[modalImageIndex])}
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

export default PostEntry;
