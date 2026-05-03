import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Image, Linking } from 'react-native';
import Colors from '../../constants/Colors';
import { Search, Filter, CheckCircle, XCircle, CreditCard, UserMinus, History, X, Info, Phone, Mail, MapPin, GraduationCap, ChevronRight } from 'lucide-react-native';
import api from '../../services/api';
import WardenPayment from './payment';
import Clearance from './Clearance';
import LeftStudents from './LeftStudents';

const TABS = [
  { id: 'warden', label: 'Activation' },
  { id: 'payments', label: 'Payments' },
  { id: 'clearance', label: 'Clearance' },
  { id: 'left', label: 'Left' },
];

export default function WardenProfiles() {
  const [activeTab, setActiveTab] = useState('warden');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'warden': endpoint = '/applications?status=Room Allocated'; break;
        case 'payments': endpoint = '/student-payments/monthly-submissions'; break;
        case 'clearance': endpoint = '/clearance'; break;
        case 'left': endpoint = '/leave/left-students'; break;
        default: endpoint = '/applications';
      }

      const response = await api.get(endpoint);
      let data = response.data;
      
      // Adaptation for different endpoint structures
      if (activeTab === 'clearance') data = response.data.data || response.data;
      if (activeTab === 'payments') data = response.data.map((p: any) => ({ ...p, name: p.studentName, status: p.status }));
      
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeTab !== 'payments' && activeTab !== 'clearance' && activeTab !== 'left') {
      fetchData();
    }
  }, [fetchData, activeTab]);



  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      if (activeTab === 'warden') {
        await api.put(`/applications/${studentId}`, { applicationStatus: newStatus });
      } else if (activeTab === 'payments') {
        const submission = students.find(s => s._id === studentId);
        await api.patch(`/student-payments/monthly-submissions/${submission.studentId}/${submission._id}`, { status: newStatus });
      }
      
      Alert.alert('Success', `Status updated successfully`);
      setSelectedStudent(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'approved':
      case 'room allocated':
      case 'accepted': return '#10B981';
      case 'rejected':
      case 'deactivated': return '#EF4444';
      default: return Colors.accent;
    }
  }

  const openStudentDetails = (student: any) => {
    setSelectedStudent(student);
  };



  const renderStudentItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => openStudentDetails(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || item.name || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName || item.name}</Text>
          <Text style={styles.studentId}>{item.studentRollNumber || item.rollNumber || item.studentId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.applicationStatus || item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.applicationStatus || item.status) }]}>
            {item.applicationStatus || item.status || 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.cardDetailRow}>
          <GraduationCap size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>{item.studentDegree || item.degree || 'N/A'} • {item.studentYear || item.year || 'N/A'} Year</Text>
        </View>
        <View style={[styles.cardDetailRow, { marginTop: 4 }]}>
          <Mail size={14} color={Colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>{item.studentEmail || item.email}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Tap to manage</Text>
        <ChevronRight size={16} color={Colors.roles.warden} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Student Profiles</Text>
          <Text style={styles.sectionSub}>Manage Records & Approvals</Text>
        </View>
      </View>

      <View style={[styles.subHeaderRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View style={styles.subTabGroup}>
            {TABS.map(tab => (
              <TouchableOpacity 
                key={tab.id} 
                style={[styles.miniTab, activeTab === tab.id && styles.miniTabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.miniTabText, activeTab === tab.id && styles.miniTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {activeTab === 'payments' ? (
        <WardenPayment />
      ) : activeTab === 'clearance' ? (
        <Clearance />
      ) : activeTab === 'left' ? (
        <LeftStudents />
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={Colors.textMuted} />
              <TextInput 
                style={styles.searchInput} 
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
          <FlatList 
            data={students.filter(s => 
              (s.studentName || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
              (s.studentRollNumber || s.rollNumber || '').toLowerCase().includes(search.toLowerCase())
            )}
            renderItem={renderStudentItem}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Info size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No records found</Text>
              </View>
            }
          />
        </>
      )}

      {/* Student Detail Modal */}
      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Profile</Text>
              <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{(selectedStudent?.studentName || selectedStudent?.name || '?').charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{selectedStudent?.studentName || selectedStudent?.name}</Text>
                <View style={styles.profileIdRow}>
                  <Text style={styles.profileId}>{selectedStudent?.studentRollNumber || selectedStudent?.rollNumber}</Text>
                  <View style={[styles.statusMiniBadge, { backgroundColor: getStatusColor(selectedStudent?.applicationStatus || selectedStudent?.status) + '20' }]}>
                    <Text style={[styles.statusMiniText, { color: getStatusColor(selectedStudent?.applicationStatus || selectedStudent?.status) }]}>
                      {selectedStudent?.applicationStatus || selectedStudent?.status || 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalBodyWrapper}>
                {/* Academic Info */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Academic Information</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Faculty</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.faculty || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Year</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.studentYear || selectedStudent?.year || 'N/A'}</Text>
                      </View>
                    </View>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Degree Program</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.studentDegree || selectedStudent?.degree || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Registration Number</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.registrationNumber || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Personal Info */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Contact Number</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.contactNumber || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>NIC / ID Number</Text>
                        <Text style={styles.infoValue}>{selectedStudent?.nic || 'N/A'}</Text>
                      </View>
                    </View>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Email Address</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.studentEmail || selectedStudent?.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Permanent Address</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.permanentAddress || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Emergency Contact</Text>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Guardian Name</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.guardianName || selectedStudent?.emergencyContactName || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItemFull}>
                      <Text style={styles.infoLabel}>Guardian Contact Number</Text>
                      <Text style={styles.infoValue}>{selectedStudent?.guardianContactNumber || selectedStudent?.emergencyContactPhone || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Medical Information */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Medical Information</Text>
                    <View style={styles.medicalStatusRow}>
                       <Text style={styles.infoLabel}>Has Medical Condition?</Text>
                       <View style={[styles.boolBadge, { backgroundColor: selectedStudent?.hasMedicalCondition ? '#EF444420' : '#10B98120' }]}>
                         <Text style={[styles.boolText, { color: selectedStudent?.hasMedicalCondition ? '#EF4444' : '#10B981' }]}>
                           {selectedStudent?.hasMedicalCondition ? 'YES' : 'NO'}
                         </Text>
                       </View>
                    </View>
                    {selectedStudent?.hasMedicalCondition && (
                      <View style={styles.medicalDetails}>
                        <Text style={styles.medicalNote}>{selectedStudent?.medicalConditionDetails || 'No details provided'}</Text>
                      </View>
                    )}
                    {selectedStudent?.medicalReportUrl && (
                      <TouchableOpacity 
                        style={styles.fileLink} 
                        onPress={() => selectedStudent?.medicalReportUrl && Linking.openURL(selectedStudent.medicalReportUrl)}
                      >
                        <Info size={16} color={Colors.roles.warden} />
                        <Text style={styles.fileLinkText}>View Medical Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Payment Slip Preview */}
                  {selectedStudent?.paymentSlipUrl && (
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>Initial Payment Slip</Text>
                      <TouchableOpacity 
                        onPress={() => selectedStudent?.paymentSlipUrl && Linking.openURL(selectedStudent.paymentSlipUrl)}
                        style={styles.slipPreview}
                      >
                        <Image source={{ uri: selectedStudent.paymentSlipUrl }} style={styles.slipImage} />
                        <View style={styles.slipOverlay}>
                           <Search size={24} color="#FFF" />
                           <Text style={styles.slipOverlayText}>Tap to enlarge</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsContainer}>
                {activeTab === 'payments' && (
                  <View style={styles.dualActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]} 
                      onPress={() => handleUpdateStatus(selectedStudent?._id, 'Accepted')}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]} 
                      onPress={() => handleUpdateStatus(selectedStudent?._id, 'Rejected')}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'warden' && (
                  <TouchableOpacity 
                    style={styles.primaryAction} 
                    onPress={() => handleUpdateStatus(selectedStudent?._id, 'Activated')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionText}>Activate Profile</Text>}
                  </TouchableOpacity>
                )}
                
                {/* General Status Controls for other tabs */}
                {(activeTab === 'warden' || (selectedStudent?.applicationStatus === 'Activated')) && (
                  <TouchableOpacity 
                    style={[styles.secondaryAction, { marginTop: 12 }]} 
                    onPress={() => handleUpdateStatus(selectedStudent?._id, 'Rejected')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.secondaryActionText}>Deactivate / Reject Profile</Text>
                  </TouchableOpacity>
                )}
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
  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  sectionSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  subTabGroup: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 12, gap: 4, margin: 16 },
  miniTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniTabActive: { backgroundColor: Colors.roles.warden, elevation: 2, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  miniTabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  miniTabTextActive: { color: '#FFF' },
  searchContainer: { padding: 16, backgroundColor: Colors.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 12, borderRadius: 16, height: 48, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 16, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.roles.warden },
  headerInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardBody: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.background },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  viewDetailsText: { fontSize: 13, color: Colors.roles.warden, fontWeight: '800' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingBottom: 40 },
  modalBodyWrapper: { marginTop: 8 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  largeAvatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  largeAvatarText: { fontSize: 32, fontWeight: '900', color: Colors.roles.warden },
  profileName: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  profileIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  profileId: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  statusMiniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusMiniText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  infoSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoItemFull: { width: '100%', marginTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoText: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  medicalStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  boolText: { fontSize: 10, fontWeight: '900' },
  medicalDetails: { marginTop: 12, padding: 12, backgroundColor: Colors.background, borderRadius: 12 },
  medicalNote: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, fontStyle: 'italic' },
  fileLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, backgroundColor: Colors.roles.warden + '10', borderRadius: 12 },
  fileLinkText: { fontSize: 13, fontWeight: '800', color: Colors.roles.warden },
  slipPreview: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.background },
  slipImage: { width: '100%', height: '100%', objectFit: 'cover' },
  slipOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  slipOverlayText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  modalActionsContainer: { marginTop: 8, marginBottom: 32 },
  primaryAction: { backgroundColor: Colors.roles.warden, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryAction: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '40' },
  secondaryActionText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },
  dualActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  clearanceContainer: { paddingBottom: 20 },
  clearanceSubTabs: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 12, padding: 4, marginBottom: 20 },
  clearanceSubTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeClearanceSubTab: { backgroundColor: Colors.roles.warden },
  clearanceSubTabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  activeClearanceSubTabText: { color: '#FFF' },
  clearanceContent: { marginBottom: 20 },
  gridHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  gridHeaderText: { fontSize: 12, fontWeight: '800', color: Colors.roles.warden, textTransform: 'uppercase' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthCard: { width: '31%', backgroundColor: Colors.surface, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  paidMonthCard: { backgroundColor: '#10B98110', borderColor: '#10B98140' },
  monthCardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  monthName: { fontSize: 10, fontWeight: '900', color: Colors.textMuted },
  monthStatus: { fontSize: 9, fontWeight: '800', marginBottom: 6 },
  adjustmentInput: { width: '100%', height: 32, backgroundColor: Colors.background, borderRadius: 6, fontSize: 11, fontWeight: '700', textAlign: 'center', padding: 0, color: Colors.text },
  addChargeBtn: { backgroundColor: Colors.roles.warden + '10', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.roles.warden + '40' },
  addChargeBtnText: { color: Colors.roles.warden, fontSize: 13, fontWeight: '800' },
  chargeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  chargeInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  chargeNoteInput: { flex: 2, height: 40, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: Colors.text },
  chargeAmountInput: { flex: 1, height: 40, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontWeight: '700', color: Colors.text },
  emptyRecordsText: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', marginVertical: 20 },
  keyReturnSection: { marginBottom: 20 },
  keyStatusToggle: { flexDirection: 'row', gap: 12, marginTop: 8 },
  keyStatusBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  keyStatusBtnActive: { backgroundColor: Colors.roles.warden, borderColor: Colors.roles.warden },
  keyStatusText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  keyStatusTextActive: { color: '#FFF' },
  notesSection: { marginBottom: 24 },
  notesInput: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.text, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  summarySection: { backgroundColor: Colors.roles.warden + '10', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: Colors.roles.warden },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.roles.warden },
});

