"use client";

import React from 'react';

interface DateHeaderProps {
  date: string;
}

const DateHeader: React.FC<DateHeaderProps> = ({ date }) => {
  return (
    <div className="flex justify-center my-4">
      <span className="bg-zinc-800 text-gray-300 text-xs font-medium px-3 py-1 rounded-full">
        {date}
      </span>
    </div>
  );
};

export default DateHeader;
