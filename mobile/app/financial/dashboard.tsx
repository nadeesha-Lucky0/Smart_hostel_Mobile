import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Linking } from 'react-native';
import Colors from '../../constants/Colors';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Eye, 
  Info, 
  ArrowRight, 
  X, 
  Calendar, 
  DollarSign, 
  User, 
  Wallet, 
  Clipboard, 
  ChevronRight,
  FileText
} from 'lucide-react-native';
import api from '../../services/api';
import * as ExpoClipboard from 'expo-clipboard';

type FinancialTab = 'deposits' | 'refunds' | 'transfers';

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState<FinancialTab>('deposits');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [clearances, setClearances] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedClearance, setSelectedClearance] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, clearancesRes] = await Promise.all([
        api.get('/financial/refundable'),
        api.get('/clearance/financial')
      ]);
      
      setPayments(paymentsRes.data.success ? (paymentsRes.data.data || []) : []);
      setClearances(Array.isArray(clearancesRes.data) ? clearancesRes.data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaymentStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/financial/refundable/${id}/status`, { status });
      if (res.data.success) {
        Alert.alert('Success', `Payment ${status.toLowerCase()} successfully`);
        setPayments(prev => prev.map(p => p._id === id ? res.data.data : p));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearanceStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await api.patch(`/clearance/${id}/warden`, { status });
      if (res.data.success) {
        Alert.alert('Success', `Clearance ${status.toLowerCase()} successfully`);
        setClearances(prev => prev.map(c => c._id === id ? res.data.data : c));
        setSelectedClearance(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update clearance status');
    } finally {
      setUpdatingId(null);
    }
  };

  const calculateRefund = (clearance: any) => {
    if (!clearance) return 0;
    const initialDeposit = clearance.paymentHistory?.refundPayment?.amount || 0;
    const totalAdjustments = (clearance.monthlyAdjustments || []).reduce((sum: number, adj: any) => sum + (Number(adj.amount) || 0), 0);
    const totalCharges = (clearance.additionalCharges || []).reduce((sum: number, char: any) => sum + (Number(char.amount) || 0), 0);
    return initialDeposit - totalAdjustments - totalCharges;
  };

  const copyToClipboard = async (text: string) => {
    await ExpoClipboard.setStringAsync(text);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  const filteredData = () => {
    const query = search.toLowerCase().trim();
    if (activeTab === 'deposits') {
      return payments.filter(p => 
        (p.studentName || '').toLowerCase().includes(query) || 
        (p.rollNumber || '').toLowerCase().includes(query)
      );
    } else if (activeTab === 'refunds') {
      return clearances.filter(c => 
        c.status !== 'Approved' && c.status !== 'Rejected' &&
        ((c.studentName || '').toLowerCase().includes(query) || 
         (c.studentRollNumber || '').toLowerCase().includes(query))
      );
    } else {
      return clearances.filter(c => 
        c.status === 'Approved' &&
        ((c.studentName || '').toLowerCase().includes(query) || 
         (c.studentRollNumber || '').toLowerCase().includes(query))
      );
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'deposits') {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.studentName}</Text>
              <Text style={styles.subtitle}>{item.rollNumber || item.studentId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.refund_status === 'Accepted' ? '#10B98120' : '#F59E0B20' }]}>
              <Text style={[styles.statusText, { color: item.refund_status === 'Accepted' ? '#10B981' : '#F59E0B' }]}>
                {item.refund_status || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Refundable Payment</Text>
            <Text style={styles.amountValue}>LKR {item.refundPayment?.amount?.toLocaleString() || '0'}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => item.refundPayment?.documentUrl && Linking.openURL(item.refundPayment.documentUrl)}
            >
              <Eye size={18} color={Colors.roles.financial} />
              <Text style={styles.actionBtnText}>Receipt</Text>
            </TouchableOpacity>

            <View style={styles.decisionGroup}>
              <TouchableOpacity 
                style={[styles.iconBtn, styles.approveBtn]} 
                onPress={() => handlePaymentStatus(item._id, 'Accepted')}
                disabled={!!updatingId || item.refund_status === 'Accepted'}
              >
                <CheckCircle size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconBtn, styles.rejectBtn]} 
                onPress={() => handlePaymentStatus(item._id, 'Rejected')}
                disabled={!!updatingId || item.refund_status === 'Rejected'}
              >
                <XCircle size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    } else if (activeTab === 'refunds') {
      return (
        <TouchableOpacity style={styles.card} onPress={() => setSelectedClearance(item)}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: Colors.roles.financial + '15' }]}>
              <FileText size={20} color={Colors.roles.financial} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.studentName}</Text>
              <Text style={styles.subtitle}>{item.studentRollNumber || item.rollNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.isWardenSubmitted ? '#10B98120' : '#F59E0B20' }]}>
              <Text style={[styles.statusText, { color: item.isWardenSubmitted ? '#10B981' : '#F59E0B' }]}>
                {item.isWardenSubmitted ? 'Approved' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</Text>
            <ChevronRight size={16} color={Colors.roles.financial} />
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.studentName}</Text>
              <Text style={styles.subtitle}>{item.studentRollNumber || item.rollNumber}</Text>
            </View>
          </View>

          <View style={styles.bankCard}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Bank:</Text>
              <Text style={styles.bankValue}>{item.bankDetails?.bankName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account:</Text>
              <Text style={[styles.bankValue, { color: Colors.roles.financial, fontWeight: '800' }]}>{item.bankDetails?.accountNumber}</Text>
            </View>
          </View>

          <View style={styles.transferFooter}>
            <View>
              <Text style={styles.refundLabel}>Net Refund</Text>
              <Text style={styles.refundValue}>LKR {calculateRefund(item).toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(item.bankDetails?.accountNumber)}>
              <Clipboard size={16} color="#FFF" />
              <Text style={styles.copyBtnText}>Copy No</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>

      {/* Synchronized Tab Bar */}
      <View style={styles.tabBar}>
        {(['deposits', 'refunds', 'transfers'] as const).map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'deposits' ? 'Deposits' : tab === 'refunds' ? 'Clearance' : 'Transfers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search Name or ID..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.roles.financial} />
        </View>
      ) : (
        <FlatList 
          data={filteredData()}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Info size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No records found</Text>
            </View>
          }
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {/* Clearance Review Modal */}
      <Modal
        visible={!!selectedClearance}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedClearance(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Refund</Text>
              <TouchableOpacity onPress={() => setSelectedClearance(null)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.studentInfo}>
                <Text style={styles.infoName}>{selectedClearance?.studentName}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoId}>{selectedClearance?.studentRollNumber}</Text>
                  <Text style={styles.infoDot}>•</Text>
                  <Text style={styles.infoPhone}>{selectedClearance?.studentPhone || 'No Phone'}</Text>
                </View>
              </View>

              <View style={styles.calculationBox}>
                <Text style={styles.sectionLabel}>Financial Summary</Text>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Initial Deposit</Text>
                  <Text style={styles.calcValue}>LKR {selectedClearance?.paymentHistory?.refundPayment?.amount?.toLocaleString() || '0'}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Monthly Dues</Text>
                  <Text style={[styles.calcValue, { color: '#EF4444' }]}>- LKR {(selectedClearance?.monthlyAdjustments || []).reduce((sum: number, a: any) => sum + (a.amount || 0), 0).toLocaleString()}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Extra Charges</Text>
                  <Text style={[styles.calcValue, { color: '#EF4444' }]}>- LKR {(selectedClearance?.additionalCharges || []).reduce((sum: number, a: any) => sum + (a.amount || 0), 0).toLocaleString()}</Text>
                </View>
                
                {/* Breakdown of Extra Charges */}
                {(selectedClearance?.additionalCharges || []).length > 0 && (
                  <View style={styles.breakdownList}>
                    {selectedClearance.additionalCharges.map((char: any, idx: number) => (
                      <View key={idx} style={styles.breakdownItem}>
                        <Text style={styles.breakdownNote}>{char.note || 'No note'}</Text>
                        <Text style={styles.breakdownAmount}>LKR {char.amount?.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.calcDivider} />
                <View style={styles.calcRow}>
                  <Text style={styles.totalLabel}>Total Refund</Text>
                  <Text style={styles.totalValue}>LKR {calculateRefund(selectedClearance).toLocaleString()}</Text>
                </View>
              </View>

              {/* Status Section */}
              <View style={styles.statusGroup}>
                 <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Key Status</Text>
                    <Text style={[styles.statusVal, { color: selectedClearance?.keyStatus === 'Returned' ? '#10B981' : '#EF4444' }]}>
                      {selectedClearance?.keyStatus || 'Pending'}
                    </Text>
                 </View>
                 <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Warden Review</Text>
                    <Text style={[styles.statusVal, { color: selectedClearance?.isWardenSubmitted ? '#10B981' : '#F59E0B' }]}>
                      {selectedClearance?.isWardenSubmitted ? 'Completed' : 'In Progress'}
                    </Text>
                 </View>
              </View>

              {/* Bank Details */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Bank Account Details</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Holder</Text>
                    <Text style={styles.detailVal}>{selectedClearance?.bankDetails?.accountHolderName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Bank</Text>
                    <Text style={styles.detailVal}>{selectedClearance?.bankDetails?.bankName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Branch</Text>
                    <Text style={styles.detailVal}>{selectedClearance?.bankDetails?.branchName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Account</Text>
                    <Text style={[styles.detailVal, { color: Colors.roles.financial, fontWeight: '900' }]}>{selectedClearance?.bankDetails?.accountNumber || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {/* Payment History */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Payment History</Text>
                <View style={styles.historyList}>
                  {(selectedClearance?.paymentHistory?.submittedMonths || []).map((m: any, idx: number) => (
                    <View key={idx} style={styles.historyItem}>
                      <View>
                        <Text style={styles.historyMonth}>{Array.isArray(m.months) ? m.months.join(', ') : m.month}</Text>
                        <Text style={styles.historyDate}>{new Date(m.submittedDate).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={styles.historyAmount}>LKR {m.amount?.toLocaleString()}</Text>
                        <Text style={[styles.historyStatus, { color: m.status === 'Accepted' ? '#10B981' : '#F59E0B' }]}>{m.status}</Text>
                      </View>
                    </View>
                  ))}
                  {(selectedClearance?.paymentHistory?.submittedMonths || []).length === 0 && (
                    <Text style={styles.emptySmall}>No payment records found</Text>
                  )}
                </View>
              </View>

              {!selectedClearance?.isWardenSubmitted && (
                <View style={styles.warningBox}>
                  <Info size={16} color="#F59E0B" />
                  <Text style={styles.warningText}>Waiting for Warden's final review before approval</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.approveBtnModal, (!selectedClearance?.isWardenSubmitted || !!updatingId) && styles.disabledBtn]} 
                  onPress={() => handleClearanceStatus(selectedClearance._id, 'Approved')}
                  disabled={!selectedClearance?.isWardenSubmitted || !!updatingId}
                >
                  <Text style={styles.modalBtnText}>Approve Refund</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.rejectBtnModal, !!updatingId && styles.disabledBtn]} 
                  onPress={() => handleClearanceStatus(selectedClearance._id, 'Rejected')}
                  disabled={!!updatingId}
                >
                  <Text style={styles.modalBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14 },
  activeTab: { backgroundColor: Colors.roles.financial + '15' },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  activeTabText: { color: Colors.roles.financial },
  searchBox: { padding: 16, backgroundColor: Colors.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 12, borderRadius: 16, height: 48, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.roles.financial + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.roles.financial },
  headerInfo: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  amountBox: { backgroundColor: Colors.background, padding: 16, borderRadius: 16, marginBottom: 16 },
  amountLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  amountValue: { fontSize: 18, fontWeight: '900', color: Colors.text },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.background, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.roles.financial },
  decisionGroup: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 12 },
  footerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  bankCard: { backgroundColor: Colors.background, padding: 16, borderRadius: 16, marginBottom: 16, gap: 8 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  bankValue: { fontSize: 13, fontWeight: '800', color: Colors.text },
  transferFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refundLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  refundValue: { fontSize: 16, fontWeight: '900', color: '#10B981' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.roles.financial, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  copyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalBody: { paddingBottom: 40 },
  studentInfo: { alignItems: 'center', marginBottom: 20 },
  infoName: { fontSize: 22, fontWeight: '900', color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  infoId: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  infoDot: { color: Colors.border, fontSize: 16 },
  infoPhone: { fontSize: 13, fontWeight: '800', color: Colors.roles.financial },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  calculationBox: { backgroundColor: Colors.background, borderRadius: 24, padding: 20, gap: 10, marginBottom: 20 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  calcValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  breakdownList: { marginTop: 10, gap: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.border },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownNote: { fontSize: 11, color: Colors.textMuted, flex: 1, fontStyle: 'italic' },
  breakdownAmount: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  calcDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: Colors.text },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#10B981' },
  statusGroup: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statusBox: { flex: 1, backgroundColor: Colors.background, padding: 16, borderRadius: 20, alignItems: 'center' },
  statusLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  statusVal: { fontSize: 13, fontWeight: '900' },
  detailSection: { marginBottom: 20 },
  detailCard: { backgroundColor: Colors.background, borderRadius: 24, padding: 20, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailKey: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  detailVal: { fontSize: 12, fontWeight: '800', color: Colors.text },
  historyList: { gap: 12 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  historyMonth: { fontSize: 13, fontWeight: '800', color: Colors.text },
  historyDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 14, fontWeight: '900', color: Colors.text },
  historyStatus: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  emptySmall: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', padding: 20 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F59E0B15', padding: 12, borderRadius: 12, marginBottom: 24 },
  warningText: { fontSize: 12, color: '#F59E0B', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  approveBtnModal: { backgroundColor: '#10B981' },
  rejectBtnModal: { backgroundColor: '#EF4444' },
  modalBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  disabledBtn: { opacity: 0.5 },
});
