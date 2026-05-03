import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import { Users, ShieldCheck, Activity, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Mock fetch or actual API call if exists
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Colors.roles.admin} 
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back,</Text>
        <Text style={styles.name}>{user?.name || 'Administrator'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: '#EEF2FF' }]}>
          <Users size={24} color={Colors.primary} />
          <Text style={styles.statValue}>1,240</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#ECFDF5' }]}>
          <ShieldCheck size={24} color={Colors.secondary} />
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statLabel}>Pending Verification</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Activity size={20} color={Colors.primary} style={styles.actionIcon} />
          <Text style={styles.actionText}>System Health Check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} style={styles.actionIcon} />
          <Text style={[styles.actionText, { color: Colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: Colors.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  greeting: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },
  name: { fontSize: 28, fontWeight: '800', color: Colors.text },
  statsContainer: { flexDirection: 'row', padding: 24, gap: 16 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  section: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12 },
  actionIcon: { marginRight: 12 },
  actionText: { fontSize: 16, fontWeight: '600', color: Colors.text },
});
