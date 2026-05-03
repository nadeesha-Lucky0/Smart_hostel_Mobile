import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Colors from '../../constants/Colors';
import {
  Search,
  CheckCircle,
  XCircle,
  X,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import api from '../../services/api';

const ALL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_MONTH = ALL_MONTHS[new Date().getMonth()];

export default function Clearance() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Clearance Management States
  const [clearanceSubTab, setClearanceSubTab] = useState<'payments' | 'charges'>('payments');
  const [monthlyAdjustments, setMonthlyAdjustments] = useState<any[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<any[]>([]);
  const [keyStatus, setKeyStatus] = useState<'Returned' | 'Not Returned'>('Not Returned');
  const [wardenNotes, setWardenNotes] = useState('');
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/clearance');
      let data = response.data.data || response.data;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchStudentSubmissions = async (rollNumber: string) => {
    setLoadingSubmissions(true);
    try {
      const response = await api.get('/student-payments/monthly-submissions');
      const subs = response.data.filter((s: any) => 
        (s.rollNumber === rollNumber || s.studentRollNumber === rollNumber) && s.status === 'Accepted'
      );
      setStudentSubmissions(subs);
    } catch (err) {
      console.error('Submissions fetch error:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openClearanceDetails = (student: any) => {
    setSelectedStudent(student);
    fetchStudentSubmissions(student.studentRollNumber || student.rollNumber);
    setMonthlyAdjustments(student.monthlyAdjustments || []);
    setAdditionalCharges(student.additionalCharges || []);
    setKeyStatus(student.keyStatus || 'Not Returned');
    setWardenNotes(student.wardenNotes || '');
    setClearanceSubTab('payments');
  };

  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const data = {
        monthlyAdjustments,
        additionalCharges,
        keyStatus,
        wardenNotes,
        isWardenSubmitted: true,
        status: newStatus === 'Approved' ? 'In Progress' : newStatus
      };
      await api.patch(`/clearance/${studentId}/warden`, data);
      
      Alert.alert('Success', `Review submitted successfully`);
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustmentChange = (month: string, amount: string) => {
    setMonthlyAdjustments(prev => {
      const existing = prev.find(a => a.month === month);
      if (existing) {
        return prev.map(a => a.month === month ? { ...a, amount: parseFloat(amount) || 0 } : a);
      }
      return [...prev, { month, amount: parseFloat(amount) || 0 }];
    });
  };

  const addCharge = () => setAdditionalCharges([...additionalCharges, { amount: 0, note: '' }]);
  const removeCharge = (idx: number) => setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx));
  const handleChargeChange = (idx: number, field: string, value: string) => {
    setAdditionalCharges(prev => prev.map((c, i) => i === idx ? { ...c, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : c));
  };

  const totalAdjustments = monthlyAdjustments.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalAdditional = additionalCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const grandTotal = totalAdjustments + totalAdditional;

  const renderStudentItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => openClearanceDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
          <Text style={styles.studentId}>{item.studentRollNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'Approved' ? '#10B981' : Colors.accent) + '20' }]}>
          <Text style={[styles.statusText, { color: (item.status === 'Approved' ? '#10B981' : Colors.accent) }]}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Manage Clearance Review</Text>
        <ChevronRight size={16} color={Colors.roles.warden} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search student by name..."
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
          data={students.filter(s => 
            (s.studentName || '').toLowerCase().includes(search.toLowerCase())
          )}
          renderItem={renderStudentItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No clearance requests found</Text>}
        />
      )}

      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Clearance Management</Text>
              <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{(selectedStudent?.studentName || '?').charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{selectedStudent?.studentName}</Text>
                <Text style={styles.profileId}>{selectedStudent?.studentRollNumber}</Text>
              </View>

              <View style={styles.clearanceContainer}>
                <View style={styles.clearanceSubTabs}>
                  <View style={styles.pillToggle}>
                    <TouchableOpacity 
                      style={[styles.pillBtn, clearanceSubTab === 'payments' && styles.activePillBtn]} 
                      onPress={() => setClearanceSubTab('payments')}
                    >
                      <Text style={[styles.pillBtnText, clearanceSubTab === 'payments' && styles.activePillBtnText]}>Monthly Audit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.pillBtn, clearanceSubTab === 'charges' && styles.activePillBtn]} 
                      onPress={() => setClearanceSubTab('charges')}
                    >
                      <Text style={[styles.pillBtnText, clearanceSubTab === 'charges' && styles.activePillBtnText]}>Misc Charges</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {clearanceSubTab === 'payments' ? (
                  <View style={styles.clearanceContent}>
                    <View style={styles.gridHeader}>
                       <Info size={14} color={Colors.roles.warden} />
                       <Text style={styles.gridHeaderText}>Payment History Audit</Text>
                    </View>
                    {loadingSubmissions ? (
                      <ActivityIndicator size="small" color={Colors.roles.warden} />
                    ) : (
                      <View style={styles.monthGrid}>
                        {ALL_MONTHS.map(month => {
                          const isPaid = studentSubmissions.some(s => s.months?.includes(month));
                          const adjustment = monthlyAdjustments.find(a => a.month === month);
                          const isCurrentMonth = month === CURRENT_MONTH;
                          
                          return (
                            <View key={month} style={[
                              styles.monthCard, 
                              isPaid && styles.paidMonthCard,
                              isCurrentMonth && styles.currentMonthCard
                            ]}>
                              <View style={styles.monthCardHeader}>
                                <Text style={styles.monthName}>{month.substring(0, 3).toUpperCase()}</Text>
                                {isPaid ? <CheckCircle size={12} color="#10B981" /> : <XCircle size={12} color="#EF4444" />}
                              </View>
                              <Text style={styles.monthStatus}>{isPaid ? 'PAID' : 'DUE'}</Text>
                              {!isPaid && (
                                <TextInput
                                  style={styles.adjustmentInput}
                                  placeholder="0.0"
                                  keyboardType="numeric"
                                  value={adjustment?.amount === undefined ? '0.0' : adjustment.amount.toString()}
                                  onChangeText={(val) => handleAdjustmentChange(month, val)}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.clearanceContent}>
                    <TouchableOpacity style={styles.addChargeBtn} onPress={addCharge}>
                      <Text style={styles.addChargeBtnText}>+ Add Miscellaneous Charge</Text>
                    </TouchableOpacity>
                    {additionalCharges.map((charge, idx) => (
                      <View key={idx} style={styles.chargeItem}>
                        <View style={styles.chargeInputs}>
                          <TextInput
                            style={styles.chargeNoteInput}
                            placeholder="Reason..."
                            value={charge.note}
                            onChangeText={(val) => handleChargeChange(idx, 'note', val)}
                          />
                          <TextInput
                            style={styles.chargeAmountInput}
                            placeholder="Amt"
                            keyboardType="numeric"
                            value={charge.amount?.toString()}
                            onChangeText={(val) => handleChargeChange(idx, 'amount', val)}
                          />
                        </View>
                        <TouchableOpacity onPress={() => removeCharge(idx)}>
                          <XCircle size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {additionalCharges.length === 0 && (
                      <Text style={styles.emptyText}>No additional charges added</Text>
                    )}
                  </View>
                )}

                <View style={styles.keyReturnSection}>
                  <Text style={styles.label}>Key Return Status</Text>
                  <View style={styles.keyStatusToggle}>
                    <TouchableOpacity 
                      style={[styles.keyStatusBtn, keyStatus === 'Returned' && styles.keyStatusBtnActive]} 
                      onPress={() => setKeyStatus('Returned')}
                    >
                      <Text style={[styles.keyStatusText, keyStatus === 'Returned' && styles.keyStatusTextActive]}>Returned</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.keyStatusBtn, keyStatus === 'Not Returned' && styles.keyStatusBtnActive]} 
                      onPress={() => setKeyStatus('Not Returned')}
                    >
                      <Text style={[styles.keyStatusText, keyStatus === 'Not Returned' && styles.keyStatusTextActive]}>Not Returned</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.notesSection}>
                  <Text style={styles.label}>Warden Review Notes</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add specific instructions or notes..."
                    multiline
                    numberOfLines={3}
                    value={wardenNotes}
                    onChangeText={setWardenNotes}
                  />
                </View>

                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Due Amount</Text>
                    <Text style={styles.summaryValue}>LKR {grandTotal.toLocaleString()}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.primaryAction} 
                  onPress={() => handleUpdateStatus(selectedStudent._id, 'Approved')}
                  disabled={actionLoading}
                >
                   {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionText}>Submit Clearance Review</Text>}
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
  searchContainer: { padding: 16, backgroundColor: Colors.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 12, borderRadius: 16, height: 48, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.roles.warden },
  headerInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  viewDetailsText: { fontSize: 13, fontWeight: '700', color: Colors.roles.warden },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '95%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  largeAvatar: { width: 70, height: 70, borderRadius: 24, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  largeAvatarText: { fontSize: 28, fontWeight: '900', color: Colors.roles.warden },
  profileName: { fontSize: 20, fontWeight: '900', color: Colors.text },
  profileId: { fontSize: 14, color: Colors.textMuted, fontWeight: '700', marginTop: 4 },
  clearanceContainer: { marginTop: 8 },
  clearanceSubTabs: { marginBottom: 20 },
  pillToggle: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 14, gap: 4 },
  pillBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activePillBtn: { backgroundColor: Colors.roles.warden, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  pillBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  activePillBtnText: { color: '#FFF' },
  clearanceContent: { marginBottom: 20 },
  gridHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  gridHeaderText: { fontSize: 12, fontWeight: '800', color: Colors.roles.warden, textTransform: 'uppercase' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthCard: { width: '31%', backgroundColor: Colors.surface, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  paidMonthCard: { backgroundColor: '#10B98110', borderColor: '#10B98140' },
  currentMonthCard: { borderColor: '#EF4444', borderWidth: 2, backgroundColor: '#EF444405' },
  monthCardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  monthName: { fontSize: 10, fontWeight: '900', color: Colors.textMuted },
  monthStatus: { fontSize: 9, fontWeight: '800', marginBottom: 6 },
  adjustmentInput: { width: '100%', height: 32, backgroundColor: Colors.background, borderRadius: 6, fontSize: 11, fontWeight: '700', textAlign: 'center', padding: 0, color: Colors.text },
  addChargeBtn: { backgroundColor: Colors.roles.warden + '10', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.roles.warden + '40' },
  addChargeBtnText: { color: Colors.roles.warden, fontSize: 13, fontWeight: '800' },
  chargeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  chargeInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  chargeNoteInput: { flex: 2, height: 40, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: Colors.text },
  chargeAmountInput: { flex: 1.2, height: 40, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontWeight: '700', color: Colors.text },
  emptyText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', marginVertical: 20 },
  keyReturnSection: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  keyStatusToggle: { flexDirection: 'row', gap: 12, marginTop: 4 },
  keyStatusBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  keyStatusBtnActive: { backgroundColor: Colors.roles.warden, borderColor: Colors.roles.warden },
  keyStatusText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  keyStatusTextActive: { color: '#FFF' },
  notesSection: { marginBottom: 24 },
  notesInput: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  summarySection: { backgroundColor: Colors.roles.warden + '10', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: Colors.roles.warden, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.roles.warden },
  primaryAction: { backgroundColor: Colors.roles.warden, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});