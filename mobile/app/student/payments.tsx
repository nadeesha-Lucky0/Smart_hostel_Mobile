import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Plus, 
  Download,
  Filter,
  ArrowUpRight
} from 'lucide-react-native';
import api from '../../services/api';

export default function StudentPayments() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Endpoint for student's own payments
      const res = await api.get('/student-payments/status');
      setPayments(res.data);
    } catch (err) {
      console.error('Fetch student payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.balanceCard}>
             <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
             <Text style={styles.balanceValue}>Rs. 0.00</Text>
             <View style={styles.balanceFooter}>
                <Text style={styles.balanceSub}>Next payment due in 12 days</Text>
                <TouchableOpacity style={styles.payNowBtn}>
                   <Text style={styles.payNowText}>Pay Now</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>

        <View style={styles.historySection}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              <TouchableOpacity>
                 <Filter size={18} color={Colors.textMuted} />
              </TouchableOpacity>
           </View>

           {loading ? (
             <ActivityIndicator size="large" color={Colors.roles.student} style={{ marginTop: 40 }} />
           ) : payments.length > 0 ? (
             payments.map((p, index) => (
                <View key={p._id || index} style={styles.paymentCard}>
                   <View style={styles.paymentIconBox}>
                      <ArrowUpRight size={20} color={Colors.roles.student} />
                   </View>
                   <View style={styles.paymentMainInfo}>
                      <Text style={styles.paymentTitle}>{p.paymentType || 'Hostel Fee'}</Text>
                      <Text style={styles.paymentDate}>{new Date(p.createdAt || p.date).toLocaleDateString()}</Text>
                   </View>
                   <View style={styles.paymentAmountBox}>
                      <Text style={styles.paymentAmount}>Rs. {p.amount}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: p.status === 'success' ? '#10B98115' : '#F59E0B15' }]}>
                         <Text style={[styles.statusText, { color: p.status === 'success' ? '#10B981' : '#F59E0B' }]}>
                           {p.status === 'success' ? 'Verified' : 'Pending'}
                         </Text>
                      </View>
                   </View>
                </View>
             ))
           ) : (
             <View style={styles.emptyContainer}>
               <CreditCard size={48} color={Colors.border} />
               <Text style={styles.emptyText}>No payment records found</Text>
               <TouchableOpacity style={styles.refreshBtn} onPress={fetchPayments}>
                  <Text style={styles.refreshText}>Check Again</Text>
               </TouchableOpacity>
             </View>
           )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { padding: 24 },
  balanceCard: { backgroundColor: '#1E293B', borderRadius: 28, padding: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  balanceLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  balanceValue: { fontSize: 32, fontWeight: '800', color: '#FFF', marginTop: 8 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  balanceSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  payNowBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  payNowText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  historySection: { padding: 24, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 20, marginBottom: 12, elevation: 1 },
  paymentIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center' },
  paymentMainInfo: { flex: 1, marginLeft: 16 },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  paymentDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  paymentAmountBox: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  refreshBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  refreshText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
});
