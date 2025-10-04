# Custom Hooks

## useNFC

A React hook for managing NFC functionality in the TappClub app.

### Features

- ✅ Automatic NFC initialization and cleanup
- ✅ Device support detection
- ✅ Tag scanning with event listeners
- ✅ NDEF message reading
- ✅ NFC tag writing
- ✅ Error handling

### Usage

```tsx
import { useNFC } from "@/hooks/useNFC";

function MyComponent() {
  const handleTagDetected = (tag) => {
    console.log("Tag detected:", tag);
    // Handle the detected NFC tag
  };

  const { isScanning, isSupported, startScanning, stopScanning, writeNFC } = 
    useNFC(handleTagDetected);

  return (
    <View>
      {!isSupported && <Text>NFC not supported</Text>}
      
      <Button 
        onPress={startScanning} 
        disabled={isScanning}
        title={isScanning ? "Scanning..." : "Start Scan"}
      />
      
      {isScanning && (
        <Button onPress={stopScanning} title="Cancel" />
      )}
    </View>
  );
}
```

### API

#### Parameters

- `onTagDetected?: (tag: any) => void` - Callback function called when an NFC tag is detected

#### Returns

- `isScanning: boolean` - Whether NFC is currently scanning
- `isSupported: boolean` - Whether NFC is supported on the device
- `startScanning: () => Promise<void>` - Start scanning for NFC tags
- `stopScanning: () => Promise<void>` - Stop scanning
- `writeNFC: (message: string) => Promise<void>` - Write a message to an NFC tag

### Notes

- NFC is not available in iOS/Android simulators - requires physical device
- On iOS, NFC requires specific entitlements (already configured in app.json)
- On Android, NFC permission is automatically handled
- The hook automatically cleans up listeners on unmount

