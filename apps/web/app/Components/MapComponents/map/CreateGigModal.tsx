import { useState } from "react";
import { useAtom } from "jotai";
import { userAtom } from "../../../store";
import { GigElement } from "./MapTypes";

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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a gig.");
      return;
    }
    if (!title) {
      setError("Gig title is required.");
      return;
    }

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
    
    if (date) {
      formData.append("date", new Date(date).toISOString());
    }
    if (expiresAt) {
      formData.append("expiresAt", new Date(expiresAt).toISOString());
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

      const newGig = await res.json();
      onSuccess(newGig);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-zinc-800 text-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create a New Gig</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gig-title" className="block text-sm font-medium text-zinc-300">Gig Title</label>
            <input
              id="gig-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="gig-desc" className="block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              id="gig-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
            <div>
            <label htmlFor="gig-reward" className="block text-sm font-medium text-zinc-300">Reward (Optional)</label>
            <input
              id="gig-reward"
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="e.g., $5, Coffee, etc."
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gig-date" className="block text-sm font-medium text-zinc-300">Date (Optional)</label>
              <input
                id="gig-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
              <div>
              <label htmlFor="gig-expires" className="block text-sm font-medium text-zinc-300">Expires (Optional)</label>
              <input
                id="gig-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="gig-type" className="block text-sm font-medium text-zinc-300">Type</label>
            <select
              id="gig-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TASK">Task</option>
              <option value="EVENT">Event</option>
              <option value="ITEM">Item</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="gig-images" className="block text-sm font-medium text-zinc-300">Images (Optional, up to 5)</label>
            <input
              id="gig-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(e.target.files)}
              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700"
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
              className="px-4 py-2 bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Gig"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
