import Image from "next/image";
import { Navigation, Trash2, X } from "lucide-react";
import { getImageUrl } from "../../../lib/utils";
import { GigElement } from "./MapTypes";

type GigDetailSidebarProps = {
  gig: GigElement;
  currentUserId?: number;
  onClose: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onShowLightbox: (index: number) => void;
};

export default function GigDetailSidebar({
  gig,
  currentUserId,
  onClose,
  onNavigate,
  onDelete,
  onShowLightbox,
}: GigDetailSidebarProps) {
  return (
    <div className="absolute top-0 left-0 z-20 h-full w-full max-w-sm bg-zinc-900 text-white shadow-lg flex flex-col">
      {/* --- Header --- */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between border-b border-zinc-700">
        <h2 className="text-xl font-bold text-amber-500 truncate">
          {gig.title}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* --- Scrollable Content --- */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* --- Image Gallery --- */}
        {gig.imageUrls && gig.imageUrls.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">PHOTOS</h3>
            <div
              className="relative w-full h-48 rounded-lg overflow-hidden mb-2 cursor-pointer"
              onClick={() => onShowLightbox(0)}
            >
              <Image
                src={getImageUrl(gig.imageUrls[0])}
                alt={gig.title}
                layout="fill"
                objectFit="cover"
              />
            </div>
            {gig.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gig.imageUrls.slice(1, 5).map((url, index) => (
                  <div
                    key={index}
                    className="relative w-full h-16 rounded overflow-hidden cursor-pointer"
                    onClick={() => onShowLightbox(index + 1)} // Adjust index
                  >
                    <Image
                      src={getImageUrl(url)}
                      alt={`thumbnail ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Details --- */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">DETAILS</h3>
          <div className="space-y-3 text-sm">
            {gig.reward && (
              <p>
                <strong className="text-zinc-300">Reward:</strong> {gig.reward}
              </p>
            )}
            <p className="text-zinc-300 whitespace-pre-wrap">
              {gig.description}
            </p>
            {gig.date && (
              <p>
                <strong>Date:</strong> {new Date(gig.date).toLocaleString()}
              </p>
            )}
            {gig.expiresAt && (
              <p>
                <strong>Expires:</strong> {new Date(gig.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- Footer Actions --- */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-700 flex gap-2">
        <button
          onClick={onNavigate}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded hover:bg-blue-600 flex items-center justify-center gap-1.5"
        >
          <Navigation size={16} /> Navigate
        </button>
        {currentUserId === gig.creatorId && (
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
