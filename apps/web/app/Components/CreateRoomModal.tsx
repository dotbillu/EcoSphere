"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, MapRoom } from "../store";
import { X, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface CreateRoomModalProps {
  location: { lat: number | null; lng: number | null };
  onClose: () => void;
  onSuccess: (newRoom: MapRoom) => void;
}

export default function CreateRoomModal({
  location,
  onClose,
  onSuccess,
}: CreateRoomModalProps) {
  const [user] = useAtom(userAtom);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Public");
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location.lat || !location.lng) {
      setError("User or location is missing.");
      return;
    }
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("creatorId", user.id.toString());
    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await fetch("http://localhost:4000/map/room", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create room");
      }

      const newRoom: MapRoom = await res.json();
      onSuccess(newRoom);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 text-white"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-xl font-bold">Create a New Room</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
            >
              <option>Public</option>
              <option>Private</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300">
              Room Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Room"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

