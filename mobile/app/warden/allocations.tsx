import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { BedDouble, UserPlus, FileText, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function WardenAllocations() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Warden Management</Text>
        <Text style={styles.subtitle}>Allocations & Operation</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem}>
          <BedDouble size={32} color={Colors.roles.warden} />
          <Text style={styles.gridLabel}>Room Allocation</Text>
          <Text style={styles.gridSub}>Assign beds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <UserPlus size={32} color={Colors.roles.warden} />
          <Text style={styles.gridLabel}>New Application</Text>
          <Text style={styles.gridSub}>23 Pending</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.logItem}>
          <FileText size={18} color={Colors.textMuted} />
          <Text style={styles.logText}>Room 302 allocated to S. Perera</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 32, backgroundColor: Colors.roles.warden, borderBottomLeftRadius: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  grid: { flexDirection: 'row', padding: 24, gap: 16 },
  gridItem: { flex: 1, backgroundColor: Colors.surface, padding: 20, borderRadius: 24, alignItems: 'center', elevation: 2 },
  gridLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 12, textAlign: 'center' },
  gridSub: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  section: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 8 },
  logText: { marginLeft: 12, color: Colors.text, fontSize: 14 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, gap: 8 },
  logoutText: { color: Colors.danger, fontWeight: '700' },
});
