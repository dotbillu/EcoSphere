"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom, Gig } from "../store";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface CreateGigModalProps {
  location: { lat: number | null; lng: number | null };
  onClose: () => void;
  onSuccess: (newGig: Gig) => void;
}

export default function CreateGigModal({
  location,
  onClose,
  onSuccess,
}: CreateGigModalProps) {
  const [user] = useAtom(userAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Music");
  const [date, setDate] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
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
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("creatorId", user.id.toString());
    if (date) {
      formData.append("date", new Date(date).toISOString());
    }
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    try {
      const res = await fetch("http://localhost:4000/map/gig", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create gig");
      }

      const newGig: Gig = await res.json();
      onSuccess(newGig);
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
          <h2 className="text-xl font-bold">Create a New Gig</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-300">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              >
                <option>Music</option>
                <option>Art</option>
                <option>Market</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-zinc-300">Date</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300">
              Images (Max 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(e.target.files)}
              className="mt-1 w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Gig"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

