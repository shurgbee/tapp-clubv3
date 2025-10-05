import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {Auth0Provider} from 'react-native-auth0';
import { useEffect } from "react";
import { HCESessionProvider } from "react-native-hce";

const queryClient = new QueryClient();
const domain = process.env.EXPO_PUBLIC_AUTH_DOMAIN;
const clientID = process.env.EXPO_PUBLIC_AUTH_CLIENT_ID;
console.log("Auth0 Config - Domain:", domain, "| Client ID:", clientID);

export default function RootLayout() {
  return (
    <>
      <Auth0Provider domain={domain ?? ""} clientId={clientID ?? ""}>
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
                  name="profile/edit"
                  options={{
                    headerShown: true,
                    title: "Edit Profile",
                  }}
                />
                <Stack.Screen
                  name="feed/[id]"
                  options={{
                    headerShown: true,
                    title: "Event Details",
                  }}
                />
              </Stack>
            </HCESessionProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </Auth0Provider>
    </>
  );
}
