export interface SimpleUser {
  id: string;
  username: string;
  name: string;
  image: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unseenCount?: number;
}

export interface ChatMapRoom {
  id: string;
  name: string;
  imageUrl: string | null;
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
  unseenCount?: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: SimpleUser;
}

export interface MessageType {
  id: string | number;
  content: string;
  createdAt: string;
  senderId: string;
  sender: SimpleUser;
  reactions: Reaction[];
  isOptimistic?: boolean;
  // discriminators for Group vs DM
  roomId?: string;
  recipientId?: string;
}

export interface DirectMessage extends MessageType {
  recipientId: string;
}

export interface GroupMessage extends MessageType {
  roomId: string;
}

export type SelectedConversation = {
  type: "room" | "dm";
  data: ChatMapRoom | SimpleUser;
} | null;

export interface TypingUser {
  conversationId: string;
  name: string;
}

// --- Component Prop Interfaces ---

export interface ChatInputProps {
  onSend: (content: string) => void;
  onGetSendButtonPosition: (buttonElement: HTMLButtonElement) => void;
}

export interface MessageBubbleProps {
  message: MessageType;
  isMe: boolean;
  isGroup: boolean;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  spacing: "small" | "large";
}

export interface MessageListProps {
  messages: MessageType[];
  currentUser: SimpleUser;
  selectedConversation: NonNullable<SelectedConversation>;
  onDelete: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

export interface ConversationItemProps {
  item: ((ChatMapRoom | SimpleUser) & { type: "room" | "dm" }) | null;
  type: "room" | "dm";
  isSelected: boolean;
  onClick: () => void;
}

export interface ConversationListProps {
  items: ((ChatMapRoom | SimpleUser) & { type: "room" | "dm" })[];
  searchTerm: string;
}

export interface ChatPanelProps {
  isMobile?: boolean;
  onBack?: () => void;
}
