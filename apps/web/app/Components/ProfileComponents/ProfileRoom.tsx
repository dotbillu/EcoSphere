"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapRoom } from "../../store";
import { getImageUrl } from "../../lib/utils";

// -----------------------------------------------------------------
// ProfileRoom Component
// -----------------------------------------------------------------
export default function ProfileRoom({ room }: { room: MapRoom }) {
  return (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="border-b border-zinc-700 transition-colors hover:bg-white/5"
    >
      <div className="flex items-start p-4 gap-4">
        {/* Room Image */}
        <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
          <Image
            src={getImageUrl(room.imageUrl || "")}
            alt={room.name}
            fill
            style={{ objectFit: "cover" }}
            className="bg-zinc-800"
          />
        </div>
        {/* Room Info */}
        <div className="flex flex-col">
          <p className="text-zinc-400 text-sm uppercase tracking-wide">
            {room.type || "Room"}
          </p>
          <h3 className="text-lg font-bold text-white">{room.name}</h3>
          <p className="text-zinc-300 whitespace-pre-wrap break-words line-clamp-3 mt-1 text-sm">
            {room.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
