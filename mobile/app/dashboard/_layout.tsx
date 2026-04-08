import { Stack } from 'expo-router';

/**
 * Dashboard Flow Layout
 * Handles the stack navigation for all internal feature screens
 * within the professional dashboard group.
 */
export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profiles" />
      <Stack.Screen name="room-management" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="allocations" />
      <Stack.Screen name="complaints" />
      <Stack.Screen name="notices" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="records" />
      <Stack.Screen name="logs" />
      <Stack.Screen name="in-out" />
      <Stack.Screen name="resources" />
    </Stack>
  );
}
