"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { Following } from "@/store";
import Avatar from "../ui/Avatar";

const LinkComp = Link as React.ElementType;
const ImageComp = Image as React.ElementType;

interface ActivityGigData {
  id: string | number;
  title: string;
  description: string;
  createdAt: string;
  imageUrls: string[];
  createdBy: Following;
  reward?: string;
  type?: string;
  date: string;
}

interface ActivityRoomData {
  id: string | number;
  name: string;
  description: string;
  createdAt: string;
  imageUrl: string | null;
  createdBy: Following;
  type?: string;
}

interface ActivityItemGig {
  type: "gig";
  data: ActivityGigData;
}

interface ActivityItemRoom {
  type: "room";
  data: ActivityRoomData;
}

export type MapActivityData = ActivityItemGig | ActivityItemRoom;

interface MapActivityEntryProps {
  item: MapActivityData;
  onNavigate: (type: "gig" | "room", id: string) => void;
  onPrefetchProfile: (username: string) => void;
}

const MapActivityEntry = React.forwardRef<
  HTMLDivElement,
  MapActivityEntryProps
>(({ item, onNavigate, onPrefetchProfile }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, type } = item;
  const author = data.createdBy;
  const isGig = type === "gig";

  const title = isGig
    ? (data as ActivityGigData).title
    : (data as ActivityRoomData).name;
  const description = data.description;

  let imageUrls: string[] = [];
  if (isGig) {
    imageUrls = (data as ActivityGigData).imageUrls || [];
  } else {
    const img = (data as ActivityRoomData).imageUrl;
    if (img) imageUrls = [img];
  }

  const profileUrl = `/profile/${author.username}`;
  const dateObj = new Date(data.createdAt);

  const handleClick = () => onNavigate(type, String(data.id));

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="flex space-x-3 p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-900/30 transition-colors"
    >
      <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
        <LinkComp href={profileUrl}>
          <Avatar src={author.image} name={author.username} size={40} />
        </LinkComp>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <LinkComp
            href={profileUrl}
            className="font-bold text-white hover:underline text-[15px]"
            onMouseEnter={() => onPrefetchProfile(author.username)}
          >
            {author.name || author.username}
          </LinkComp>
          <span className="text-zinc-500 text-sm">@{author.username}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500 text-sm">
            {dateObj.toLocaleDateString()}
          </span>
          <div className="ml-auto flex items-center text-zinc-500 text-xs gap-1">
            <MapPin size={12} /> New Delhi
          </div>
        </div>

        <h3 className="text-white font-bold text-lg leading-tight mb-2">
          {title}
        </h3>

        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3 mb-3">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            {isGig ? "Gig Details" : "Room Info"}
          </div>
          {isGig ? (
            <GigInfo data={data as ActivityGigData} />
          ) : (
            <RoomInfo
              data={data as ActivityRoomData}
              authorName={author.name || author.username}
            />
          )}
        </div>

        {description && (
          <div className="mb-2">
            <p
              className={`text-zinc-300 text-sm whitespace-pre-wrap ${
                !isExpanded ? "line-clamp-3" : ""
              }`}
            >
              {description}
            </p>
            {description.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-500 text-sm mt-1 hover:underline flex items-center"
              >
                {isExpanded ? (
                  <>
                    Show Less <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {imageUrls.length > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="relative w-full h-64 rounded-xl overflow-hidden border border-zinc-800 mt-2"
          >
            <ImageComp
              src={getImageUrl(imageUrls[0])}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="mt-2 text-xs font-medium text-zinc-500 uppercase border border-zinc-800 inline-block px-2 py-1 rounded">
          {isGig ? "Gig Alert" : "Active Room"}
        </div>
      </div>

      {modalOpen && imageUrls.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(false);
          }}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setModalOpen(false)}
          >
            <X size={30} />
          </button>
          <div className="relative w-full h-[90vh] max-w-5xl">
            <ImageComp
              src={getImageUrl(imageUrls[0])}
              alt="Full view"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
});

const GigInfo = ({ data }: { data: ActivityGigData }) => (
  <div className="grid grid-cols-2 gap-2 text-sm">
    <div className="flex items-center gap-2 text-zinc-300">
      <DollarSign size={14} className="text-green-400" /> {data.reward || "N/A"}
    </div>
    <div className="flex items-center gap-2 text-zinc-300">
      <Calendar size={14} className="text-blue-400" />{" "}
      {new Date(data.date).toLocaleDateString()}
    </div>
    <div className="flex items-center gap-2 text-zinc-300 col-span-2">
      <Tag size={14} className="text-purple-400" /> {data.type || "General"}
    </div>
  </div>
);

const RoomInfo = ({
  data,
  authorName,
}: {
  data: ActivityRoomData;
  authorName: string;
}) => (
  <div className="space-y-1 text-sm text-zinc-300">
    <div className="flex items-center gap-2">
      <Tag size={14} className="text-yellow-400" /> {data.type || "Public"} Room
    </div>
    <div className="flex items-center gap-2">
      <Info size={14} className="text-cyan-400" /> Created by {authorName}
    </div>
  </div>
);

MapActivityEntry.displayName = "MapActivityEntry";

export default MapActivityEntry;
