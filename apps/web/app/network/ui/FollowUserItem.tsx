"use client";

import React from 'react';
import { SimpleUser } from '@lib/types';
import { API_BASE_URL } from '@lib/constants';

interface FollowUserItemProps {
  user: SimpleUser;
  onSelect: () => void;
}

const FollowUserItem: React.FC<FollowUserItemProps> = ({ user, onSelect }) => {
  const placeholder = `https://placehold.co/40x40/4f46e5/white?text=${user.name.charAt(0).toUpperCase()}`
  const src = user.image ? `${API_BASE_URL}/uploads/${user.image}` : placeholder;

  return (
    <button
      onClick={onSelect}
      className="flex items-center w-full p-3 rounded-lg text-left transition-all hover:bg-gray-700"
    >
      <img
        src={src}
        onError={(e) => (e.currentTarget.src = placeholder)}
        alt={user.name}
        className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
      />
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-sm text-gray-200 truncate">{user.name}</h3>
        <p className="text-sm text-gray-400 truncate">@{user.username}</p>
      </div>
    </button>
  );
};

export default FollowUserItem;
