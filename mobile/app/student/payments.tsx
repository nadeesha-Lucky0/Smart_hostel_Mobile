import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, 
  Alert, Modal, TextInput, Platform, Linking, RefreshControl 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { 
  DollarSign, CheckCircle, Clock, FileText, 
  AlertTriangle, User, Calendar, UploadCloud, X, Edit, Eye
} from 'lucide-react-native';

export default function StudentPayments() {
  const { user } = useAuthStore();
  const [initialData, setInitialData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editFile, setEditFile] = useState<any>(null);

  // Refundable Form State
  const [refundableAmount, setRefundableAmount] = useState('');
  const [refundableFile, setRefundableFile] = useState<any>(null);

  // Monthly Form State
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [monthlyFile, setMonthlyFile] = useState<any>(null);

  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  const visibleMonths = (() => {
    if (!initialData?.joinedAt) return monthOptions;
    const joinDate = new Date(initialData.joinedAt);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();

    if (currentYear === joinYear) {
        return monthOptions.slice(joinMonth);
    }
    return monthOptions;
  })();

  const paidMonths = paymentStatus?.submittedMonths
    ? paymentStatus.submittedMonths
        .filter((m: any) => m.status === 'Accepted' && m.year === currentYear)
        .flatMap((m: any) => m.months || [m.month])
    : [];

  const toggleMonth = (m: string) => {
    if (paidMonths.includes(m)) return;
    setSelectedMonths(prev =>
        prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
    );
  };

  useEffect(() => {
    fetchInitialData();
    fetchPaymentStatus();
  }, []);

  const fetchInitialData = async () => {
    try {
        const res = await api.get('/student-payments/initial-data');
        if (res.data.success) {
            setInitialData(res.data.data);
        }
    } catch (err) {
        console.error('Error fetching initial data:', err);
    }
  };

  const fetchPaymentStatus = async () => {
    setLoading(true);
    try {
        const res = await api.get('/student-payments/status');
        if (res.data.success) {
            setPaymentStatus(res.data.data);
        }
    } catch (err) {
        console.error('Error fetching payment status:', err);
    } finally {
        setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInitialData(), fetchPaymentStatus()]);
    setRefreshing(false);
  };

  const handleDocumentPick = async (setter: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Error', 'File size exceeds 10MB');
          return;
        }
        setter(file);
      }
    } catch (error) {
      console.error('Document picking error', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const createFormDataFile = (fileObj: any) => {
    return {
      uri: Platform.OS === 'android' ? fileObj.uri : fileObj.uri.replace('file://', ''),
      name: fileObj.name || 'document.pdf',
      type: fileObj.mimeType || 'application/pdf',
    } as any;
  };

  const submitRefundable = async () => {
    if (!refundableAmount || !refundableFile) {
        Alert.alert('Error', 'Please fill all fields and upload payment proof');
        return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('amount', refundableAmount);
    formData.append('document', createFormDataFile(refundableFile));
    formData.append('paymentType', 'Refundable');

    if (initialData) {
        Object.keys(initialData).forEach(key => {
            formData.append(key, initialData[key]);
        });
    }

    try {
        const res = await api.post('/student-payments/refundable', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
            Alert.alert('Success', 'Refundable payment submitted successfully!');
            setPaymentStatus(res.data.data);
            setRefundableAmount('');
            setRefundableFile(null);
        } else {
            Alert.alert('Error', res.data.msg || 'Submission failed');
        }
    } catch (err: any) {
        Alert.alert('Error', err.response?.data?.msg || 'Error submitting payment');
    } finally {
        setSubmitting(false);
    }
  };

  const submitMonthly = async () => {
    if (selectedMonths.length === 0 || !monthlyAmount || !monthlyFile) {
        Alert.alert('Error', 'Please select months, enter amount and upload payment proof');
        return;
    }

    setSubmitting(true);
    const formData = new FormData();
    const now = new Date();
    formData.append('year', now.getFullYear().toString());
    formData.append('amount', monthlyAmount);
    formData.append('document', createFormDataFile(monthlyFile));
    formData.append('months', JSON.stringify(selectedMonths));
    formData.append('monthCount', selectedMonths.length.toString());

    try {
        const res = await api.post('/student-payments/monthly', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
            Alert.alert('Success', 'Monthly payment submitted successfully!');
            setPaymentStatus(res.data.data);
            setMonthlyAmount('');
            setMonthlyFile(null);
            setSelectedMonths([]);
        } else {
            Alert.alert('Error', res.data.msg || 'Submission failed');
        }
    } catch (err: any) {
        Alert.alert('Error', err.response?.data?.msg || 'Error submitting payment');
    } finally {
        setSubmitting(false);
    }
  };

  const handleEditClick = (submission: any) => {
    setEditingSubmission(submission);
    setEditAmount(submission.amount?.toString() || '');
    setEditFile(null);
    setShowEditModal(true);
  };

  const submitMonthlyUpdate = async () => {
    if (!editAmount) {
        Alert.alert('Error', 'Please enter amount');
        return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('amount', editAmount);
    if (editFile) {
        formData.append('document', createFormDataFile(editFile));
    }

    try {
        const res = await api.put(`/student-payments/monthly/${editingSubmission.submissionId || editingSubmission._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
            Alert.alert('Success', 'Payment updated successfully!');
            setPaymentStatus(res.data.data);
            setShowEditModal(false);
            setEditingSubmission(null);
            setEditAmount('');
            setEditFile(null);
        } else {
            Alert.alert('Error', res.data.msg || 'Update failed');
        }
    } catch (err: any) {
        Alert.alert('Error', err.response?.data?.msg || 'Error updating payment');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
      return (
          <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
          </View>
      );
  }

  if (!initialData) {
      return (
          <View style={styles.lockedContainer}>
              <View style={styles.lockedCard}>
                 <View style={styles.lockedIconBox}>
                    <AlertTriangle size={36} color="#ef4444" />
                 </View>
                 <Text style={styles.lockedTitle}>Portal Locked</Text>
                 <Text style={styles.lockedText}>
                    Please submit your <Text style={{fontWeight: '900'}}>Hostel Application Form</Text> first to unlock the payment portal.
                 </Text>
              </View>
          </View>
      );
  }

  const isRefundableSubmitted = paymentStatus?.refundPayment?.documentUrl && 
        (paymentStatus.refund_status !== 'Rejected' && paymentStatus?.refundPayment?.paymentStatus !== 'Rejected');

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Colors.roles.student}
        />
      }
    >
       {/* ── Student Information ── */}
       <View style={styles.card}>
          <View style={styles.cardHeader}>
             <View style={[styles.iconBox, {backgroundColor: '#e0e7ff'}]}>
                <User size={20} color="#4f46e5" />
             </View>
             <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
             <InfoBox label="Student Name" value={initialData?.studentName || user?.name} />
             <InfoBox label="Email Address" value={initialData?.email || user?.email} />
             <InfoBox label="Roll Number" value={initialData?.rollNumber || 'N/A'} />
             <InfoBox label="Wing" value={initialData?.wing || 'N/A'} />
             <InfoBox label="Room Type" value={initialData?.roomType || 'N/A'} />
          </View>
       </View>

       {/* ── Refundable Payment Section ── */}
       <View style={[styles.card, isRefundableSubmitted && styles.cardOpaque]}>
          <View style={styles.cardHeader}>
             <View style={[styles.iconBox, {backgroundColor: '#d1fae5'}]}>
                <DollarSign size={20} color="#10b981" />
             </View>
             <Text style={styles.cardTitle}>Refundable Payment</Text>
          </View>

          {isRefundableSubmitted ? (
              <View style={styles.successBox}>
                 <CheckCircle size={48} color="#10b981" style={{alignSelf: 'center'}} />
                 <Text style={styles.successTitle}>Payment Completed</Text>
                 <Text style={styles.successSub}>Your refundable payment has been successfully recorded.</Text>
                 
                 <View style={styles.successStats}>
                    <Text style={styles.statLabel}>AMOUNT PAID</Text>
                    <Text style={styles.statValue}>LKR {paymentStatus?.refundPayment?.amount?.toLocaleString()}</Text>
                 </View>

                 <View style={styles.statusBadgeWrapper}>
                    <Text style={styles.statLabel}>REFUND STATUS</Text>
                    <View style={[
                        styles.statusBadge, 
                        paymentStatus.refund_status === 'Accepted' ? styles.badgeAccepted :
                        paymentStatus.refund_status === 'Rejected' ? styles.badgeRejected : styles.badgePending
                    ]}>
                        <Text style={[
                            styles.statusText,
                            paymentStatus.refund_status === 'Accepted' ? styles.badgeTextAccepted :
                            paymentStatus.refund_status === 'Rejected' ? styles.badgeTextRejected : styles.badgeTextPending
                        ]}>{paymentStatus.refund_status || 'Pending'}</Text>
                    </View>
                 </View>
              </View>
          ) : (
             <View style={styles.formSpace}>
                {(paymentStatus?.refund_status === 'Rejected' || paymentStatus?.refundPayment?.paymentStatus === 'Rejected') && (
                   <View style={styles.errorBox}>
                      <AlertTriangle size={20} color="#ef4444" />
                      <Text style={styles.errorText}>Your previous submission was REJECTED. Please correct the amount or payment proof and re-submit for review.</Text>
                   </View>
                )}

                <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>PAYMENT AMOUNT (LKR)</Text>
                   <TextInput 
                      style={styles.textInput}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={refundableAmount}
                      onChangeText={setRefundableAmount}
                      placeholderTextColor="#94a3b8"
                   />
                </View>

                <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>PAYMENT PROOF (PDF, PNG, JPG)</Text>
                   <TouchableOpacity 
                      style={[styles.uploadBox, refundableFile && styles.uploadBoxActive]}
                      onPress={() => handleDocumentPick(setRefundableFile)}
                   >
                      {refundableFile ? (
                         <View style={{alignItems: 'center'}}>
                            <FileText size={32} color="#10b981" />
                            <Text style={styles.fileName}>{refundableFile.name}</Text>
                            <TouchableOpacity style={styles.removeFileBtn} onPress={(e) => { e.stopPropagation(); setRefundableFile(null); }}>
                               <Text style={styles.removeFileText}>Remove</Text>
                            </TouchableOpacity>
                         </View>
                      ) : (
                         <View style={{alignItems: 'center'}}>
                            <UploadCloud size={32} color="#94a3b8" />
                            <Text style={styles.uploadBoxText}>Select payment slip or screenshot</Text>
                            <Text style={styles.uploadBoxSub}>Max size: 10MB</Text>
                         </View>
                      )}
                   </TouchableOpacity>
                </View>

                <TouchableOpacity 
                   style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
                   disabled={submitting}
                   onPress={submitRefundable}
                >
                   {submitting ? (
                      <ActivityIndicator color="#fff" />
                   ) : (
                      <Text style={styles.submitBtnText}>Submit Refundable Payment</Text>
                   )}
                </TouchableOpacity>
             </View>
          )}
       </View>

       {/* ── Monthly Payment Section ── */}
       <View style={[styles.card, !isRefundableSubmitted && styles.cardOpaque]}>
          <View style={styles.cardHeader}>
             <View style={[styles.iconBox, {backgroundColor: '#fef3c7'}]}>
                <Calendar size={20} color="#f59e0b" />
             </View>
             <Text style={styles.cardTitle}>Monthly Payment</Text>
          </View>

          {!isRefundableSubmitted ? (
             <View style={styles.lockedSectionBox}>
                <Clock size={40} color="#cbd5e1" />
                <Text style={styles.lockedSectionText}>Complete your refundable payment first to unlock monthly payments.</Text>
             </View>
          ) : (
             <View style={styles.formSpace}>
                <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>SELECT MONTHS</Text>
                   <View style={styles.monthGrid}>
                      {visibleMonths.map(m => {
                         const isPaid = paidMonths.includes(m);
                         const isSelected = selectedMonths.includes(m);
                         return (
                            <TouchableOpacity
                               key={m}
                               disabled={isPaid}
                               onPress={() => toggleMonth(m)}
                               style={[
                                  styles.monthBtn,
                                  isPaid && styles.monthPaid,
                                  (!isPaid && isSelected) && styles.monthSelected,
                               ]}
                            >
                               <Text style={[
                                  styles.monthText,
                                  isPaid && styles.monthTextPaid,
                                  (!isPaid && isSelected) && styles.monthTextSelected,
                               ]}>
                                  {m.substring(0, 3)}
                               </Text>
                            </TouchableOpacity>
                         )
                      })}
                   </View>
                   {selectedMonths.length > 0 && (
                      <View style={styles.selectedPeriodBox}>
                         <View>
                            <Text style={styles.statLabel}>SELECTED PERIOD</Text>
                            <Text style={styles.selectedPeriodText}>{selectedMonths.join(', ')}</Text>
                         </View>
                         <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.statLabel}>COUNT</Text>
                            <Text style={styles.selectedPeriodCount}>{selectedMonths.length}</Text>
                         </View>
                      </View>
                   )}
                </View>

                <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>TOTAL FEE (LKR)</Text>
                   <TextInput 
                      style={styles.textInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={monthlyAmount}
                      onChangeText={setMonthlyAmount}
                      placeholderTextColor="#94a3b8"
                   />
                </View>

                <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>PAYMENT PROOF (MONTHLY_PAYMENT)</Text>
                   <TouchableOpacity 
                      style={[styles.uploadBox, monthlyFile && styles.uploadBoxActive]}
                      onPress={() => handleDocumentPick(setMonthlyFile)}
                   >
                      {monthlyFile ? (
                         <View style={{alignItems: 'center'}}>
                            <FileText size={32} color="#10b981" />
                            <Text style={styles.fileName}>{monthlyFile.name}</Text>
                            <TouchableOpacity style={styles.removeFileBtn} onPress={(e) => { e.stopPropagation(); setMonthlyFile(null); }}>
                               <Text style={styles.removeFileText}>Remove</Text>
                            </TouchableOpacity>
                         </View>
                      ) : (
                         <View style={{alignItems: 'center'}}>
                            <UploadCloud size={32} color="#94a3b8" />
                            <Text style={styles.uploadBoxText}>Upload slip for {selectedMonths.length > 0 ? selectedMonths.length : 'selected'} month{selectedMonths.length !== 1 ? 's' : ''}</Text>
                            <Text style={styles.uploadBoxSub}>Max size: 10MB</Text>
                         </View>
                      )}
                   </TouchableOpacity>
                </View>

                <TouchableOpacity 
                   style={[styles.submitBtn, {backgroundColor: '#0f172a'}, submitting && styles.submitBtnDisabled]} 
                   disabled={submitting}
                   onPress={submitMonthly}
                >
                   {submitting ? (
                      <ActivityIndicator color="#fff" />
                   ) : (
                      <Text style={styles.submitBtnText}>Submit Monthly Payment</Text>
                   )}
                </TouchableOpacity>
             </View>
          )}
       </View>

       {/* ── Payment History ── */}
       {paymentStatus?.submittedMonths?.length > 0 && (
          <View style={styles.card}>
             <View style={styles.cardHeader}>
                <View style={[styles.iconBox, {backgroundColor: '#e0e7ff'}]}>
                   <Clock size={20} color="#4f46e5" />
                </View>
                <Text style={styles.cardTitle}>Monthly Submission History</Text>
             </View>

             <View style={{marginTop: 10}}>
                {paymentStatus.submittedMonths.map((m: any, idx: number) => (
                   <View key={idx} style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                         <View style={styles.historyBadge}>
                            <Text style={styles.historyBadgeText}>{idx + 1}</Text>
                         </View>
                         <Text style={styles.historyPeriod}>{m.months?.join(', ') || m.month} {m.year}</Text>
                      </View>
                      
                      <View style={styles.historyInfoRow}>
                         <Text style={styles.historyLabel}>Amount Paid</Text>
                         <Text style={styles.historyValue}>LKR {m.amount?.toLocaleString()}</Text>
                      </View>
                      
                      <View style={styles.historyInfoRow}>
                         <Text style={styles.historyLabel}>Status</Text>
                         <View style={[
                             styles.statusBadge, 
                             m.status === 'Accepted' ? styles.badgeAccepted :
                             m.status === 'Rejected' ? styles.badgeRejected : styles.badgePending
                         ]}>
                             <Text style={[
                                 styles.statusText,
                                 m.status === 'Accepted' ? styles.badgeTextAccepted :
                                 m.status === 'Rejected' ? styles.badgeTextRejected : styles.badgeTextPending
                             ]}>{m.status || 'Pending'}</Text>
                         </View>
                      </View>

                      <View style={styles.historyActions}>
                         {m.status === 'Rejected' && (
                             <TouchableOpacity 
                                style={[styles.actionBtn, {backgroundColor: '#f59e0b'}]}
                                onPress={() => handleEditClick({ ...m, submissionId: m._id })}
                             >
                                <Edit size={14} color="#fff" style={{marginRight: 4}} />
                                <Text style={styles.actionBtnText}>Update</Text>
                             </TouchableOpacity>
                         )}
                         {m.documentUrl && (
                             <TouchableOpacity 
                                style={[styles.actionBtn, {backgroundColor: '#334155'}]}
                                onPress={() => Linking.openURL(m.documentUrl)}
                             >
                                <Eye size={14} color="#fff" style={{marginRight: 4}} />
                                <Text style={styles.actionBtnText}>View Receipt</Text>
                             </TouchableOpacity>
                         )}
                      </View>
                   </View>
                ))}
             </View>
          </View>
       )}

       {/* Edit Modal */}
       <Modal visible={showEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                   <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={[styles.iconBox, {backgroundColor: '#fef3c7', marginRight: 12}]}>
                         <Edit size={20} color="#f59e0b" />
                      </View>
                      <View>
                         <Text style={styles.modalTitle}>Edit Submission</Text>
                         <Text style={styles.modalSub}>Update rejected payment</Text>
                      </View>
                   </View>
                   <TouchableOpacity onPress={() => setShowEditModal(false)}>
                      <X size={24} color="#94a3b8" />
                   </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>UPDATE AMOUNT (LKR)</Text>
                      <TextInput 
                         style={styles.textInput}
                         keyboardType="numeric"
                         value={editAmount}
                         onChangeText={setEditAmount}
                         placeholderTextColor="#94a3b8"
                      />
                   </View>

                   <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>NEW PROOF (OPTIONAL)</Text>
                      <TouchableOpacity 
                         style={[styles.uploadBox, editFile && styles.uploadBoxActive, {padding: 16}]}
                         onPress={() => handleDocumentPick(setEditFile)}
                      >
                         {editFile ? (
                            <View style={{alignItems: 'center'}}>
                               <Text style={styles.fileName}>{editFile.name}</Text>
                            </View>
                         ) : (
                            <Text style={styles.uploadBoxText}>Upload new slip</Text>
                         )}
                      </TouchableOpacity>
                   </View>

                   <View style={{flexDirection: 'row', gap: 12, marginTop: 10}}>
                      <TouchableOpacity 
                         style={[styles.submitBtn, {flex: 1, backgroundColor: '#f1f5f9'}]} 
                         onPress={() => setShowEditModal(false)}
                      >
                         <Text style={[styles.submitBtnText, {color: '#64748b'}]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                         style={[styles.submitBtn, {flex: 2}]} 
                         onPress={submitMonthlyUpdate}
                         disabled={submitting}
                      >
                         {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
                      </TouchableOpacity>
                   </View>
                </View>
             </View>
          </View>
       </Modal>
    </ScrollView>
  );
}

const InfoBox = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoBox}>
     <Text style={styles.infoLabel}>{label}</Text>
     <Text style={styles.infoValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background || '#f8fafc' },
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  lockedCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10 },
  lockedIconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transform: [{rotate: '12deg'}] },
  lockedTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  lockedText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },

  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardOpaque: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { padding: 8, borderRadius: 12, marginRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },

  infoGrid: { gap: 12 },
  infoBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  infoLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '800', color: '#334155' },

  successBox: { backgroundColor: '#ecfdf5', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#d1fae5', alignItems: 'center' },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#065f46', marginTop: 16, marginBottom: 4 },
  successSub: { fontSize: 13, color: '#047857', textAlign: 'center', fontWeight: '500', marginBottom: 20 },
  successStats: { alignItems: 'center', marginBottom: 16 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#059669', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#064e3b' },
  statusBadgeWrapper: { width: '100%', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(16, 185, 129, 0.2)' },
  
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 2 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeAccepted: { backgroundColor: '#10b981', borderColor: '#34d399' },
  badgeTextAccepted: { color: '#fff' },
  badgeRejected: { backgroundColor: '#ef4444', borderColor: '#f87171' },
  badgeTextRejected: { color: '#fff' },
  badgePending: { backgroundColor: '#fbbf24', borderColor: '#fcd34d' },
  badgeTextPending: { color: '#78350f' },

  formSpace: { gap: 20 },
  errorBox: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2', flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#dc2626' },

  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '800', color: '#334155' },
  
  uploadBox: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 24, padding: 32, alignItems: 'center', backgroundColor: '#fff' },
  uploadBoxActive: { borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' },
  uploadBoxText: { fontSize: 14, fontWeight: '800', color: '#64748b', marginTop: 12, textAlign: 'center' },
  uploadBoxSub: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  fileName: { fontSize: 14, fontWeight: '800', color: '#047857', marginTop: 12, textAlign: 'center' },
  removeFileBtn: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: '#fee2e2', borderRadius: 10 },
  removeFileText: { fontSize: 12, fontWeight: '800', color: '#ef4444' },

  submitBtn: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },

  lockedSectionBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  lockedSectionText: { fontSize: 13, fontWeight: '700', color: '#64748b', textAlign: 'center', marginTop: 16 },

  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', minWidth: '22%', alignItems: 'center' },
  monthText: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  monthPaid: { backgroundColor: '#10b981', borderColor: '#34d399' },
  monthTextPaid: { color: '#fff' },
  monthSelected: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  monthTextSelected: { color: '#d97706' },

  selectedPeriodBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fffbeb', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fef3c7', marginTop: 8 },
  selectedPeriodText: { fontSize: 13, fontWeight: '800', color: '#78350f', marginTop: 4 },
  selectedPeriodCount: { fontSize: 18, fontWeight: '900', color: '#78350f', marginTop: 2 },

  historyCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  historyBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  historyPeriod: { fontSize: 15, fontWeight: '800', color: '#334155' },
  historyInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyLabel: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  historyValue: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  historyActions: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  actionBtn: { flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { fontSize: 11, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden' },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  modalSub: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalBody: { padding: 24, gap: 16 }
});
