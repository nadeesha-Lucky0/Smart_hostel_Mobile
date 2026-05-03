import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Linking } from 'react-native';
import Colors from '../../constants/Colors';
import { Search, CheckCircle, XCircle, History, Eye, Info, CreditCard, ChevronRight, X, Calendar, User } from 'lucide-react-native';
import api from '../../services/api';

export default function WardenPayment() {
  const [subTab, setSubTab] = useState<'pending' | 'approved'>('pending');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<any>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/student-payments/monthly-submissions');
      setSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Fetch submissions error:', err);
      // Fallback or empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateStatus = async (studentId: string, submissionId: string, status: string) => {
    setActionLoading(submissionId);
    try {
      await api.patch(`/student-payments/monthly-submissions/${studentId}/${submissionId}`, { status });
      Alert.alert('Success', `Payment marked as ${status}`);
      fetchSubmissions();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingSubmissions = submissions.filter(s => 
    s.status === 'Pending' && 
    ((s.studentName || '').toLowerCase().includes(search.toLowerCase()) || 
     (s.rollNumber || s.studentRollNumber || '').toLowerCase().includes(search.toLowerCase()))
  );

  const approvedSubmissions = Array.from(new Set(submissions.filter(s => s.status === 'Accepted').map(s => s.studentId)))
    .map(id => submissions.find(s => s.studentId === id))
    .filter(s => 
      (s.studentName || '').toLowerCase().includes(search.toLowerCase()) || 
      (s.rollNumber || s.studentRollNumber || '').toLowerCase().includes(search.toLowerCase())
    );

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
          <Text style={styles.studentId}>{item.rollNumber || item.studentRollNumber}</Text>
        </View>
        <View style={[styles.wingBadge, { backgroundColor: item.wing === 'male' ? '#3B82F615' : '#EC489915' }]}>
          <Text style={[styles.wingBadgeText, { color: item.wing === 'male' ? '#3B82F6' : '#EC4899' }]}>
            {item.wing?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={Colors.textMuted} />
          <View style={styles.monthsContainer}>
            {item.months?.map((m: string) => (
              <View key={m} style={styles.monthBadge}>
                <Text style={styles.monthText}>{m.substring(0, 3)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.detailRow, { marginTop: 8 }]}>
          <Text style={styles.amountText}>LKR {item.amount?.toLocaleString()}</Text>
        </View>
      </View>

      {subTab === 'pending' ? (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.viewReceiptBtn} 
            onPress={() => item.documentUrl && Linking.openURL(item.documentUrl)}
          >
            <Eye size={18} color={Colors.roles.warden} />
            <Text style={styles.viewReceiptText}>Receipt</Text>
          </TouchableOpacity>
          
          <View style={styles.decisionActions}>
            <TouchableOpacity 
              style={[styles.actionIconBtn, styles.approveBtn]} 
              onPress={() => handleUpdateStatus(item.studentId, item.submissionId || item._id, 'Accepted')}
              disabled={!!actionLoading}
            >
              {actionLoading === (item.submissionId || item._id) ? 
                <ActivityIndicator size="small" color="#FFF" /> : 
                <CheckCircle size={20} color="#FFF" />
              }
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionIconBtn, styles.rejectBtn]} 
              onPress={() => handleUpdateStatus(item.studentId, item.submissionId || item._id, 'Rejected')}
              disabled={!!actionLoading}
            >
              <XCircle size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.historyBtn} onPress={() => setViewingHistory(item)}>
          <History size={16} color={Colors.roles.warden} />
          <Text style={styles.historyBtnText}>View Payment History</Text>
          <ChevronRight size={16} color={Colors.roles.warden} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.subTabBar}>
        <View style={styles.pillToggle}>
          <TouchableOpacity 
            style={[styles.pillBtn, subTab === 'pending' && styles.activePillBtn]} 
            onPress={() => setSubTab('pending')}
          >
            <Text style={[styles.pillBtnText, subTab === 'pending' && styles.activePillBtnText]}>
              Pending ({submissions.filter(s => s.status === 'Pending').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pillBtn, subTab === 'approved' && styles.activePillBtn]} 
            onPress={() => setSubTab('approved')}
          >
            <Text style={[styles.pillBtnText, subTab === 'approved' && styles.activePillBtnText]}>
              Approved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search student..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={subTab === 'pending' ? pendingSubmissions : approvedSubmissions}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.submissionId || item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CreditCard size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No payments to display</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchSubmissions}
        />
      )}

      {/* History Modal */}
      <Modal
        visible={!!viewingHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewingHistory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Payment History</Text>
                <Text style={styles.modalSub}>{viewingHistory?.studentName}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingHistory(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {submissions
                .filter(s => s.studentId === viewingHistory?.studentId && s.status === 'Accepted')
                .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                .map((sub, idx) => (
                  <View key={sub._id || idx} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <View style={styles.historyMonthRow}>
                        {sub.months?.map((m: string) => (
                          <View key={m} style={styles.historyMonthBadge}>
                            <Text style={styles.historyMonthText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.historyAmount}>LKR {sub.amount?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.historyItemFooter}>
                      <Text style={styles.historyDate}>Verified on {new Date(sub.updatedAt || sub.createdAt).toLocaleDateString()}</Text>
                      <TouchableOpacity onPress={() => sub.documentUrl && Linking.openURL(sub.documentUrl)}>
                        <Text style={styles.historyActionText}>View Receipt</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  subTabBar: { padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pillToggle: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 14, gap: 4 },
  pillBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activePillBtn: { backgroundColor: Colors.roles.warden, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  pillBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  activePillBtnText: { color: '#FFF' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 12, borderRadius: 12, height: 44, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.roles.warden },
  headerInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  wingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  wingBadgeText: { fontSize: 9, fontWeight: '800' },
  paymentDetails: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthsContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  monthBadge: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.roles.warden + '10', borderRadius: 4 },
  monthText: { fontSize: 10, fontWeight: '700', color: Colors.roles.warden, textTransform: 'uppercase' },
  amountText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewReceiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  viewReceiptText: { fontSize: 13, fontWeight: '700', color: Colors.roles.warden },
  decisionActions: { flexDirection: 'row', gap: 8 },
  actionIconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4 },
  historyBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingBottom: 40 },
  historyItem: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  historyItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  historyMonthRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyMonthBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: Colors.surface, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  historyMonthText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  historyAmount: { fontSize: 15, fontWeight: '900', color: Colors.roles.warden },
  historyItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border + '50' },
  historyDate: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  historyActionText: { fontSize: 12, fontWeight: '800', color: Colors.roles.warden },
});
