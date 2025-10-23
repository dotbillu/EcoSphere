"use client";

import { useState } from "react";
import { Image, Smile, MapPin, X } from "lucide-react";
import { useAtom } from "jotai";
import { locationAtom, userAtom } from "../../store";
import NextImage from "next/image";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [error, setError] = useState("");

  const [user] = useAtom(userAtom);
  const [coords, setCoords] = useAtom(locationAtom);

  if (!user) return <p className="text-white">Please login to post</p>;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      if (error) setError(""); // clear error if any
    }
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

  const requestLocation = async () => {
    if (!coords.lat || !coords.lng) {
      if (!navigator.geolocation) return alert("Geolocation not supported");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error(err);
          alert("Permission denied or failed to get location");
        }
      );
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      setError("Write something, bro!");
      return;
    }

    setLoading(true);
    setError("");

    let locationName: string | undefined;

    if (includeLocation && coords.lat && coords.lng) {
      locationName = await getCityFromCoords(coords.lat, coords.lng);
    }

    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("content", content);
    if (locationName) formData.append("location", locationName);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("http://localhost:4000/uploadPosts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setContent("");
        setImage(null);
        setPreview(null);
        setIncludeLocation(false);
      } else {
        console.error("Upload failed:", await res.text());
      }
    } catch (err) {
      console.error("Error uploading:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="border border-white rounded-2xl shadow-md p-4 space-y-2">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex space-x-3">
        <div className="avatar placeholder">
          <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
            <span>{user.username[0].toUpperCase()}</span>
          </div>
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(""); // clear error on typing
            }}
            placeholder="What’s happening?"
            className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500"
            rows={2}
          />

          {preview && (
            <div className="mt-3 relative w-full h-60">
              <NextImage
                src={preview}
                alt="Preview"
                fill
                style={{ objectFit: "cover" }}
                className="rounded-xl border border-gray-600"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-red-500 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-4 text-gray-400 items-center">
              <label className="cursor-pointer hover:text-white">
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>

              <button
                onClick={async () => {
                  setIncludeLocation((prev) => !prev);
                  if (!coords.lat || !coords.lng) await requestLocation();
                }}
                className={`flex items-center gap-1 text-sm ${
                  includeLocation ? "text-green-400" : "text-gray-400"
                }`}
              >
                <MapPin className="w-4 h-4 cursor-pointer" />
                {includeLocation
                  ? coords.lat && coords.lng
                    ? "sharing location"
                    : "Fetching location..."
                  : ""}
              </button>

              <Smile className="w-5 h-5 cursor-pointer hover:text-white" />
            </div>

            <button
              onClick={handlePost}
              disabled={loading}
              className="btn btn-sm rounded-full bg-white text-black border-none hover:bg-gray-200 transition"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

