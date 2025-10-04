# Tapp Club App Specification

## 1. Home Page (/Home)

- Display user's upcoming events (from `getEventList(user_id)`)
- Show quick access buttons: Calendar, Feed, Chat
- Include user greeting and profile picture
- Allow navigation to Signup, Feed, Profile, and PostEvent pages

## 2. Signup Page (/Signup)

- **Input fields:**
  - Name
  - Location
  - Profile Picture (pfp)
  - Calendar connection (optional)
- **Validation:** Ensure required fields are filled
- **Submit:** Triggers `createUser(stuff)` on server

## 3. Chat Pages (/Chat/[slug])

- List all groups user belongs to (`getGroups(user_id)`)
- **For each group, display:**
  - Group name, profile picture
  - Last message preview, timestamp
- **Clicking a group:** Opens conversation (`getConversation(group_id)`)
- **Message input:**
  - Text field + send button
  - Message type selection if applicable
  - `sendMessage(user_id, group_id, messageType, message)` triggers server

## 4. Profile Pages (/Profile/[slug])

- Show user details: Name, Location, Profile Picture
- List user's groups (`createGroup(user_id[])` for new group creation)
- Edit button to update profile info
- Display friend list (option to view each friend's profile)

## 5. Feed Pages (/Feed and /Feed/[slug])

- Show global or user-specific feed
- **Each post:**
  - User info, message content
  - Associated event if applicable
- Allow liking, commenting, and tapping on events (`TapEvent`) or friends (`TapFriend`)

## 6. Tap Pages

### Tap Friend (/TapFriend/[slug])

- Show friend's profile details
- List mutual events and groups
- Button to start chat

### Tap Event (/TapEvent/[slug])

- Show event details (name, description, dateTime)
- List attendees (`eventMembers`)
- Button to join or chat about event

## 7. Post Event Page (/PostEvent/)

- **Input fields:**
  - Event Name
  - Description
  - Date/Time
- **Submit:** Triggers `createEvent(name, description, dateTime)` on server
- Option to auto-add event to group chat (`agentCreateEvent(group_id)`)

## 8. Global UI Elements

- **Navigation bar:** Home, Feed, Chat, Profile, Post Event
- Responsive layout for mobile and desktop
- Notifications for messages and events
- **Integration with device features:**
  - Calendar
  - GPS (for location-based events/friends)
  - NFC manager (if used for attendance or friend connections)
