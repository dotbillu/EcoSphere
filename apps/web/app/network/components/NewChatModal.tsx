"use client";

import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { followingListAtom, isNewChatModalOpenAtom, dmConversationsAtom, selectedConversationAtom } from '@/store';
import { X, Search } from 'lucide-react';
import { SimpleUser } from '@lib/types';
import FollowUserItem from '../ui/FollowUserItem';

const NewChatModal: React.FC = () => {
  const [followingList] = useAtom(followingListAtom);
  const setIsModalOpen = useSetAtom(isNewChatModalOpenAtom);
  const setDmConversations = useSetAtom(dmConversationsAtom);
  const setSelectedConversation = useSetAtom(selectedConversationAtom);
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFollowing = followingList.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: SimpleUser) => {
    setIsModalOpen(false);
    
    setDmConversations(prev => {
      const existingDm = prev.find(dm => dm.id === user.id);
      if (!existingDm) {
        return [user, ...prev];
      }
      return prev;
    });
    
    setSelectedConversation({ type: 'dm', data: user });
  };

  const onClose = () => setIsModalOpen(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col h-[70vh] text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-2 border-b border-gray-700">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {followingList.length === 0 && (
            <p className="p-4 text-center text-gray-400">You are not following anyone.</p>
          )}
          {filteredFollowing.length === 0 && searchTerm && (
            <p className="p-4 text-center text-gray-400">No users found.</p>
          )}
          <div className="p-2 space-y-1">
            {filteredFollowing.map(user => (
              <FollowUserItem
                key={user.id}
                user={user}
                onSelect={() => handleSelectUser(user as SimpleUser)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
