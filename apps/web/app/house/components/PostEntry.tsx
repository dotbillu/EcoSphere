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
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { Post, UserProfile } from "@/store";
import Avatar from "../ui/Avatar";

const LinkComp = Link as React.ElementType;
const ImageComp = Image as React.ElementType;

interface PostEntryProps {
  post: Post;
  currentUserId?: string;
  loggedInUser?: UserProfile;
  onLikeToggle: (postId: string) => void;
  onNavigate: (postId: string) => void;
  onPrefetchProfile: (username: string) => void;
  onPrefetchPost: (postId: string) => void;
  onFollowToggle: (username: string) => void;
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsTruncation, setNeedsTruncation] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    const isLikedByCurrentUser = post.likes.some(
      (like) => String(like.userId) === String(currentUserId),
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

    const navigateImage = (e: React.MouseEvent, dir: "next" | "prev") => {
      e.stopPropagation();
      setModalImageIndex((prev) => {
        if (dir === "next")
          return prev < post.imageUrls.length - 1 ? prev + 1 : 0;
        return prev > 0 ? prev - 1 : post.imageUrls.length - 1;
      });
    };

    const renderImageGrid = () => {
      const count = post.imageUrls.length;
      if (count === 0) return null;
      const gridBase =
        "relative w-full h-80 rounded-xl overflow-hidden mt-3 border border-zinc-800";

      const ImageItem = ({
        url,
        idx,
        className = "",
      }: {
        url: string;
        idx: number;
        className?: string;
      }) => (
        <div
          className={`relative h-full cursor-pointer ${className}`}
          onClick={(e) => openModal(e, idx)}
        >
          <ImageComp
            src={getImageUrl(url)}
            alt="Post content"
            fill
            className="object-cover"
          />
        </div>
      );

      if (count === 1)
        return (
          <div className={gridBase}>
            <ImageItem url={post.imageUrls[0]} idx={0} />
          </div>
        );
      if (count === 2)
        return (
          <div className={`${gridBase} grid grid-cols-2 gap-0.5`}>
            <ImageItem url={post.imageUrls[0]} idx={0} />
            <ImageItem url={post.imageUrls[1]} idx={1} />
          </div>
        );
      if (count === 3)
        return (
          <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
            <div className="row-span-2">
              <ImageItem url={post.imageUrls[0]} idx={0} />
            </div>
            <ImageItem url={post.imageUrls[1]} idx={1} />
            <ImageItem url={post.imageUrls[2]} idx={2} />
          </div>
        );

      return (
        <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
          {post.imageUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="relative h-full cursor-pointer"
              onClick={(e) => openModal(e, i)}
            >
              <ImageComp
                src={getImageUrl(url)}
                alt=""
                fill
                className="object-cover"
              />
              {count > 4 && i === 3 && (
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
        onClick={() => onNavigate(String(post.id))}
        onViewportEnter={() => {
          onPrefetchProfile(post.username);
          onPrefetchPost(String(post.id));
        }}
        className="flex space-x-3 p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-900/30 transition-colors"
      >
        <div onClick={stopPropagation} className="flex-shrink-0">
          <LinkComp href={`/profile/${post.username}`}>
            <Avatar src={post.user?.image} name={post.username} size={40} />
          </LinkComp>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 flex-wrap"
              onClick={stopPropagation}
            >
              <LinkComp
                href={`/profile/${post.username}`}
                className="text-white font-bold hover:underline text-[15px]"
                onMouseEnter={() => onPrefetchProfile(post.username)}
              >
                {post.name || post.username}
              </LinkComp>
              <LinkComp
                href={`/profile/${post.username}`}
                className="text-zinc-500 hover:underline text-sm"
              >
                @{post.username}
              </LinkComp>
              <span className="text-zinc-600 text-sm">·</span>
              <span className="text-zinc-500 text-sm hover:underline">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            {post.location && (
              <div className="text-zinc-500 text-xs flex items-center gap-1 ml-auto">
                <MapPin size={12} />
                {post.location}
              </div>
            )}
          </div>

          <p
            ref={contentRef}
            className={`text-zinc-100 mt-1 whitespace-pre-wrap break-words text-[15px] leading-normal ${
              !isExpanded ? "line-clamp-[8]" : ""
            }`}
          >
            {post.content}
          </p>
          {(needsTruncation || isExpanded) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-blue-500 hover:underline mt-2 text-sm"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}

          {renderImageGrid()}

          <div className="flex items-center justify-between mt-3 max-w-md">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(String(post.id));
              }}
              className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm">{post._count.comments}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLikeToggle(String(post.id));
              }}
              disabled={!currentUserId}
              className={`flex items-center gap-2 transition-colors group ${
                isLikedByCurrentUser
                  ? "text-pink-600"
                  : "text-zinc-500 hover:text-pink-600"
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-600/10 transition-colors">
                <Heart
                  size={18}
                  fill={isLikedByCurrentUser ? "currentColor" : "none"}
                />
              </div>
              <span className="text-sm">{post._count.likes}</span>
            </button>
          </div>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
            onClick={closeModal}
          >
            <button
              className="absolute top-4 left-4 text-white p-2 bg-zinc-800 rounded-full"
              onClick={closeModal}
            >
              <X size={24} />
            </button>
            <div
              className="relative w-full h-full max-w-7xl max-h-[90vh] p-4"
              onClick={stopPropagation}
            >
              <ImageComp
                src={getImageUrl(post.imageUrls[modalImageIndex])}
                alt="Expanded"
                fill
                className="object-contain"
              />
            </div>
            {post.imageUrls.length > 1 && (
              <>
                <button
                  className="absolute left-4 text-white p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700"
                  onClick={(e) => navigateImage(e, "prev")}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-4 text-white p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700"
                  onClick={(e) => navigateImage(e, "next")}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    );
  },
);
PostEntry.displayName = "PostEntry";
export default PostEntry;
