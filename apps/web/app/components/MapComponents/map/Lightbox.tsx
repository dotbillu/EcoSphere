import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getImageUrl } from "../../../lib/utils";

type LightboxProps = {
  images: string[];
  startIndex: number;
  onClose: () => void;
};

export default function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white rounded-full bg-black bg-opacity-50 hover:bg-opacity-75"
      >
        <X size={24} />
      </button>

      <button
        onClick={handlePrev}
        className="absolute left-4 p-2 text-white rounded-full bg-black bg-opacity-50 hover:bg-opacity-75"
      >
        <ChevronLeft size={32} />
      </button>

      <div className="relative w-full h-full max-w-4xl max-h-4/5">
        <Image
          src={getImageUrl(images[currentIndex])}
          alt="Lightbox view"
          layout="fill"
          objectFit="contain"
        />
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 p-2 text-white rounded-full bg-black bg-opacity-50 hover:bg-opacity-75"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
}
