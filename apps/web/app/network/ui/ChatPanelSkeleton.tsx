"use client";

import React from "react";
import SkeletonLoader from "./SkeletonLoader";

export default function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-black relative overflow-hidden ml-2">
      {/* Header Skeleton */}
      <div className="flex-none flex items-center p-3 bg-black border-b border-zinc-800 z-10">
        {/* Back Button Placeholder (Mobile) */}
        <div className="md:hidden mr-3 w-6 h-6" />
        
        {/* Avatar Circle */}
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 shrink-0 relative border border-zinc-800">
             <SkeletonLoader className="w-full h-full absolute inset-0" />
        </div>
        
        {/* Name & Status Lines */}
        <div className="flex flex-col gap-1.5 grow">
          <div className="h-4 w-32 rounded-md overflow-hidden relative">
             <SkeletonLoader className="w-full h-full absolute inset-0" />
          </div>
          <div className="h-3 w-20 rounded-md overflow-hidden relative">
             <SkeletonLoader className="w-full h-full absolute inset-0 opacity-60" />
          </div>
        </div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 flex flex-col justify-end p-4 space-y-6 overflow-hidden pb-6">
        
        {/* Received Message (Left with Avatar) */}
        <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[70%]">
                {/* Sender Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative mb-1">
                    <SkeletonLoader className="w-full h-full absolute inset-0" />
                </div>
                {/* Message Bubble */}
                <div className="h-10 w-48 rounded-2xl rounded-bl-none relative overflow-hidden">
                    <SkeletonLoader className="w-full h-full absolute inset-0 opacity-20" />
                </div>
            </div>
        </div>

        {/* Received Message (Left with Avatar) */}
        <div className="flex justify-start">
            <div className="flex items-end gap-2 max-w-[60%]">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative mb-1">
                    <SkeletonLoader className="w-full h-full absolute inset-0" />
                </div>
                <div className="h-14 w-64 rounded-2xl rounded-bl-none relative overflow-hidden">
                    <SkeletonLoader className="w-full h-full absolute inset-0 opacity-20" />
                </div>
            </div>
        </div>

        {/* Sent Message (Right - No Avatar) */}
        <div className="flex justify-end w-full">
            <div className="h-12 w-56 rounded-2xl rounded-br-none relative overflow-hidden">
                <SkeletonLoader className="w-full h-full absolute inset-0 opacity-40" />
            </div>
        </div>

        {/* Sent Message (Right - Short) */}
        <div className="flex justify-end w-full">
            <div className="h-10 w-32 rounded-2xl rounded-br-none relative overflow-hidden">
                <SkeletonLoader className="w-full h-full absolute inset-0 opacity-40" />
            </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="flex-none w-full bg-black z-10 p-3">
        <div className="h-12 w-full rounded-full relative overflow-hidden border border-zinc-800">
            <SkeletonLoader className="w-full h-full absolute inset-0 opacity-10" />
        </div>
      </div>
    </div>
  );
}
