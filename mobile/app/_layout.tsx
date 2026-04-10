import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="admin/dashboard" options={{ title: 'Admin Panel' }} />
        <Stack.Screen name="warden/allocations" options={{ title: 'Warden Dashboard' }} />
        <Stack.Screen name="student/qr-view" options={{ title: 'Student Portal' }} />
        <Stack.Screen name="security/qr-scanner" options={{ title: 'Security Log' }} />
        <Stack.Screen name="financial/verify-payments" options={{ title: 'Financial Records' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
