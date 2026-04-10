import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import Colors from '../../constants/Colors';
import { DollarSign, CheckCircle, Clock, Filter, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

const MOCK_PAYMENTS = [
  { id: '1', student: 'Kamal Silva', amount: 'Rs. 5,000', status: 'Pending', date: '2024-04-10' },
  { id: '2', student: 'Nimali Fonseka', amount: 'Rs. 12,000', status: 'Verified', date: '2024-04-09' },
  { id: '3', student: 'Ashan Silva', amount: 'Rs. 8,500', status: 'Pending', date: '2024-04-08' },
];

export default function FinancialPayments() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Dashboard</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>Rs. 450k</Text>
            <Text style={styles.summaryLabel}>Received</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>To Verify</Text>
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Payments</Text>
          <TouchableOpacity>
            <Filter size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={MOCK_PAYMENTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.studentName}>{item.student}</Text>
                <Text style={styles.paymentDate}>{item.date}</Text>
              </View>
              <View style={styles.paymentStatus}>
                <Text style={styles.amount}>{item.amount}</Text>
                <View style={[styles.badge, item.status === 'Verified' ? styles.verifiedBadge : styles.pendingBadge]}>
                  {item.status === 'Verified' ? (
                    <CheckCircle size={12} color={Colors.secondary} />
                  ) : (
                    <Clock size={12} color={Colors.accent} />
                  )}
                  <Text style={[styles.badgeText, item.status === 'Verified' ? styles.verifiedText : styles.pendingText]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 32, backgroundColor: Colors.roles.financial, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 20 },
  summaryContainer: { flexDirection: 'row', gap: 16 },
  summaryBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 16 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  listSection: { flex: 1, padding: 24 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  listContent: { paddingBottom: 20 },
  paymentCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2 },
  studentName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  paymentDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  paymentStatus: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginTop: 8 },
  verifiedBadge: { backgroundColor: '#ECFDF5' },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  verifiedText: { color: Colors.secondary },
  pendingText: { color: Colors.accent },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20, gap: 8 },
  logoutText: { color: Colors.danger, fontWeight: '700' },
});
