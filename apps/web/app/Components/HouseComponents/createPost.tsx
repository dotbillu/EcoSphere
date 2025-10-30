"use client";

import { useState, useRef } from "react";
import { Image, MapPin, X } from "lucide-react";
import { useAtom } from "jotai";
import { locationAtom, userAtom } from "../../store";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Assume the Post type is defined elsewhere or use 'any'
// You likely have this type in your Feedbox component
interface Post {
  id: number;
  // ... other post fields
}

// 1. UPDATED PROPS:
// Renamed 'onPostSuccess' to 'onPostCreated' and expect it to take the new post
export default function CreatePost({
  onPostCreated,
}: {
  onPostCreated: (newPost: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");

  const [user] = useAtom(userAtom);
  const [coords, setCoords] = useAtom(locationAtom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user)
    return (
      <p className="p-4 text-center text-gray-400 border-b border-gray-700">
        Please login to post
      </p>
    );

  // --- (All other functions like handleImageChange, handleLocationToggle are unchanged) ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError("You can upload max 5 images.");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    setError("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Permission denied or failed to get location"),
    );
  };

  const getCityFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || "";
    } catch {
      return "";
    }
  };

  const handleLocationToggle = async () => {
    const toggle = !includeLocation;
    setIncludeLocation(toggle);

    if (toggle && (!coords.lat || !coords.lng)) {
      await requestLocation();
    }

    if (toggle && coords.lat && coords.lng) {
      const city = await getCityFromCoords(coords.lat, coords.lng);
      setLocationName(city);
    } else {
      setLocationName("");
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > 5000) return;
    setContent(e.target.value);
    setError("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 250)}px`;
      el.style.overflowY = el.scrollHeight > 250 ? "auto" : "hidden";
    }
  };


  // 2. UPDATED handlePost FUNCTION:
  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      setError("Write something or add at least one image!");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("name", user.name);
    formData.append("content", content);
    if (includeLocation && locationName) formData.append("location", locationName);
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("http://localhost:4000/uploadPosts", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());

      // Get the new post from the response
      const newPost: Post = await res.json();

      // Reset the form
      setContent("");
      setImages([]);
      setPreviews([]);
      setIncludeLocation(false);
      setLocationName("");
      
      // 3. CALL THE PARENT'S FUNCTION with the new post
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      // No more window.location.reload()

    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- (JSX is unchanged) ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border-b border-gray-700 space-y-3"
    >
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {user.image ? (
            <NextImage
              src={
                user.image.startsWith("http")
                  ? user.image
                  : `http://localhost:4000/uploads/${user.image}`
              }
              alt={user.name}
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
            />
          ) : (
            <div className="bg-neutral-focus text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
              <span>{user.name[0].toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="What’s happening?"
            className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500 text-xl overflow-hidden"
            rows={1}
          />
          <div className="flex flex-wrap gap-3 mt-3">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-700"
              >
                <NextImage src={src} alt={`preview-${index}`} fill className="object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-gray-400 text-sm">{content.length}/5000</span>
            <div className="flex gap-4 items-center relative text-blue-500">
              <label className="cursor-pointer hover:text-blue-400">
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <button
                onClick={handleLocationToggle}
                className={`flex items-center gap-1 text-sm ${
                  includeLocation
                    ? "text-green-500 hover:text-green-400"
                    : "hover:text-blue-400"
                }`}
              >
                <MapPin className="w-5 h-5" />
                {includeLocation && locationName && (
                  <span className="text-xs">{locationName}</span>
                )}
              </button>
              <button
                onClick={handlePost}
                disabled={loading || (!content.trim() && images.length === 0)}
                className="btn btn-sm rounded-full bg-blue-500 text-white font-bold px-5 py-2 border-none hover:bg-blue-600 transition disabled:opacity-50 disabled:bg-blue-800"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
