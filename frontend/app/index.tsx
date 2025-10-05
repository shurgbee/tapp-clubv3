import { Redirect, useRouter } from "expo-router";
import { useAuth0 } from 'react-native-auth0';
import { Button, View, Text, ActivityIndicator } from "react-native";
import { useEffect } from "react";

export default function Index() {
  const { user, error, authorize, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log(user)
      router.replace('/(tabs)/home');
    }
  }, [user]);

  const onLogin = async () => {
    try {
      await authorize();
      console.log(user)
    } catch (e) {
      console.log(e);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Oops, something went wrong</Text>
        <Text>{error.message}</Text>
        <Button title="Try Again" onPress={onLogin} />
      </View>
    );
  }

  // If there is no user, show the login button
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to TappClub</Text>
      <Button title="Log in" onPress={onLogin} />
    </View>
  );
}
