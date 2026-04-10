import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import QRCode from 'react-native-qrcode-svg';
import { CreditCard, Bell, User, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudentQRView() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Entry Pass</Text>
        <Text style={styles.qrSubtitle}>Scan at hostel entrance</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={user?.id || 'guest'}
            size={width * 0.5}
            color={Colors.text}
            backgroundColor={Colors.surface}
          />
        </View>
        
        <Text style={styles.userId}>ID: {user?.email}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.iconBg, { backgroundColor: '#E0F2FE' }]}>
            <CreditCard size={24} color={Colors.roles.student} />
          </View>
          <Text style={styles.actionLabel}>Payments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
            <Bell size={24} color={Colors.accent} />
          </View>
          <Text style={styles.actionLabel}>Notices</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
          <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
            <LogOut size={24} color={Colors.danger} />
          </View>
          <Text style={styles.actionLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 32, paddingBottom: 60, backgroundColor: Colors.roles.student, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  welcome: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  qrCard: { backgroundColor: Colors.surface, marginHorizontal: 24, padding: 32, borderRadius: 32, marginTop: -40, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  qrTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  qrSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 24 },
  qrContainer: { padding: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  userId: { marginTop: 24, fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  quickActions: { flexDirection: 'row', padding: 32, justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', gap: 8 },
  iconBg: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
});
