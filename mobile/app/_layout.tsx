import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../store/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../constants/Colors";

type AppHomeRoute =
  | "/admin/dashboard"
  | "/warden/dashboard"
  | "/student"
  | "/security/qr-scanner"
  | "/financial/verify-payments";

function getHomeRouteByRole(role?: string): AppHomeRoute {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "warden":
      return "/warden/dashboard";
    case "student":
      return "/student";
    case "security":
      return "/security/qr-scanner";
    case "financial":
      return "/financial/verify-payments";
    default:
      return "/student";
  }
}

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
    const inAuth = segments[0] === "(auth)";
    const targetRoute = getHomeRouteByRole(user?.role);
    const targetSegment = targetRoute.split("/")[1];
    const inRoleRoot = segments[0] === targetSegment;

    if (!user && !inAuth) {
      // If not logged in and not in auth pages, redirect to login
      router.replace("/(auth)/login");
    } else if (user && (inAuth || !inRoleRoot)) {
      // If logged in and not in the role area, redirect to role home
      router.replace(targetRoute);
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
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="warden" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="security" options={{ headerShown: false }} />
      <Stack.Screen name="financial" options={{ headerShown: false }} />
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
