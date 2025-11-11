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
  User,
  Link,
  Unlink,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { getImageUrl } from "@lib/utils";
import { GigElement, MapElement } from "./MapTypes";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/constants";

type GigDetailSidebarProps = {
  gig: GigElement;
  currentUserId?: string;
  onClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onShowLightbox: (index: number) => void;
  onSaveEdit: (updatedData: Partial<GigElement> & { roomId?: string | null }) => void;
  onSelectRoom: (room: MapElement) => void;
};

export default function GigDetailSidebar({
  gig,
  currentUserId,
  onClose,
  onNavigate,
  onDelete,
  onShowLightbox,
  onSaveEdit,
  onSelectRoom,
}: GigDetailSidebarProps) {
  const isOwner = currentUserId === gig.createdBy?.id;

  const [isEditing, setIsEditing] = useState(false);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [connectRoomId, setConnectRoomId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: gig.title || "",
    description: gig.description || "",
    reward: gig.reward || "",
    date: gig.date ? new Date(gig.date).toISOString().slice(0, 16) : "",
    expiresAt: gig.expiresAt
      ? new Date(gig.expiresAt).toISOString().slice(0, 16)
      : "",
  });

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({
      title: gig.title || "",
      description: gig.description || "",
      reward: gig.reward || "",
      date: gig.date ? new Date(gig.date).toISOString().slice(0, 16) : "",
      expiresAt: gig.expiresAt
        ? new Date(gig.expiresAt).toISOString().slice(0, 16)
        : "",
    });
  };

  const handleChange = (
    field: string,
    value: string,
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveDetails = () => {
    onSaveEdit(form);
    setIsEditing(false);
  };

  const handleConnectRoom = async () => {
    const rId = connectRoomId.trim();
    if (!rId) {
      setModalError("Room ID cannot be empty.");
      return;
    }
    
    // UUIDs are strings, so no parseInt needed, but we check validity on the backend
    setIsVerifying(true);
    setModalError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/map/room/${rId}`);
      if (!res.ok) {
        throw new Error("Room not found or ID is invalid.");
      }
      onSaveEdit({ roomId: rId });
      setShowRoomModal(false);
      setConnectRoomId("");
    } catch (err: any) {
      setModalError(err.message || "An error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectRoom = () => {
    onSaveEdit({ roomId: null });
  };

  const handleRoomClick = () => {
    if (gig.room) {
      onSelectRoom(gig.room as MapElement);
    }
  };

  return (
    <>
      {/* CONNECT ROOM MODAL */}
      {showRoomModal && (
        <div className="absolute z-50 inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center font-inter">
          <div className="bg-[#1C1C1E] border border-zinc-700 rounded-xl shadow-xl w-96 p-6 space-y-4">
            <h3 className="text-lg font-medium text-white">Connect to Room</h3>
            <p className="text-sm text-zinc-400">
              Enter the ID of the room you want to link to this gig.
            </p>
            <input
              type="text"
              value={connectRoomId}
              onChange={(e) => {
                setConnectRoomId(e.target.value);
                setModalError(null);
              }}
              placeholder="Room ID (UUID)..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 transition"
            />
            {modalError && (
              <p className="text-red-400 text-sm">{modalError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowRoomModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectRoom}
                disabled={isVerifying}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {isVerifying && <Loader2 size={16} className="animate-spin" />}
                {isVerifying ? "Verifying..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN SIDEBAR */}
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
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-transparent border-b-2 border-zinc-700 focus:border-white outline-none text-2xl font-semibold w-3/4 py-1 text-white"
              placeholder="Gig Title..."
            />
          ) : (
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              {gig.title}
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
                  onClick={handleSaveDetails}
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
          {/* IMAGES */}
          {gig.imageUrls?.length > 0 && (
            <div className="space-y-3">
              <div
                className="relative w-full h-64 rounded-xl overflow-hidden group cursor-pointer"
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
                <div className="grid grid-cols-4 gap-3">
                  {gig.imageUrls.slice(1, 5).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-full h-20 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => onShowLightbox(idx + 1)}
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

          {/* CREATOR INFO */}
          {gig.createdBy && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Created By
              </h3>
              <div className="flex items-center gap-3">
                <Image
                  src={getImageUrl(gig.createdBy.image)}
                  alt={gig.createdBy.name}
                  width={40}
                  height={40}
                  className="rounded-full bg-zinc-800 border border-zinc-700"
                />
                <div>
                  <p className="font-medium text-white">{gig.createdBy.name}</p>
                  <p className="text-sm text-zinc-400">@{gig.createdBy.username}</p>
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
              <div className="space-y-4">
                <textarea
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 resize-none transition"
                  rows={5}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description..."
                />
                <input
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 transition"
                  value={form.reward}
                  onChange={(e) => handleChange("reward", e.target.value)}
                  placeholder="Reward (e.g., 500, 'Free Coffee')"
                />
                <div>
                  <label className="text-xs text-zinc-400">Gig Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 transition [color-scheme:dark]"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Expires At</label>
                  <input
                    type="datetime-local"
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/30 transition [color-scheme:dark]"
                    value={form.expiresAt}
                    onChange={(e) => handleChange("expiresAt", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                {gig.reward && (
                  <p className="flex items-start gap-3">
                    <Coins size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-white">Reward:</span> {gig.reward}
                    </span>
                  </p>
                )}
                {gig.description && (
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {gig.description}
                  </p>
                )}
                {gig.date && (
                  <p className="flex items-center gap-3 text-zinc-400">
                    <Calendar size={16} className="flex-shrink-0" /> {new Date(gig.date).toLocaleString()}
                  </p>
                )}
                {gig.expiresAt && (
                  <p className="flex items-center gap-3 text-red-400">
                    <Clock size={16} className="flex-shrink-0" /> Expires{" "}
                    {new Date(gig.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* LINKED ROOM */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Linked Room
            </h3>
            {gig.room ? (
              <button
                onClick={handleRoomClick}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between text-left hover:border-zinc-700 transition"
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
              <p className="text-sm text-zinc-500">
                No room linked to this gig yet.
              </p>
            )}

            {isOwner && isEditing && (
              gig.room ? (
                <button
                  onClick={handleDisconnectRoom}
                  className="w-full mt-2 py-2.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Unlink size={16} /> Disconnect from Room
                </button>
              ) : (
                <button
                  onClick={() => setShowRoomModal(true)}
                  className="w-full mt-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Link size={16} /> Connect to Room
                </button>
              )
            )}
          </section>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 p-4 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 px-4 py-3 bg-white hover:bg-zinc-200 text-black text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <Navigation size={16} /> Navigate
          </button>

          {isOwner && !isEditing && (
            <button
              onClick={onDelete}
              className="px-4 py-3 bg-red-900/50 hover:bg-red-800/60 text-red-300 hover:text-red-200 text-sm font-medium rounded-lg transition flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
