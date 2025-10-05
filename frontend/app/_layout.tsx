import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {Auth0Provider} from 'react-native-auth0';
import { useEffect } from "react";

const queryClient = new QueryClient();
  const domain = process.env.AUTH_DOMAIN;
  const clientID = process.env.AUTH_CLIENT_ID;
  console.log(domain);

export default function RootLayout() {
  return (
    <>
  <Auth0Provider domain={domain ?? ""} clientId={clientID ?? ""}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </GestureHandlerRootView>
    </Auth0Provider>
  </>
  );
}
