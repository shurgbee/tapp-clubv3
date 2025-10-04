# TappClub — Expo Client App (TypeScript) — **spec.md**
Version: 0.1  
Scope: **Client only** (Expo) connected to a future Python server. No server code in this phase.

---

## 1) Goal & High‑level Overview
Build an Expo (React Native) app for sharing and discovering **events your friends attended**, with basic chat (including an AI assistant “Larry”), NFC friend‑tapping, a simple profile, and an event posting screen.

- **Mobile client:** Expo (TypeScript), using `expo-router` for file‑based navigation.
- **Server:** Python (FastAPI/Flask) to be connected later. Client calls REST endpoints and (optionally) a WebSocket for chat updates.
- **Storage:** Data is served by the Python API; client caches with React Query.
- **Auth:** Stubbed for v0.1 (single test user). Token flow can be added later.

---

## 2) App Navigation & Routes
Use **expo-router**. Bottom tab bar: **/home** (aka `/feed`), **/postevent**, **/tapfriend**, **/profile**.  
A **/chat** button appears in the header on the Home/Feed screen.

```
app/
  (tabs)/
    home.tsx            -> `/home` (alias `/feed`) — Feed of friends’ events
    postevent.tsx       -> `/postevent` — Create an event
    tapfriend.tsx       -> `/tapfriend` — NFC friend tap
    profile.tsx         -> `/profile` — Current user profile
  chat/
    index.tsx           -> `/chat` — Conversation list
    [id].tsx            -> `/chat/[id]` — Conversation detail (messages)
  profile/
    [slug].tsx          -> `/profile/[slug]` — Other user profile
  feed/
    [id].tsx            -> `/feed/[id]` — Event detail (optional)
  signup.tsx            -> `/signup` — Optional onboarding for new users
  _layout.tsx           -> Tabs + stack layout
```

**Header:** On `/home`, right‑side icon opens `/chat`.  
**Initial route:** `/home` (feed).  
**Deep links:** `tappclub://chat/123`, `tappclub://profile/joshua_l`, etc.

---

## 3) UI Requirements by Screen

### 3.1 `/home` (aka `/feed`)
Purpose: Show all events that the current user’s **friends have been to**, ordered descending by `dateTime` (most recent first).

Card layout (see provided mock):
- **Header:** Poster avatar + username.
- **Image:** Event cover (first post image if available).
- **Meta:** Date (MM/DD/YYYY), Time (h:mm A).
- **About:** Short description (“About: Trip to Japan!! …”).
- **Actions:** (Optional) heart/like button; not required for v0.1.

Data source:
- `GET /feed?user_id=<uid>` -> Array of `FeedItem` (see types). Items should be *friends’* events joined by `friends` + `eventMembers` tables.

Empty State: “No recent events from friends yet. Tap **+** to post your first event.”

### 3.2 `/chat`
- Shows **Group Conversations** (from `groupList`/`GroupMembers`) the user belongs to with last message preview/time.
- Tapping opens `/chat/[id]`.

### 3.3 `/chat/[id]`
- Header: Group name + avatar.
- **Initial load** via `GET /conversations/:group_id` (messages/page).  
- **Send message**: `POST /messages` with `{ user_id, group_id, messageType, messageContent }`.
- **Larry (AI) ping**: If message text mentions **"@Larry"** or starts with `/larry`, also `POST` to **AI server**:
  - `POST https://<AI_HOST>/agent/messages` with `{ group_id, user_id, text, timestamp }`.
- Realtime (optional): WebSocket `wss://<HOST>/chat?group_id=...` for new messages. Fallback: poll every 10–15s.

### 3.4 `/tapfriend`
- **NFC**: On “Tap to Add Friend”, enable NDEF read/write using `react-native-nfc-manager` (requires EAS build + dev client).
- The device **writes/reads an NDEF Text record** containing the user’s **UUID**.
- On successfully reading a remote user’s UUID:
  - `POST /friends/tap` with `{ me_user_id, other_user_uuid }`.
  - Server validates and inserts into `friends` table (bidirectional or single edge per server rules).
