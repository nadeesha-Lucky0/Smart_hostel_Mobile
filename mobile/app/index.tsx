import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  switch (user?.role) {
    case 'admin':
      return <Redirect href="/admin/dashboard" />;
    case 'warden':
      return <Redirect href="/warden/dashboard" />;
    case 'student':
      return <Redirect href="/student" />;
    case 'security':
      return <Redirect href="/security" />;
    case 'financial':
      return <Redirect href="/financial/dashboard" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
