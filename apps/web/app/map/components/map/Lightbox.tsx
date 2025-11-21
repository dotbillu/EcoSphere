"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getImageUrl } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type LightboxProps = {
  images: string[];
  startIndex: number;
  onClose: () => void;
};

export default function Lightbox({
  images,
  startIndex,
  onClose,
}: LightboxProps) {
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
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white rounded-full bg-black/50 hover:bg-black/75 transition-colors"
      >
        <X size={24} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute left-4 p-2 text-white rounded-full bg-black/50 hover:bg-black/75 transition-colors"
      >
        <ChevronLeft size={32} />
      </button>

      <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="w-full h-full"
          >
            <Image
              src={getImageUrl(images[currentIndex])}
              alt="Lightbox view"
              layout="fill"
              objectFit="contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 p-2 text-white rounded-full bg-black/50 hover:bg-black/75 transition-colors"
      >
        <ChevronRight size={32} />
      </button>
    </motion.div>
  );
}
