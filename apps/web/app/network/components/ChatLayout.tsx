// ChatLayout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import NetworkSidebar, { ConversationItem } from './NetworkSidebar'; 
import ChatPanel from './ChatPanel'; 
import { ArrowLeft } from 'lucide-react'; 

// --- MEDIA QUERY HOOK ---
// This hook determines if the screen size is 800px or less (the mobile breakpoint)
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
        
        // Use modern addEventListener for production environments
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else {
            // Fallback for older browsers
            media.addListener(listener); 
        }

        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', listener);
            } else {
                media.removeListener(listener);
            }
        };
    }, [query, matches]);
    return matches;
};

// --- TYPES ---
interface SelectedConv {
    type: 'room' | 'dm';
    data: ConversationItem;
    id: string;
}

export default function ChatLayout() {
    const [selectedConversation, setSelectedConversation] = useState<SelectedConv | null>(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const isMobile = useMediaQuery('(max-width: 800px)'); 

    const handleConversationSelect = (conversation: SelectedConv) => {
        setSelectedConversation(conversation);
        
        if (isMobile) {
            // Hide sidebar on mobile when a chat is selected
            setIsSidebarVisible(false); 
        }
    };

    const handleBackToSidebar = () => {
        setIsSidebarVisible(true); // Show the sidebar again
    };

    return (
        <div className="flex h-screen overflow-hidden bg-black">
            {/* 1. NetworkSidebar: Renders if sidebar is visible OR if it's desktop */}
            {(isSidebarVisible || !isMobile) && (
                <NetworkSidebar
                    onConversationSelect={handleConversationSelect}
                    selectedId={selectedConversation?.id || null}
                />
            )}

            {/* 2. ChatPanel: Renders if a conversation is selected AND (it's desktop OR sidebar is hidden) */}
            {selectedConversation ? (
                (isMobile ? !isSidebarVisible : true) && ( 
                    <ChatPanel 
                        conversation={selectedConversation} 
                        isMobile={isMobile}
                        onBack={isMobile ? handleBackToSidebar : undefined} // Pass back handler only on mobile
                    />
                )
            ) : (
                // Default view (e.g., "Select a conversation")
                // Only show this default view if we are NOT in mobile view with the sidebar hidden
                !(isMobile && !isSidebarVisible) && (
                    <div className="flex-grow flex items-center justify-center text-zinc-500 border-l border-zinc-800 w-full md:w-auto">
                        Select a conversation to start chatting.
                    </div>
                )
            )}
        </div>
    );
}
