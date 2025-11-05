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
} from "lucide-react";
import { useState } from "react";
import { getImageUrl } from "../../../lib/utils";
import { GigElement } from "./MapTypes";

type GigDetailSidebarProps = {
  gig: GigElement;
  currentUserId?: number;
  onClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onShowLightbox: (index: number) => void;
  onSaveEdit: (updatedGig: Partial<GigElement>) => void;
};

export default function GigDetailSidebar({
  gig,
  currentUserId,
  onClose,
  onNavigate,
  onDelete,
  onShowLightbox,
  onSaveEdit,
}: GigDetailSidebarProps) {
  const isOwner = currentUserId === gig.creatorId;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: gig.title || "",
    description: gig.description || "",
    reward: gig.reward || "",
    date: gig.date ? new Date(gig.date).toISOString().slice(0, 16) : "",
    expiresAt: gig.expiresAt
      ? new Date(gig.expiresAt).toISOString().slice(0, 16)
      : "",
  });

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSaveEdit(form);
    setIsEditing(false);
  };

  return (
    <div className="absolute top-0 left-0 z-40 h-full w-[480px] bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800 text-white flex flex-col shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        {isEditing ? (
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="bg-transparent border-b border-zinc-700 focus:border-neutral-400 outline-none text-xl font-semibold w-3/4"
          />
        ) : (
          <h2 className="text-2xl font-semibold text-neutral-100 tracking-tight leading-tight">
            {gig.title}
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
        {/* IMAGES */}
        {gig.imageUrls?.length > 0 && (
          <div className="space-y-2">
            <div
              className="relative w-full h-60 rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => onShowLightbox(0)}
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
                    className="relative w-full h-20 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => onShowLightbox(idx + 1)}
                  >
                    <Image
                      src={getImageUrl(url)}
                      alt={`thumb ${idx}`}
                      fill
                      className="object-cover hover:opacity-90"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAILS */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            Details
          </h3>
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-neutral-400 resize-none"
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description..."
              />
              <input
                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-neutral-400"
                value={form.reward}
                onChange={(e) => handleChange("reward", e.target.value)}
                placeholder="Reward (₹)"
              />
              <input
                type="datetime-local"
                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-neutral-400"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
              <input
                type="datetime-local"
                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-200 focus:outline-none focus:border-neutral-400"
                value={form.expiresAt}
                onChange={(e) => handleChange("expiresAt", e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
              {gig.reward && (
                <p className="flex items-center gap-2">
                  <Coins size={15} className="text-yellow-400" />
                  <span className="font-medium">Reward:</span> ₹{gig.reward}
                </p>
              )}
              {gig.description && (
                <p className="text-neutral-300 whitespace-pre-wrap leading-snug">
                  {gig.description}
                </p>
              )}
              {gig.date && (
                <p className="flex items-center gap-2 text-neutral-400">
                  <Calendar size={15} /> {new Date(gig.date).toLocaleString()}
                </p>
              )}
              {gig.expiresAt && (
                <p className="flex items-center gap-2 text-red-400">
                  <Clock size={15} /> Expires{" "}
                  {new Date(gig.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </section>

        {/* LINKED ROOMS */}
        {gig.rooms && gig.rooms.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              Linked Rooms
            </h3>
            <div className="space-y-2">
              {gig.rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex items-center justify-between hover:border-neutral-500 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-100">
                      {room.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {room.description || "No description"}
                    </p>
                  </div>
                  <MapPin size={18} className="text-neutral-400" />
                </div>
              ))}
            </div>
            <button
              onClick={() => console.log("Connect to Room clicked")}
              className="w-full mt-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition"
            >
              Connect to Room
            </button>
          </section>
        ) : (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              Rooms
            </h3>
            <p className="text-sm text-neutral-500">
              No rooms linked to this gig yet.
            </p>
            <button
              onClick={() => console.log("Connect to Room clicked")}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition"
            >
              Connect to Room
            </button>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 flex gap-3">
        <button
          onClick={onNavigate}
          className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          <Navigation size={16} /> Navigate
        </button>

        {isOwner && !isEditing && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

