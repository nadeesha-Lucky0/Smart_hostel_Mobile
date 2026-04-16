import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Image } from 'react-native';
import Colors from '../../constants/Colors';
import { Search, Filter, CheckCircle, XCircle, CreditCard, UserMinus, History, X, Info, Phone, Mail, MapPin, GraduationCap } from 'lucide-react-native';
import api from '../../services/api';

const TABS = [
  { id: 'warden', label: 'Activation', icon: CheckCircle },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'clearance', label: 'Clearance', icon: UserMinus },
  { id: 'left', label: 'Left', icon: History },
];

export default function WardenProfiles() {
  const [activeTab, setActiveTab] = useState('warden');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      if (activeTab === 'warden') {
        await api.put(`/applications/${studentId}`, { applicationStatus: newStatus });
      } else if (activeTab === 'payments') {
        const submission = students.find(s => s._id === studentId);
        await api.patch(`/student-payments/monthly-submissions/${submission.studentId}/${submission._id}`, { status: newStatus });
      } else if (activeTab === 'clearance') {
        await api.patch(`/clearance/${studentId}/warden`, { wardenStatus: newStatus });
      }
      
      Alert.alert('Success', `Status updated to ${newStatus}`);
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

  const renderStudentItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedStudent(item)}>
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
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} color={activeTab === tab.id ? Colors.roles.warden : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={students.filter(s => 
            (s.studentName || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.studentRollNumber || s.rollNumber || '').toLowerCase().includes(search.toLowerCase())
          )}
          renderItem={renderStudentItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No records found</Text>
            </View>
          }
        />
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

            <ScrollView style={styles.modalBody}>
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{(selectedStudent?.studentName || selectedStudent?.name || '?').charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{selectedStudent?.studentName || selectedStudent?.name}</Text>
                <Text style={styles.profileId}>{selectedStudent?.studentRollNumber || selectedStudent?.rollNumber}</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Phone size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.contactNumber || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Mail size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.studentEmail || selectedStudent?.email || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.permanentAddress || 'Campus Hostel'}</Text>
                </View>
              </View>

              {activeTab === 'warden' && (
                <TouchableOpacity 
                  style={styles.primaryAction} 
                  onPress={() => handleUpdateStatus(selectedStudent._id, 'Activated')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionText}>Activate Student</Text>}
                </TouchableOpacity>
              )}

              {activeTab === 'payments' && (
                <View style={styles.dualActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn]} 
                    onPress={() => handleUpdateStatus(selectedStudent._id, 'Accepted')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtn]} 
                    onPress={() => handleUpdateStatus(selectedStudent._id, 'Rejected')}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'clearance' && (
                <TouchableOpacity 
                  style={styles.primaryAction} 
                  onPress={() => handleUpdateStatus(selectedStudent._id, 'Approved')}
                  disabled={actionLoading}
                >
                   {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionText}>Approve Clearance</Text>}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
  activeTab: { backgroundColor: Colors.roles.warden + '15' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  activeTabLabel: { color: Colors.roles.warden },
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
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  largeAvatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  largeAvatarText: { fontSize: 32, fontWeight: '900', color: Colors.roles.warden },
  profileName: { fontSize: 22, fontWeight: '900', color: Colors.text },
  profileId: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  infoSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 32 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  infoText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  primaryAction: { backgroundColor: Colors.roles.warden, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  primaryActionText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  dualActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

