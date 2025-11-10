"use client";

import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const ChatPanelSkeleton = () => {
  return (
    <div className="flex-grow p-4 overflow-y-auto bg-black space-y-6">
      <div className="flex items-end gap-2">
        <SkeletonLoader className="w-8 h-8 rounded-full flex-shrink-0" />
        <SkeletonLoader className="h-10 w-2/5 rounded-2xl rounded-bl-lg" />
      </div>
      <div className="flex justify-end items-end gap-2">
        <SkeletonLoader className="h-12 w-1/2 rounded-2xl rounded-br-lg" />
      </div>
      <div className="flex items-end gap-2">
        <SkeletonLoader className="w-8 h-8 rounded-full flex-shrink-0" />
        <SkeletonLoader className="h-8 w-1/3 rounded-2xl rounded-bl-lg" />
      </div>
      <div className="flex justify-end items-end gap-2">
        <SkeletonLoader className="h-10 w-2/5 rounded-2xl rounded-br-lg" />
      </div>
      <div className="flex items-end gap-2">
        <SkeletonLoader className="w-8 h-8 rounded-full flex-shrink-0" />
        <SkeletonLoader className="h-16 w-3/4 rounded-2xl rounded-bl-lg" />
      </div>
    </div>
  );
};

export default ChatPanelSkeleton;
