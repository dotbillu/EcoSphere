"use client";

import React from 'react';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
      ${isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-transparent text-gray-400 hover:bg-gray-700'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

export default TabButton;
