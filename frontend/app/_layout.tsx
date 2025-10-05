import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HCESessionProvider } from "react-native-hce";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <HCESessionProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen
              name="profile/[slug]"
              options={{
                headerShown: true,
                title: "Profile",
              }}
            />
            <Stack.Screen
              name="feed/[id]"
              options={{
                headerShown: true,
                title: "Event Details",
              }}
            />
            <Stack.Screen
              name="signup"
              options={{
                headerShown: true,
                title: "Sign Up",
              }}
            />
          </Stack>
        </HCESessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
