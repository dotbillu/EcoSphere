"use client";

import React from 'react';

interface SkeletonLoaderProps {
  className: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return (
    <div
      className={`
        animate-shimmer 
        bg-[linear-gradient(90deg,theme(colors.zinc.800)_25%,theme(colors.zinc.700)_50%,theme(colors.zinc.800)_75%)] 
        bg-[size:200%_100%]
        ${className}
      `}
    />
  );
};

export default SkeletonLoader;
