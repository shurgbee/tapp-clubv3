# Getting Started with TappClub

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Start Development Server

```bash
pnpm start
```

This will open Expo Dev Tools. From there:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone

## Available Scripts

- `pnpm start` - Start the Expo development server
- `pnpm android` - Open Android emulator
- `pnpm ios` - Open iOS simulator
- `pnpm web` - Open in web browser

## Project Structure

```
frontend/
├── app/                      # App screens (expo-router)
│   ├── (tabs)/              # Bottom tab navigation
│   │   ├── home.tsx         # Feed screen
│   │   ├── postevent.tsx    # Create event
│   │   ├── tapfriend.tsx    # NFC tap screen
│   │   └── profile.tsx      # User profile
│   ├── chat/                # Chat screens
│   │   ├── index.tsx        # Conversation list
│   │   └── [id].tsx         # Chat detail
│   ├── profile/[slug].tsx   # Other user profile
│   ├── feed/[id].tsx        # Event detail
│   └── signup.tsx           # Sign up screen
├── types/                   # TypeScript definitions
├── assets/                  # Images, fonts, etc.
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

## Key Features (Mock UI - v0.1)

### ✅ Implemented

- **Home Feed** - Beautiful event feed with mock data
- **Post Event** - Event creation form with image picker
- **Tap Friend** - NFC interface with animations
- **Profile** - User profile with events list
- **Chat** - Conversation list and chat interface
- **Larry AI** - AI assistant chat integration (mock)
- **User Profiles** - View other users' profiles and events

### 🔜 Coming Next (Backend Integration)

- Real API connections
- Authentication flow
- NFC functionality on physical devices
- Real-time chat with WebSocket
- Image upload to cloud storage
- Push notifications

## Navigation

The app uses **expo-router** for file-based navigation:

- `/` → Redirects to home or signup
- `/(tabs)/home` → Main feed
- `/(tabs)/postevent` → Create event
- `/(tabs)/tapfriend` → NFC tap friend
- `/(tabs)/profile` → Your profile
- `/chat` → Conversations list
- `/chat/[id]` → Specific conversation
- `/profile/[slug]` → Other user profile
- `/feed/[id]` → Event detail
- `/signup` → Sign up screen

## Mock Data

All screens use mock data defined in the components. This makes it easy to:

- Test UI without a backend
- Demonstrate all features
- Develop frontend independently

## Testing on Devices

### iOS (Mac required)

1. Install Xcode
2. Run `pnpm ios`

### Android

1. Install Android Studio
2. Create AVD (Android Virtual Device)
3. Run `pnpm android`

### Physical Device (Recommended for NFC)

1. Install Expo Go app
2. Scan QR code from terminal
3. For production NFC, use EAS Build

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.tappclub.com
EXPO_PUBLIC_AI_BASE_URL=https://ai.tappclub.com
```

For local development:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_AI_BASE_URL=http://localhost:8001
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

### Clear Cache

```bash
pnpm start --clear
```

### Reset Everything

```bash
rm -rf node_modules
pnpm install
pnpm start --clear
```

## Design System

### Colors

- **Primary**: `#6366f1` (Indigo)
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Text**: `#111827` (Gray 900)
- **Secondary Text**: `#6b7280` (Gray 500)
- **Background**: `#f9fafb` (Gray 50)

### Typography

- **Titles**: 24-28px, Bold (700)
- **Headers**: 18-20px, Bold (600-700)
- **Body**: 14-16px, Regular (400)
- **Captions**: 12-14px, Regular (400)

### Spacing

- Standard padding: 12-16px
- Card gaps: 8-12px
- Section spacing: 24-32px

## Next Steps

1. **Review the UI** - Open all screens and verify layouts
2. **Connect Backend** - Replace mock data with API calls
3. **Test Navigation** - Verify all routes work correctly
4. **Add Real Images** - Replace placeholder images
5. **Implement Auth** - Add login/signup flow

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://expo.github.io/router)
- [React Native](https://reactnative.dev)
- [React Query](https://tanstack.com/query)

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ using Expo + TypeScript**
