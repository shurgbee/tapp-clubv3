// Data model types for TappClub app

export type UUID = string;
export type ID = string | number;

export interface User {
  user_id: ID; // PK
  calendar_json?: string; // optional for later
  location?: string;
  name: string;
  pfp?: string; // avatar URL
  slug?: string; // unique handle for /profile/[slug]
}

export interface Event {
  event_id: ID; // PK
  name: string;
  description?: string;
  dateTime: string; // ISO 8601
  coverUrl?: string;
}

export interface Post {
  user_id: ID; // FK -> users
  event_id: ID; // FK -> events
  messages?: string; // caption/notes for the event post
  imageUrl?: string; // optional first image
}

export interface FriendEdge {
  user_id: ID; // FK
  user_id2: ID; // FK
  createdAt?: string;
}

export interface EventMember {
  event_id: ID; // FK
  user_id: ID; // FK
}

export interface Group {
  group_id: ID; // PK
  name: string;
  pfp?: string;
}

export interface GroupMember {
  group_id: ID;
  user_id: ID;
}

export type MessageType = "text" | "image" | "system";

export interface ConversationMessage {
  group_id: ID; // FK
  poster_id: ID; // FK -> users
  messageType: MessageType;
  messageContent: string;
  createdAt: string; // ISO
}

export interface FeedItem {
  event: Event;
  poster: User;
  post?: Post;
}
