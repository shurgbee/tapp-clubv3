# NFC Setup Instructions

## Why the Rebuild is Needed

The NFC feature requires native Android manifest configurations and iOS entitlements that can't be added at runtime. The working `react-native-nfc-rewriter` app has these configurations:

### Android Requirements:

- `android.nfc.action.TECH_DISCOVERED` intent filter in AndroidManifest.xml
- `nfc_tech_filter.xml` resource file defining supported NFC technologies (IsoDep, NfcA, etc.)
- NFC permission

### iOS Requirements:

- `NFCReaderUsageDescription` in Info.plist
- NFC entitlements for NDEF and TAG formats

## What We've Added

1. ✅ **Custom Config Plugin** (`plugins/withNFC.js`)
   - Automatically adds NFC tech filter to Android manifest
   - Creates `nfc_tech_filter.xml` with all NFC tech types
2. ✅ **Updated app.json**

   - Added iOS NFC entitlements
   - Added Android intent filters
   - Registered custom NFC config plugin

3. ✅ **useNFC Hook** (`hooks/useNFC.ts`)
   - Complete NFC functionality
   - Auto-initialization and cleanup
   - Popup alerts on tag detection
   - Support for scanning, reading, and writing

## How to Rebuild

### Option 1: Using Expo Prebuild (Recommended)

```bash
cd frontend

# Install dependencies if you haven't
pnpm install

# Prebuild native projects with custom config
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Run on iOS (Mac only)
npx expo run:ios
```

### Option 2: Using EAS Build (Production)

```bash
cd frontend

# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (if first time)
eas build:configure

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

## Testing NFC

### Requirements:

- **Physical device with NFC** (simulators don't support NFC)
- NFC must be enabled in device settings
- App must be in foreground

### Test Phone-to-Phone Detection:

1. Install the app on two NFC-enabled Android devices
2. Open the app on both devices
3. Navigate to the "Tap Friend" tab
4. Tap "Start Scanning" on both devices
5. Hold the phones back-to-back (where NFC antennas are located)
6. **Expected Result:** Both phones show a popup: "NFC Detected! 📱"
   - Tag ID will be displayed
   - Tech types will show: "IsoDep, NfcA"

### Test NFC Tag Reading:

1. Get an NFC tag (like NFC stickers, cards, or another phone)
2. Tap "Start Scanning" in the app
3. Hold the device near the NFC tag
4. **Expected Result:** Popup shows tag information

## Troubleshooting

### "NFC Not Supported"

- Device doesn't have NFC hardware
- Test on a different device

### "NFC Not Enabled"

- Go to device Settings → Connected devices → Connection preferences → NFC
- Toggle NFC on

### No Detection When Phones Touch

- Ensure both apps are in foreground
- Try different positions (NFC antenna location varies by device)
- Hold phones together for 2-3 seconds
- Remove phone cases if thick

### Build Errors

```bash
# Clear cache and rebuild
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

## Technologies Detected

When two phones tap together, you'll see these NFC technologies:

- **IsoDep** (ISO 14443-4) - Standard for contactless communication
- **NfcA** (ISO 14443-3A) - Lower-level NFC protocol

These are standard protocols that modern Android phones broadcast when their NFC is active.

## Next Steps

After NFC is working:

1. Implement user UUID exchange (write/read from tags)
2. Call backend API: `POST /friends/tap` with user IDs
3. Add friend confirmation flow
4. Add success animation
5. Add timeout handling

## Files Modified

- ✅ `app.json` - Added `react-native-nfc-manager` to plugins array
- ✅ `hooks/useNFC.ts` - NFC hook implementation (new)
- ✅ `app/(tabs)/tapfriend.tsx` - Already using the hook
- ⚠️ `plugins/withNFC.js` - NOT NEEDED (built-in plugin handles everything)

## Reference

Working implementation: `react-native-nfc-rewriter`

- AndroidManifest.xml (lines 46-56)
- nfc_tech_filter.xml
- NfcProxy.js `readNdefOnce` method (lines 78-111)
