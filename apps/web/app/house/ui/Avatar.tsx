import React from "next/image";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export default function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: AvatarProps) {
  const hasImage = !!src;
  const finalSrc = hasImage ? getImageUrl(src!) : null;

  return (
    <div
      className={`relative flex-shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {finalSrc ? (
        <Image
          src={finalSrc}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full bg-neutral-800 text-white flex items-center justify-center font-semibold select-none">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
