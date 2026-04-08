import { Redirect } from "expo-router";
import { useAuth } from "../store/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../constants/Colors";

/**
 * Root Entry Point (index.tsx)
 * This is the first file loaded when the app starts.
 * It strictly redirects to either authentication or dashboard
 * based on the user's login state.
 */
export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Pure Redirection Logic
  if (user) {
    return <Redirect href="/dashboard" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
