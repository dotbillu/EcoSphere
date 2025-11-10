import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../../../store";
import { MapElement } from "./MapTypes";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

type CreateRoomModalProps = {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: (newRoom: MapElement) => void;
};

export default function CreateRoomModal({
  location,
  onClose,
  onSuccess,
}: CreateRoomModalProps) {
  const [user] = useAtom(userAtom);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("SOCIAL");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const allFilled = name.trim() && description.trim() && type.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError("You must be logged in to create a room.");
    if (!allFilled) return setError("Please fill in all fields.");

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("creatorId", user.id.toString());
    formData.append("type", type);
    if (image) formData.append("image", image);

    try {
      const res = await fetch(`${API_BASE_URL}/map/room`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create room");
      }

      const newRoom = await res.json();
      onSuccess(newRoom);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 text-gray-100 p-5 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Create a New Room</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name + Type in one row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                <option value="social">GIG RELATED</option>
                <option value="fun">SOCIAL</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-neutral-800 border border-neutral-700 text-gray-100 px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
          </div>

          {/* Image */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-300 mb-1">
              Cover Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files ? e.target.files[0] : null)
              }
              className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-neutral-700 file:text-gray-200 hover:file:bg-neutral-600"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-neutral-700 rounded-md hover:bg-neutral-600 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <div className="relative group">
              <button
                type="submit"
                disabled={isLoading || !allFilled}
                className={`px-5 py-2 text-sm font-medium rounded-md transition flex items-center gap-2 ${
                  allFilled
                    ? "bg-neutral-100 text-neutral-900 hover:bg-white"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Create"
                )}
              </button>

              {!allFilled && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-md">
                  Fill all fields first
                </span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

