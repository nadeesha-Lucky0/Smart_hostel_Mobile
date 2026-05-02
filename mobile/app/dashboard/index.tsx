import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { Colors } from '../../constants/Colors';
import { SecurityView, StudentView, WardenView } from './in-out';

export default function DashboardScreen() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  if (role === 'security') return <SecurityView />;
  if (role === 'warden') return <WardenView />;
  if (role === 'student' || !role) return <StudentView user={user} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Dashboard Not Mapped</Text>
        <Text style={styles.subtitle}>
          This role does not have an app-only dashboard route yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
