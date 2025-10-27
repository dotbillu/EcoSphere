import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../../../store";
import { MapElement } from "./MapTypes";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a room.");
      return;
    }
    if (!name) {
      setError("Room name is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("creatorId", user.id.toString());
    formData.append("type", type);
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

      const newRoom = await res.json();
      onSuccess(newRoom);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-zinc-800 text-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create a New Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className="block text-sm font-medium text-zinc-300">Room Name</label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="room-desc" className="block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              id="room-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="room-type" className="block text-sm font-medium text-zinc-300">Type</label>
            <select
              id="room-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="SOCIAL">Social</option>
              <option value="GAMING">Gaming</option>
              <option value="STUDY">Study</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="room-image" className="block text-sm font-medium text-zinc-300">Cover Image (Optional)</label>
            <input
              id="room-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-600 rounded-md hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-500 rounded-md hover:bg-emerald-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
