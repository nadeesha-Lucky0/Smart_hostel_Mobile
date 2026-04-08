import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';

export default function GenericTabScreen() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase() || 'USER';
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>Allocations</Text>
        <Text style={s.subtitle}>Management Interface</Text>
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>Body details are being developed by group members.</Text>
          <Text style={s.roleText}>Role: {role}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, flex: 1 },
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.xl },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.border, borderRadius: 24, padding: Spacing.xl },
  placeholderText: { color: Colors.textSecondary, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  roleText: { color: Colors.primary, marginTop: 12, fontWeight: '800', fontSize: 12, letterSpacing: 1 }
});
