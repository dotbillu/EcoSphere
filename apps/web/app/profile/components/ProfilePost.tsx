"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { Post } from "@types";

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/uploads/${path}`;
};

interface ProfilePostProps {
  post: Post;
  userImageUrl?: string | null;
  currentUserId?: string;
  onLikeToggle: (postId: string) => void;
  onNavigate: (postId: string) => void;
}

export default function ProfilePost({
  post,
  userImageUrl,
  currentUserId,
  onLikeToggle,
  onNavigate,
}: ProfilePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const displayName = post.name || post.username || "User";

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
    setModalImageIndex((prev) => (prev + 1) % post.imageUrls.length);
  };

  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex(
      (prev) => (prev - 1 + post.imageUrls.length) % post.imageUrls.length,
    );
  };
  const renderImageGrid = () => {
    const count = post.imageUrls.length;
    if (count === 0) return null;

    const gridBase =
      "relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-zinc-700";
    const GridImage = ({
      url,
      index,
      className = "",
    }: {
      url: string;
      index: number;
      className?: string;
    }) => (
      <div
        className={`relative h-full w-full cursor-pointer ${className}`}
        onClick={(e) => openModal(e, index)}
      >
        <Image
          src={getImageUrl(url)}
          alt={`Post image ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover hover:opacity-90 transition-opacity"
        />
      </div>
    );

    if (count === 1) {
      return (
        <div className={`${gridBase} cursor-pointer`}>
          <GridImage url={post.imageUrls[0]} index={0} />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className={`${gridBase} grid grid-cols-2 gap-0.5`}>
          {post.imageUrls.map((url, index) => (
            <GridImage key={index} url={url} index={index} />
          ))}
        </div>
      );
    }

    return (
      <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
        {post.imageUrls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className="relative h-full w-full cursor-pointer"
            onClick={(e) => openModal(e, index)}
          >
            <Image
              src={getImageUrl(url)}
              alt={`Post image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover hover:opacity-90 transition-opacity"
            />
            {count > 4 && index === 3 && (
              <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  const avatarUrl = getImageUrl(userImageUrl);

  return (
    <>
      <motion.div
        key={post.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={() => onNavigate(post.id)}
        className="p-4 border-b border-zinc-700 transition-colors hover:bg-white/5 cursor-pointer"
      >
        <div
          className="flex items-center justify-between mb-2"
          onClick={stopPropagation}
        >
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <div className="relative w-10 h-10">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  sizes="40px"
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg text-white">
                {displayName[0].toUpperCase()}
              </div>
            )}

            <div className="flex items-center gap-2">
              <p className="text-white font-bold hover:underline cursor-pointer">
                {displayName}
              </p>
              <p className="text-zinc-400 text-sm">
                · {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {post.location && (
            <p className="text-zinc-400 text-sm flex items-center gap-1">
              <MapPin size={16} />
              {post.location}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          <p
            ref={contentRef}
            className={`text-zinc-200 whitespace-pre-wrap words ${
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
        </div>

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
            } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart
              size={18}
              fill={isLikedByCurrentUser ? "currentColor" : "none"}
              className={`transition-transform ${
                isLikedByCurrentUser ? "scale-110" : "group-hover:scale-110"
              }`}
            />
            <span className="text-sm">{post._count.likes}</span>
          </button>

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
      </motion.div>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-9999 flex items-center justify-center backdrop-blur-md"
            onClick={closeModal}
          >
            <button
              className="absolute top-6 right-6 z-50 text-white/70 hover:text-white transition-colors p-2"
              onClick={closeModal}
            >
              <X size={32} />
            </button>
            {post.imageUrls.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-50 text-white/70 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full"
                  onClick={showPrevImage}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-4 z-50 text-white/70 hover:text-white transition-colors p-4 hover:bg-white/10 rounded-full"
                  onClick={showNextImage}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={getImageUrl(post.imageUrls[modalImageIndex])}
                alt="Modal view"
                fill
                sizes="95vw"
                className="object-contain select-none p-4 md:p-10"
                priority
              />
            </div>
            {post.imageUrls.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-white/80 bg-black/50 px-3 py-1 rounded-full text-sm">
                {modalImageIndex + 1} / {post.imageUrls.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
