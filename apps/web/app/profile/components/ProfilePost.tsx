"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Post } from "../../store";
import { getImageUrl } from "../../lib/utils";

export default function ProfilePost({
  post,
  userImageUrl,
  currentUserId,
  onLikeToggle,
  onNavigate,
}: {
  post: Post;
  userImageUrl?: string | null;
  currentUserId?: string; // CHANGED: type is now string (UUID)
  onLikeToggle: (postId: string) => void; // CHANGED: postId is now string
  onNavigate: (postId: string) => void; // CHANGED: postId is now string
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // CHANGED: Compare string UUIDs
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
      key={post.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      onClick={() => onNavigate(post.id)}
      className="p-4 border-b border-zinc-700 transition-colors hover:bg-white/5 cursor-pointer"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-2"
        onClick={stopPropagation}
      >
        <div className="flex items-center gap-3">
          {userImageUrl ? (
            <Image
              src={getImageUrl(userImageUrl)}
              alt={post.name}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
              {post.name[0]}
            </div>
          )}

          <div className="flex items-center gap-2">
            <p className="text-white font-bold">{post.name}</p>
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
      <p
        ref={contentRef}
        className={`text-zinc-200 whitespace-pre-wrap break-words ${
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

      {/* Like/Comment Bar */}
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
            className="group-hover:scale-110 transition-transform cursor-pointer"
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
            className="group-hover:scale-110 cursor-pointer transition-transform"
          />
          <span className="text-sm">{post._count.comments}</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={closeModal}
          >
            <X size={24} />
          </button>
          <button
            className="absolute left-4 text-white"
            onClick={showPrevImage}
          >
            <ChevronLeft size={32} />
          </button>
          <div className="relative w-[90vw] h-[80vh]">
            <Image
              src={getImageUrl(post.imageUrls[modalImageIndex])}
              alt="Modal image"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          <button
            className="absolute right-4 text-white"
            onClick={showNextImage}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
