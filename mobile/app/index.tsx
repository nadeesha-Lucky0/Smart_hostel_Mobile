import { Redirect } from "expo-router";
import { useAuth } from "../store/AuthContext";
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
 * Root Entry Point (index.tsx)
 * This is the first file loaded when the app starts.
 * It strictly redirects to either authentication or role home
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
    return <Redirect href={getHomeRouteByRole(user.role)} />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
