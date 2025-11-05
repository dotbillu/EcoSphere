"use client";

import Image from "next/image";
import { useState } from "react";
import {
  X,
  Trash2,
  Navigation,
  Users,
  Calendar,
  Pencil,
  Check,
  XCircle,
} from "lucide-react";
import { getImageUrl } from "../../../lib/utils";
import { MapElement } from "./MapTypes";

type RoomDetailSidebarProps = {
  room: MapElement;
  currentUserId?: number;
  onClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onJoin: () => void;
};

export default function RoomDetailSidebar({
  room,
  currentUserId,
  onClose,
  onNavigate,
  onDelete,
  onJoin,
}: RoomDetailSidebarProps) {
  const isOwner = currentUserId === room.creatorId;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: room.name || "",
    description: room.description || "",
  });

  const handleChange = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    // todo: hook with backend edit
    console.log("save edit", form);
    setIsEditing(false);
  };

  return (
    <div className="absolute top-0 left-0 z-40 h-full w-[460px] bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800 text-white flex flex-col shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        {isEditing ? (
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="bg-transparent border-b border-zinc-700 focus:border-neutral-400 outline-none text-xl font-semibold w-3/4"
          />
        ) : (
          <h2 className="text-2xl font-semibold text-neutral-200 tracking-tight">
            {room.name}
          </h2>
        )}
        <div className="flex items-center gap-2">
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-md hover:bg-zinc-800 transition"
            >
              <Pencil size={18} />
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 rounded-md hover:bg-green-500/20 text-green-400 transition"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition"
              >
                <XCircle size={20} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        {/* IMAGE */}
        {room.imageUrl && (
          <div className="relative w-full h-60 rounded-xl overflow-hidden">
            <Image
              src={getImageUrl(room.imageUrl)}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* INFO */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-400">DETAILS</h3>

          {isEditing ? (
            <textarea
              className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-neutral-400 resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Room description..."
            />
          ) : (
            <div className="space-y-3 text-sm text-neutral-300">
              <p className="flex items-center gap-2">
                🆔 <span className="font-medium">Room ID:</span> {room.id}
              </p>
              {room.description && (
                <p className="whitespace-pre-wrap">{room.description}</p>
              )}
              {room.createdAt && (
                <p className="flex items-center gap-2 text-neutral-400">
                  <Calendar size={15} />{" "}
                  Created {new Date(room.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </section>

        {/* MEMBERS */}
        {room.members && room.members.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Users size={14} /> MEMBERS
            </h3>
            <div className="space-y-1 text-sm text-neutral-300 max-h-40 overflow-y-auto">
              {room.members.map((m) => (
                <p key={m.id} className="truncate">
                  {m.username || `User ${m.id}`}
                </p>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 flex gap-3">
        <button
          onClick={onJoin}
          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
        >
          Join Room
        </button>
        <button
          onClick={onNavigate}
          className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          <Navigation size={16} /> Navigate
        </button>
        {isOwner && !isEditing && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