- Show success toast: “You and @otherUser are now friends.”

### 3.5 `/profile` (self)
- Avatar, name, location (city only), basic stats:
  - Events attended (count via `eventMembers`).
  - Friends count.
- A vertical list of **your** events (cards). Tap to open event detail.

### 3.6 `/profile/[slug]` (other user)
- Same layout sans edit controls. Pull data by slug or user id.

### 3.7 `/postevent`
- Form fields:
  - **Name** (text)
  - **Description** (multiline)
  - **Date & Time** (DateTimePicker)
  - **Cover Photo** (optional; `expo-image-picker`)
- Actions:
  - **Create Event**: `POST /events` `{ name, description, dateTime, coverUrl? }`
  - Automatically create membership for creator: `POST /eventMembers`.
- Confirmation: Navigate back to `/home` and show new post in the feed (client refetch).

### 3.8 `/signup` (optional stub)
- Collect name + username + (optional) location permission (approximate city).  
- `POST /users` to create.

---

## 4) Data Model (Client‑side Types)
Mirror the diagram in lightweight TypeScript types for client use.

```ts
export type UUID = string;
export type ID = string | number;

export interface User {
  user_id: ID;            // PK
  calendar_json?: string; // optional for later
  location?: string;
  name: string;
  pfp?: string;           // avatar URL
  slug?: string;          // unique handle for /profile/[slug]
}

export interface Event {
  event_id: ID;       // PK
  name: string;
  description?: string;
  dateTime: string;   // ISO 8601
  coverUrl?: string;
}

export interface Post {
  user_id: ID;        // FK -> users
  event_id: ID;       // FK -> events
  messages?: string;  // caption/notes for the event post
  imageUrl?: string;  // optional first image
}

export interface FriendEdge {
  user_id: ID;        // FK
  user_id2: ID;       // FK
  createdAt?: string;
}

export interface EventMember {
  event_id: ID;       // FK
  user_id: ID;        // FK
}

export interface Group {
  group_id: ID;       // PK
  name: string;
  pfp?: string;
}

export interface GroupMember {
  group_id: ID;
  user_id: ID;
}

export type MessageType = "text" | "image" | "system";

export interface ConversationMessage {
  group_id: ID;           // FK
  poster_id: ID;          // FK -> users
  messageType: MessageType;
  messageContent: string;
  createdAt: string;      // ISO
}

export interface FeedItem {
  event: Event;
  poster: User;
  post?: Post;
}
```

---

## 5) API Contract (Client expectations)
Base URL via env: `process.env.EXPO_PUBLIC_API_BASE_URL`  
AI Base URL via env: `process.env.EXPO_PUBLIC_AI_BASE_URL`

### Users
- `POST /users` → createUser({ name, slug, location? }) → `{ user: User, token }`
- `GET /users/:id` → `{ user: User }`
- `GET /users/slug/:slug` → `{ user: User }`

### Friends
- `POST /friends/tap` → `{ me_user_id, other_user_uuid }` → `{ ok: true, friend: User }`
- `GET /friends/:user_id` → list friends

### Events
- `POST /events` → `{ event: Event }`
- `GET /events/:event_id` → `{ event: Event }`
- `GET /events/user/:user_id` → events for profile
- `POST /eventMembers` → add user to event
- (Optional) `GET /eventMembers/:event_id`

### Feed
- `GET /feed?user_id=<id>` → `FeedItem[]` (friends’ events only, newest first)

### Groups & Chat
- `GET /groups?user_id=<id>` → `Group[]`
- `GET /conversations/:group_id?cursor=<t>` → `{ messages: ConversationMessage[], nextCursor? }`
- `POST /messages` → `{ user_id, group_id, messageType, messageContent }` → `{ message: ConversationMessage }`
- **AI**: `POST /agent/messages` (separate host) when pinging **@Larry**.

