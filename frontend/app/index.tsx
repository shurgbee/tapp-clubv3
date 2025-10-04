import { Redirect } from "expo-router";

export default function Index() {
  // In a real app, check if user is authenticated
  // For now, redirect to home (feed)
  const isAuthenticated = true; // Mock auth check

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/signup" />;
}
