"use client";

import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonItem = () => (
  <div className="flex items-center w-full p-3">
    <SkeletonLoader className="w-12 h-12 rounded-full mr-3 flex-shrink-0" />
    <div className="flex-grow min-w-0 space-y-2">
      <SkeletonLoader className="h-4 w-3/4 rounded-md" />
      <SkeletonLoader className="h-3 w-1/2 rounded-md" />
    </div>
  </div>
);

const SidebarSkeleton = () => {
  return (
    <div className="flex-grow overflow-y-auto relative">
      {/* Create an array of 8 placeholder items */}
      {[...Array(8)].map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </div>
  );
};

export default SidebarSkeleton;