### Weather/Maps (future)
- Client won’t directly call third‑party APIs in v0.1. The Python server can enrich event cards (e.g., weather for `dateTime` & location) and return as part of `FeedItem`.

---

## 6) Libraries & Native Capabilities

**Core**
- `expo` (SDK latest), `react`, `react-native`, `typescript`
- `expo-router` (file‑based routing)
- `@tanstack/react-query` (server state + caching)
- `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`
- Icons: `@expo/vector-icons`
- Images: `expo-image`, `expo-image-picker` (for event cover)
- Storage: `expo-secure-store` (token), `expo-file-system` (optional)

**NFC**
- `react-native-nfc-manager` (via EAS Build + dev client).  
  Use `NfcManager.requestTechnology(NfcTech.Ndef)`, read/write an **NDEF Text** record carrying the user UUID. Handle iOS/Android permission flows gracefully. Disable reader after each session.

**Date/Time**
- `dayjs` (or `date-fns`) for formatting.

**Optional**
- `gifted-chat` or a lightweight custom chat UI. For full control, implement your own list + input.

---

## 7) State & Data‑fetching

- **Auth store** (Zustand or simple React Context) to keep `{ user, token }` in memory and persist in `SecureStore`.
- **React Query** keys:
  - `["feed", user_id]`
  - `["conversations", group_id]` (infinite query/pagination)
  - `["groups", user_id]`
  - `["profile", user_id]`, `["profileEvents", user_id]`

- Invalidate relevant queries on post/send actions (e.g., after `POST /events`).

---

## 8) UX Details & Edge Cases

- **Feed ordering**: server returns chronological by `events.dateTime DESC`. Client trusts server ordering.  
- **Timezones**: server returns ISO in UTC; client formats local time via `dayjs.tz` (if using timezone plugin).
- **Images**: use `Image` with fixed aspect ratio for feed card hero photo. Show placeholder on error.
- **Empty states**: for feed, chats, profile events.
- **Error states**: network errors show a toast/snackbar + retry buttons.
- **Accessibility**: label buttons, adequate hit slop, supports dynamic font sizes.
- **Offline**: React Query cache enables read‑only viewing of last results. Mutations require network.

---

## 9) Minimal UI Skeleton (TypeScript)
Example of `/home` (feed) screen UI + header Chat button.

```tsx
// app/(tabs)/home.tsx
import { Link, Stack } from "expo-router";
import { FlatList, View, Text, Pressable, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

type FeedItem = {
  event: { event_id: string | number; name: string; description?: string; dateTime: string; coverUrl?: string; };
  poster: { name: string; pfp?: string; slug?: string; };
  post?: { messages?: string; imageUrl?: string; };
};

export default function HomeScreen() {
  // TODO: replace with real user id from auth store
  const userId = "demo-user-1";
  const { data } = useQuery<FeedItem[]>({
    queryKey: ["feed", userId],
    queryFn: async () => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/feed?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    }
  });

  return (
    <>
      <Stack.Screen options={{
        title: "TappClub",
        headerRight: () => <Link href="/chat" asChild><Pressable><Text>Chat</Text></Pressable></Link>
      }} />
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.event.event_id)}
        renderItem={({ item }) => (
          <View style={{ padding: 12, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Image source={{ uri: item.poster.pfp ?? "" }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#ddd" }} />
              <Link href={`/profile/${item.poster.slug ?? ""}`}><Text style={{ fontWeight: "600" }}>{item.poster.name}</Text></Link>
            </View>
            {item.event.coverUrl && (
              <Image source={{ uri: item.event.coverUrl }} style={{ width: "100%", height: 240, borderRadius: 8, backgroundColor: "#eee" }} />
            )}
            <Text>Date: {dayjs(item.event.dateTime).format("M/D/YYYY")}</Text>
            <Text>Time: {dayjs(item.event.dateTime).format("h:mm A")}</Text>
            {item.event.description ? <Text numberOfLines={3}>About: {item.event.description}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No recent events from friends.</Text>}
      />
    </>
  );
}
```

