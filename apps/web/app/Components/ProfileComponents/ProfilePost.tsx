"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Post } from "../../store";
import { getImageUrl } from "../../lib/utils"; // Import the helper

// -----------------------------------------------------------------
// ProfilePost Component
// -----------------------------------------------------------------
export default function ProfilePost({
  post,
  userImageUrl,
}: {
  post: Post;
  userImageUrl?: string | null;
}) {
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

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  
  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev < post.imageUrls.length - 1 ? prev + 1 : 0
    );
  };
  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev > 0 ? prev - 1 : post.imageUrls.length - 1
    );
  };

  const renderImageGrid = () => {
    // ... (This function is identical to your provided code)
    const count = post.imageUrls.length;
    if (count === 0) return null;
    const gridBase =
      "relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-zinc-700";
    if (count === 1) {
      return (
        <div
          className={`${gridBase} cursor-pointer`}
          onClick={() => openModal(0)}
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
              onClick={() => openModal(index)}
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
            onClick={() => openModal(0)}
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
            onClick={() => openModal(1)}
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
            onClick={() => openModal(2)}
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
            onClick={() => openModal(index)}
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
      className="p-4 border-b border-zinc-700 transition-colors hover:bg-white/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
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

          {/* Name and Date */}
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
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-blue-500 hover:underline mt-2 text-sm font-medium"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Image Grid */}
      {renderImageGrid()}

      {/* Image Modal */}
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
}
