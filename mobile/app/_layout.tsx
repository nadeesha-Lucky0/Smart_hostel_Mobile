import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../store/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../constants/Colors";

/**
 * RootLayoutNav Component
 * Handles the authentication flow and redirection logic
 * following the new professional modular structure.
 */
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // Checks to see if the user is in a specific route group
    const inTabs = segments[0] === "dashboard";
    const inAuth = segments[0] === "(auth)";

    if (!user && !inAuth) {
      // If not logged in and not in auth pages, redirect to login
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      // If logged in but still on auth pages, redirect to dashboard
      router.replace("/dashboard");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