---

## 10) NFC Flow (client only)

1. On `/tapfriend`, user taps “Start Tap” → begin NDEF session:
   - `NfcManager.start()` (once globally).
   - `NfcManager.requestTechnology(NfcTech.Ndef)`.
   - Write or read an NDEF Text containing `{ uuid: currentUserUuid }`.
2. Upon **read**, call `POST /friends/tap` with both UUIDs (me + other).
3. Show success UI and invalidate `["feed", me]` & friends list queries.

**Notes**
- iOS requires physical proximity; show modal with instructions.
- Always call `NfcManager.cancelTechnologyRequest()` in `finally`.
- If permission/technology not available, show fallback “Share QR” (future).

---

## 11) Environment & Build

- **Env vars:** `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_AI_BASE_URL`.
- **iOS:** Add NFC entitlement via `react-native-nfc-manager` config plugin (EAS).
- **Android:** Min SDK 23+. NFC permission auto‑handled by the library.
- **EAS Build/Dev Client:** Required for NFC + native chat libs (if any).

---

## 12) Package.json (excerpt)
```json
{
  "dependencies": {
    "expo": "*",
    "expo-router": "*",
    "react": "*",
    "react-native": "*",
    "@tanstack/react-query": "*",
    "react-native-gesture-handler": "*",
    "react-native-reanimated": "*",
    "react-native-safe-area-context": "*",
    "@expo/vector-icons": "*",
    "expo-image": "*",
    "expo-image-picker": "*",
    "react-native-nfc-manager": "*",
    "dayjs": "*"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
```

---

## 13) Test Plan (v0.1)

- **Feed**: Render cards in descending time order. Verify date formatting & image placeholders.
- **Chat**: Load conversation list and a conversation’s messages (mock server). Send a message; ensure it appends and scrolls.
- **Larry**: Send a message with `@Larry` and verify the additional AI server POST is fired.
- **NFC**: Successful NDEF exchange between two test devices; server receives `other_user_uuid` and returns friend edge.
- **Profile**: Events list loads for self and other users.
- **Post Event**: Create event → see it in your profile and on friends’ feeds (when they follow you).

---

## 14) Out‑of‑Scope (this phase)

- Full authentication (social login, refresh tokens)
- Push notifications
- Map/Weather enrichments on device
- Media uploads to cloud storage (use static URLs or server‑provided placeholders)
- Advanced chat features (typing indicators, read receipts)

---

## 15) Mapping to the Provided Diagram

- **Routes:** `/Home`, `/Signup`, `/Chat/[slug]`, `/Profile/[slug]`, `/Feed`, `/Feed/[slug]`, `/TapFriend/[slug]` (we expose as `/tapfriend` single page), `/PostEvent` (as `/postevent`).
- **DB parity (client types):** `users`, `events`, `posts`, `friends`, `eventMembers`, `groupList`, `GroupMembers`, `Conversation` → reflected in Types section.
- **Server ops (future):** `createUser`, `getGroups(user_id)`, `getConversation(group_id)`, `sendMessage(...)`, `createEvent(...)`, `agentCreateEvent(group_id)`, `getUser`, `createGroup`, `getEventList(user_id)`, `getEvents(event_id)`. All represented in the API Contract.
- **Integrations:** `NFCmanager` for TapFriend; calendar/GPS/weather/maps can be added later via server enrichment.

---

## 16) Definition of Done (v0.1)

- All routes compile & navigate.
- Mock server URLs return mock JSON (or local Mirage/Mock Service Worker). Replace with Python server later.
- Core flows manually testable on **two physical devices** for NFC.
- Lint/TypeScript checks pass; basic unit tests for utilities exist.
