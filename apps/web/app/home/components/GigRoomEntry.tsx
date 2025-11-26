"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Tag,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getImageUrl } from "@lib/utils";
import { ActivityItemGig, ActivityItemRoom } from "@/lib/types";

// -----------------------------------------------------------------------------
// Sub-Component: DescriptionExpander
// -----------------------------------------------------------------------------

const DescriptionExpander = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineClampClass = "line-clamp-3";
  const needsTruncation = content.length > 150;

  if (!content) return null;

  const shouldShowButton = needsTruncation && !isExpanded;

  return (
    <div className="mt-2">
      <p
        className={`text-zinc-200 whitespace-pre-wrap wrap-break-words ${
          shouldShowButton ? lineClampClass : ""
        }`}
      >
        {content}
      </p>
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
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
// Main Component: GigRoomEntry
// -----------------------------------------------------------------------------

interface GigRoomEntryProps {
  item: ActivityItemGig | ActivityItemRoom;
  onNavigate: (type: "gig" | "room", id: string) => void;
  onPrefetchProfile: (username: string) => void;
}

const GigRoomEntry = React.forwardRef<HTMLDivElement, GigRoomEntryProps>(
  ({ item, onNavigate, onPrefetchProfile }, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    const isGig = item.type === "gig";
    const data = item.data;
    const author = data.createdBy;
    const title =
      "title" in data
        ? (data as ActivityItemGig["data"]).title
        : (data as ActivityItemRoom["data"]).name;
    const description = data.description;

    // Normalize image URLs into an array
    const imageUrls =
      "imageUrls" in data
        ? (data as ActivityItemGig["data"]).imageUrls
        : (data as ActivityItemRoom["data"]).imageUrl
          ? [(data as ActivityItemRoom["data"]).imageUrl as string]
          : [];

    const navigationId = data.id;
    const profileUrl = `/profile/${author.username}`;
    const locationDisplay = "New Delhi, India"; // Hardcoded in original

    // Modal Handlers
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
        prev < imageUrls.length - 1 ? prev + 1 : 0,
      );
    };

    const showPrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setModalImageIndex((prev) =>
        prev > 0 ? prev - 1 : imageUrls.length - 1,
      );
    };

    const handleNavigation = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNavigate(item.type, navigationId);
    };

    return (
      <>
        <div
          ref={ref}
          onClick={handleNavigation}
          className="flex space-x-3 p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-900/50 transition-colors duration-200"
        >
          {/* Avatar */}
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

          {/* Content Body */}
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center justify-between mt-0.5">
              <div
                className="flex items-center gap-2 flex-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={profileUrl}
                  className="text-white font-bold hover:underline text-sm"
                  onMouseEnter={() => onPrefetchProfile(author.username)}
                >
                  {author.name || author.username}
                </Link>
                <Link
                  href={profileUrl}
                  className="text-zinc-400 hover:underline text-sm"
                  onMouseEnter={() => onPrefetchProfile(author.username)}
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

            <p className="text-white mt-1 font-bold whitespace-pre-wrap wrap-break-words text-lg">
              {title}
            </p>

            {/* Details Box */}
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
                onClick={(e) => openModal(e, 0)}
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

        {/* Image Modal (Self-Contained) */}
        {isModalOpen && imageUrls.length > 0 && (
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
            {imageUrls.length > 1 && (
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
                src={getImageUrl(imageUrls[modalImageIndex])}
                alt="Expanded image"
                fill
                style={{ objectFit: "contain" }}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                {modalImageIndex + 1} / {imageUrls.length}
              </div>
            </div>
            {imageUrls.length > 1 && (
              <button
                className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-60 hover:bg-black/80 transition-colors"
                onClick={showNextImage}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        )}
      </>
    );
  },
);

GigRoomEntry.displayName = "GigRoomEntry";
export default GigRoomEntry;
