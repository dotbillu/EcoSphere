"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import {
  X,
  Trash2,
  Navigation,
  Users,
  Calendar,
  Pencil,
  Check,
  XCircle,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { getImageUrl } from "@lib/utils";
import { MapElement } from "./MapTypes";
import { motion } from "framer-motion";
import Link from "next/link";

type RoomDetailSidebarProps = {
  room: MapElement;
  currentUserId?: string;
  onClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onJoin: () => void;
  onSaveEdit: (updatedData: { name: string; description: string }) => void;
};

export default function RoomDetailSidebar({
  room,
  currentUserId,
  onClose,
  onNavigate,
  onDelete,
  onJoin,
  onSaveEdit,
}: RoomDetailSidebarProps) {
  const isOwner = currentUserId === room.createdBy?.id;
  const isMember = useMemo(() => {
    if (!currentUserId || !room.members) return false;
    return room.members.some((member) => member.id === currentUserId);
  }, [currentUserId, room.members]);

  const canJoin = !isOwner && !isMember && !!currentUserId;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: room.name || "",
    description: room.description || "",
  });

  const handleChange = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    onSaveEdit(form);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({
      name: room.name || "",
      description: room.description || "",
    });
  };

  const handleNavigate = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${room.latitude},${room.longitude}`,
      "_blank"
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
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="bg-zinc-900 border border-zinc-700 focus:border-white outline-none text-xl font-semibold w-full py-1 px-2 rounded-md text-white"
            placeholder="Room Name..."
          />
        ) : (
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {room.name}
          </h2>
        )}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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
                onClick={handleSave}
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
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {room.imageUrl && (
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group">
            <Image
              src={getImageUrl(room.imageUrl)}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {room.createdBy && (
          <InfoSection title="Created By">
            <Link
              href={`/profile/${room.createdBy.username}`}
              className="flex items-center gap-3 group"
            >
              <Image
                src={getImageUrl(room.createdBy.image)}
                alt={room.createdBy.name}
                width={40}
                height={40}
                className="rounded-full bg-zinc-800 border border-zinc-700"
              />
              <div>
                <p className="font-medium text-white group-hover:underline">
                  {room.createdBy.name}
                </p>
                <p className="text-sm text-zinc-400">
                  @{room.createdBy.username}
                </p>
              </div>
            </Link>
          </InfoSection>
        )}

        <InfoSection title="Details">
          {isEditing ? (
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 resize-none transition"
              rows={5}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Room description..."
            />
          ) : (
            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <InfoRow
                icon={Calendar}
                text={`Created ${new Date(
                  room.createdAt
                ).toLocaleDateString()}`}
              />
              {room.description ? (
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {room.description}
                </p>
              ) : (
                <p className="text-zinc-500">No description provided.</p>
              )}
            </div>
          )}
        </InfoSection>

        <InfoSection title={`Members (${room.members?.length || 0})`}>
          {room.members && room.members.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {room.members.map((m) => (
                <Link
                  href={`/profile/${m.username}`}
                  key={m.id}
                  className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700"
                >
                  <Image
                    src={getImageUrl(m.image)}
                    alt={m.name || "avatar"}
                    width={24}
                    height={24}
                    className="rounded-full bg-zinc-700"
                  />
                  <span className="text-sm text-white truncate">{m.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No members yet.</p>
          )}
        </InfoSection>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-zinc-800 flex gap-3">
        {canJoin && (
          <button
            onClick={onJoin}
            className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogIn size={16} /> Join Room
          </button>
        )}
        {isMember && (
          <Link
            href={`/network/${room.id}`}
            className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} /> Go to Chat
          </Link>
        )}
        <button
          onClick={handleNavigate}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          <Navigation size={16} />
        </button>
        {isOwner && (
          <button
            onClick={onDelete}
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
    <Icon size={16} className="flex-shrink-0" />
    <span className="text-zinc-200">{text}</span>
  </p>
);
