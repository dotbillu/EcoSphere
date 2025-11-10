"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { userAtom } from "../../../store";
import { GigElement } from "./MapTypes";
import { X, Loader2, Upload } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

type CreateGigModalProps = {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: (newGig: GigElement) => void;
};

export default function CreateGigModal({
  location,
  onClose,
  onSuccess,
}: CreateGigModalProps) {
  const [user] = useAtom(userAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("TASK");
  const [reward, setReward] = useState("");
  const [date, setDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImages = (files: FileList | null) => {
    setImages(files);
    if (!files) return;
    const previews = Array.from(files).map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const allFilled = title && description && reward && type && date && expiresAt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError("You must log in first.");
    if (!allFilled) return setError("Fill all fields before submitting.");

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("creatorId", user.id.toString());
    formData.append("type", type);
    formData.append("reward", reward);
    formData.append("date", new Date(date).toISOString());
    formData.append("expiresAt", new Date(expiresAt).toISOString());
    if (images)
      Array.from(images).forEach((img) => formData.append("images", img));

    try {
      const res = await fetch(`${API_BASE_URL}/map/gig`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Failed to create gig");
      const newGig = await res.json();
      onSuccess(newGig);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-[900px] max-w-[95vw] h-[500px] flex rounded-lg border border-neutral-700/70 bg-gradient-to-tr from-neutral-950/95 via-neutral-900/90 to-neutral-950/95 shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", duration: 0.35 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-200"
          >
            <X size={20} />
          </button>

          {/* left side form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 p-8 space-y-3"
          >
            <h2 className="text-xl font-semibold text-neutral-100">
              Create Gig
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-200 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500 transition"
                  placeholder="Enter title"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-200 mb-1">
                  Reward
                </label>
                <input
                  type="number"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500 transition"
                  placeholder="₹200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Type"
                value={type}
                onChange={setType}
                options={["CLEAN", "BUILD", "MANAGEMENT", "OTHER"]}
              />
              <InputField
                label="Date"
                value={date}
                onChange={setDate}
                type="datetime-local"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Expires"
                value={expiresAt}
                onChange={setExpiresAt}
                type="datetime-local"
              />
            </div>

            <TextAreaField
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe the gig..."
            />

            {error && <p className="text-red-400 text-sm pt-1">{error}</p>}

            <div className="mt-auto flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <div className="relative group">
                <button
                  type="submit"
                  disabled={isLoading || !allFilled}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition flex items-center gap-2  ${
                    allFilled
                      ? "bg-neutral-100 text-neutral-900 hover:bg-white cursor-pointer"
                      : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>

                {/* tooltip when not filled */}
                {!allFilled && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-red-600 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-md">
                    please fill all fields
                  </span>
                )}
              </div>
            </div>
          </form>

          {/* right side preview */}
          <div className="w-[300px] border-l border-neutral-800/60 p-6 flex flex-col justify-between">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
                Images (max 5)
              </label>
              <label className="flex items-center justify-center gap-2 border border-neutral-700/60 rounded-md py-3 hover:bg-neutral-800/60 cursor-pointer transition">
                <Upload size={16} />
                <span className="text-sm text-neutral-300">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImages(e.target.files)}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imagePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="preview"
                      className="rounded-md border border-neutral-700/50 object-cover h-24 w-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------- inputs -------------------- */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: any) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-950/40 border border-neutral-700/70 rounded-md px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600/60"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full bg-neutral-950/40 border border-neutral-700/70 rounded-md px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600/60 resize-none"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-950/40 border border-neutral-700/70 rounded-md px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-600/60"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o.charAt(0) + o.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
