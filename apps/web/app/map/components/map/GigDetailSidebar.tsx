"use client";

import Image from "next/image";
import {
  Navigation,
  Trash2,
  X,
  Pencil,
  Check,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  Coins,
  Link,
  Unlink,
  Handshake,
} from "lucide-react";
import { useState } from "react";
import { getImageUrl, haversineDistance } from "@/lib/utils";
import { GigElement, MapElement } from "./MapTypes";
import { motion } from "framer-motion";
import { User as UserType } from "@/store";
import LinkNext from "next/link";

type GigDetailSidebarProps = {
  gig: GigElement;
  currentUser?: UserType | null;
  userLocation: { lat: number; lng: number };
  onCloseAction: () => void;
  onDeleteAction: () => void;
  onShowLightboxAction: (index: number) => void;
  onSaveEditAction: (
    updatedData: Partial<GigElement> & { roomId?: string | null },
  ) => void;
  onSelectRoomAction: (room: MapElement) => void;
};

export default function GigDetailSidebar({
  gig,
  currentUser,
  userLocation,
  onCloseAction,
  onDeleteAction,
  onShowLightboxAction,
  onSaveEditAction,
  onSelectRoomAction,
}: GigDetailSidebarProps) {
  const isOwner = currentUser?.id === gig.createdBy?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: gig.title || "",
    description: gig.description || "",
    reward: gig.reward || "",
    date: gig.date ? gig.date.slice(0, 16) : "",
    expiresAt: gig.expiresAt ? gig.expiresAt.slice(0, 16) : "",
  });

  const distance = haversineDistance(
    userLocation.lat,
    userLocation.lng,
    gig.latitude,
    gig.longitude,
  );

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({
      title: gig.title || "",
      description: gig.description || "",
      reward: gig.reward || "",
      date: gig.date ? gig.date.slice(0, 16) : "",
      expiresAt: gig.expiresAt ? gig.expiresAt.slice(0, 16) : "",
    });
  };

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveDetails = () => {
    onSaveEditAction({
      ...form,
      date: form.date ? new Date(form.date).toISOString() : undefined,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
    });
    setIsEditing(false);
  };

  const handleRoomClick = () => {
    if (gig.room) {
      onSelectRoomAction(gig.room as unknown as MapElement);
    }
  };

  const acceptGigUrl = `/network/${gig.createdBy?.id}?gigRef=${gig.id}`;

  const handleNavigate = () => {
    window.open(
      `http://googleusercontent.com/maps.google.com/maps?daddr=${gig.latitude},${gig.longitude}`,
      "_blank",
    );
  };

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 z-40 h-full w-full max-w-md bg-black text-zinc-100 flex flex-col shadow-2xl md:w-[480px] md:border-r md:border-zinc-800"
    >
      <div className="flex-shrink-0 flex items-start justify-between p-4 border-b border-zinc-800">
        {isEditing ? (
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="bg-zinc-900 border border-zinc-700 focus:border-white outline-none text-xl font-semibold w-full py-1 px-2 rounded-md text-white"
            placeholder="Gig Title..."
          />
        ) : (
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {gig.title}
          </h2>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            >
              <Pencil size={18} />
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSaveDetails}
                className="p-2 rounded-lg text-white hover:bg-zinc-800 transition"
              >
                <Check size={20} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <XCircle size={20} />
              </button>
            </>
          )}
          <button
            onClick={onCloseAction}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grow overflow-y-auto p-4 space-y-6">
        {gig.imageUrls?.length > 0 && (
          <div className="space-y-2">
            <div
              className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => onShowLightboxAction(0)}
            >
              <Image
                src={getImageUrl(gig.imageUrls[0])}
                alt={gig.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {gig.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gig.imageUrls.slice(1, 5).map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-16 rounded-md overflow-hidden cursor-pointer group"
                    onClick={() => onShowLightboxAction(idx + 1)}
                  >
                    <Image
                      src={getImageUrl(url)}
                      alt={`thumb ${idx}`}
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {gig.createdBy && (
          <InfoSection title="Created By">
            <LinkNext
              href={`/profile/${gig.createdBy.username}`}
              className="flex items-center gap-3 group"
            >
              <Image
                src={getImageUrl(gig.createdBy.image)}
                alt={gig.createdBy.name}
                width={40}
                height={40}
                className="rounded-full bg-zinc-800 border border-zinc-700"
              />
              <div>
                <p className="font-medium text-white group-hover:underline">
                  {gig.createdBy.name}
                </p>
                <p className="text-sm text-zinc-400">
                  @{gig.createdBy.username}
                </p>
              </div>
            </LinkNext>
          </InfoSection>
        )}

        <InfoSection title="Details">
          <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description..."
                />
                <input
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50"
                  value={form.reward}
                  onChange={(e) => handleChange("reward", e.target.value)}
                  placeholder="Reward (e.g., 500, 'Free Coffee')"
                />
                <div>
                  <label className="text-xs text-zinc-400">Gig Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 scheme-dark"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Expires At</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 scheme-dark"
                    value={form.expiresAt}
                    onChange={(e) => handleChange("expiresAt", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={MapPin} text={distance} />
                <InfoRow
                  icon={Coins}
                  text={gig.reward || "No reward specified"}
                />
                {gig.description && (
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {gig.description}
                  </p>
                )}
                {gig.date && (
                  <InfoRow
                    icon={Calendar}
                    text={new Date(gig.date).toLocaleString()}
                  />
                )}
                {gig.expiresAt && (
                  <InfoRow
                    icon={Clock}
                    text={`Expires ${new Date(gig.expiresAt).toLocaleString()}`}
                    colorClass="text-zinc-400"
                  />
                )}
              </>
            )}
          </div>
        </InfoSection>

        <InfoSection title="Linked Room">
          {gig.room ? (
            <button
              onClick={handleRoomClick}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between text-left hover:border-zinc-700 transition"
            >
              <div>
                <p className="text-base font-medium text-white">
                  {gig.room.name}
                </p>
                <p className="text-sm text-zinc-400">
                  {gig.room.type || "No type"}
                </p>
              </div>
              <MapPin size={20} className="text-zinc-500" />
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No room linked to this gig.</p>
          )}
          {isOwner &&
            isEditing &&
            (gig.room ? (
              <button
                onClick={() => onSaveEditAction({ roomId: null })}
                className="w-full mt-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <Unlink size={16} /> Disconnect Room
              </button>
            ) : (
              <button
                disabled
                className="w-full mt-2 py-2.5 bg-zinc-800 text-zinc-500 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Link size={16} /> Connect Room (via Create)
              </button>
            ))}
        </InfoSection>
      </div>

      <div className="shrink-0 p-4 border-t border-zinc-800 flex gap-3">
        {!isOwner && currentUser && (
          <LinkNext
            href={acceptGigUrl}
            className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <Handshake size={16} /> Accept Gig
          </LinkNext>
        )}
        <button
          onClick={handleNavigate}
          className={`px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${
            !isOwner && currentUser ? "grow-0" : "flex-1"
          }`}
        >
          <Navigation size={16} />
          <span className={!isOwner && currentUser ? "sr-only" : ""}>
            Navigate
          </span>
        </button>
        {isOwner && !isEditing && (
          <button
            onClick={onDeleteAction}
            className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm font-medium rounded-lg transition flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

const InfoSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
      {title}
    </h3>
    {children}
  </section>
);

const InfoRow = ({
  icon: Icon,
  text,
  colorClass = "text-zinc-400",
}: {
  icon: React.ElementType;
  text: string;
  colorClass?: string;
}) => (
  <p className={`flex items-center gap-3 ${colorClass}`}>
    <Icon size={16} className="shrink-0" />
    <span className="text-zinc-200">{text}</span>
  </p>
);
