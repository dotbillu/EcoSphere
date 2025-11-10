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
} from "lucide-react";
import { getImageUrl } from "../../../lib/utils";
import { MapElement } from "./MapTypes";
import { motion } from "framer-motion"; // <-- Import motion

type RoomDetailSidebarProps = {
  room: MapElement;
  currentUserId?: number;
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

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-0 left-0 z-40 h-full w-[480px] bg-black border-r border-zinc-800 text-zinc-100 flex flex-col shadow-2xl font-inter"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
        {isEditing ? (
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="bg-transparent border-b-2 border-zinc-700 focus:border-white outline-none text-2xl font-semibold w-3/4 py-1 text-white"
            placeholder="Room Name..."
          />
        ) : (
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {room.name}
          </h2>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
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
                className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition"
              >
                <Check size={20} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
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

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        {/* IMAGE */}
        {room.imageUrl && (
          <div className="relative w-full h-64 rounded-xl overflow-hidden group">
            <Image
              src={getImageUrl(room.imageUrl)}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* CREATOR INFO */}
        {room.createdBy && (
           <section className="space-y-3">
             <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
               Created By
             </h3>
              <div className="flex items-center gap-3">
                <Image
                  src={getImageUrl(room.createdBy.image)}
                  alt={room.createdBy.name}
                  width={40}
                  height={40}
                  className="rounded-full bg-zinc-800 border border-zinc-700"
                />
                <div>
                  <p className="font-medium text-white">{room.createdBy.name}</p>
                  <p className="text-sm text-zinc-400">@{room.createdBy.username}</p>
                </div>
              </div>
           </section>
        )}

        {/* DETAILS */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Details
          </h3>
          {isEditing ? (
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 resize-none transition"
              rows={5}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Room description..."
            />
          ) : (
            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <p className="flex items-center gap-3">
                <span className="text-zinc-500">#</span>
                <span className="font-medium text-zinc-400">ID: {room.id}</span>
              </p>
              {room.description ? (
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {room.description}
                </p>
              ) : (
                 <p className="text-zinc-500">No description provided.</p>
              )}
              {room.createdAt && (
                <p className="flex items-center gap-3 text-zinc-400">
                  <Calendar size={16} className="flex-shrink-0" /> 
                  Created {new Date(room.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </section>

        {/* MEMBERS */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} /> Members ({room.members?.length || 0})
          </h3>
          {room.members && room.members.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 text-sm text-zinc-300 max-h-40 overflow-y-auto">
              {room.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Image
                    src={getImageUrl(m.image)}
                    alt={m.name || 'avatar'}
                    width={24}
                    height={24}
                    className="rounded-full bg-zinc-700"
                  />
                  <span className="truncate">{m.name || `User ${m.id}`}</span>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-sm text-zinc-500">No members yet.</p>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 flex gap-3">
        {canJoin && (
           <button
             onClick={onJoin}
             className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
           >
             <LogIn size={16} /> Join Room
           </button>
        )}
        
        <button
          onClick={onNavigate}
          className={`px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${
            canJoin ? "flex-grow-0" : "flex-1"
          }`}
        >
          <Navigation size={16} /> 
          <span className={canJoin ? "sr-only" : ""}>Navigate</span>
        </button>
        
        {isOwner && (
          <button
            onClick={onDelete}
            className="px-4 py-3 bg-red-900/50 hover:bg-red-800/60 text-red-300 hover:text-red-200 text-sm font-medium rounded-lg transition flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
