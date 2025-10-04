# TappClub Mobile App

A React Native app for sharing and discovering events your friends attended, with NFC friend-tapping, chat (including AI assistant Larry), and event posting.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for Android development)
- For NFC features: EAS Build + physical devices

### Installation

1. Install dependencies:
```bash
cd frontend
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env
```

Edit `.env` with your API endpoints.

3. Start the development server:
```bash
pnpm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web (limited NFC support)

## 📱 Features

### Current (Mock UI - v0.1)

- **Home Feed** - View events from friends (mock data)
- **Post Event** - Create new event posts (UI only)
- **Tap Friend** - NFC friend connection interface (mock)
- **Profile** - View your profile and events
- **Chat** - Group conversations and Larry AI assistant (mock)
- **User Profiles** - View other users' profiles

### Navigation Structure

```
app/
├── (tabs)/
│   ├── home.tsx          → Home feed
│   ├── postevent.tsx     → Create event
│   ├── tapfriend.tsx     → NFC tap interface
│   └── profile.tsx       → Your profile
├── chat/
│   ├── index.tsx         → Conversations list
│   └── [id].tsx          → Chat detail
├── profile/[slug].tsx    → Other user profile
├── feed/[id].tsx         → Event details
└── signup.tsx            → Sign up screen
```

## 🛠️ Tech Stack

- **Framework**: Expo SDK 54+
- **Language**: TypeScript
- **Navigation**: expo-router (file-based)
- **State Management**: @tanstack/react-query
- **UI Components**: React Native
- **Icons**: @expo/vector-icons
- **Images**: expo-image, expo-image-picker
- **NFC**: react-native-nfc-manager
- **Date/Time**: dayjs

## 📝 Mock Data

All screens currently display mock data. The app is ready to connect to a backend API when available.

### Expected API Endpoints

- `GET /feed?user_id=<id>` - Get feed items
- `POST /events` - Create event
- `POST /friends/tap` - Add friend via NFC
- `GET /groups?user_id=<id>` - Get user's groups
- `GET /conversations/:group_id` - Get messages
- `POST /messages` - Send message
- `POST /agent/messages` - Send to AI (Larry)

## 🔧 Development

### Project Structure

```
frontend/
├── app/              → App screens (expo-router)
├── types/            → TypeScript type definitions
├── package.json      → Dependencies
└── app.json          → Expo configuration
```

### Adding New Screens

1. Create file in `app/` directory
2. Use expo-router conventions for navigation
3. Import shared types from `types/index.ts`

### Styling

- Uses StyleSheet for component styling
- Color scheme: Indigo primary (#6366f1)
- Consistent spacing and typography

## 📲 Building for Production

For NFC and native features, you'll need EAS Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🎯 Next Steps

1. **Connect to Backend** - Replace mock data with real API calls
2. **Authentication** - Implement user login/signup flow
3. **NFC Integration** - Test on physical devices
4. **Push Notifications** - Add event and message notifications
5. **Image Uploads** - Connect to cloud storage
6. **WebSocket** - Real-time chat updates

## 📄 License

Private - TappClub v3

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.
