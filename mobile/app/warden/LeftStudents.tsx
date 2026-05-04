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
  RefreshControl,
} from 'react-native';
import Colors from '../../constants/Colors';
import {
  Search,
  Calendar,
  X,
  Info,
  ChevronRight,
  UserMinus,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react-native';
import api from '../../services/api';

export default function LeftStudents() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await performFetch();
    setLoading(false);
  }, []);

  const performFetch = async () => {
    try {
      const response = await api.get('/leave/left-students');
      let data = response.data;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await performFetch();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteStudent = async (studentId: string) => {
    Alert.alert(
      'Permanent Deletion',
      'Are you sure you want to permanently delete this student record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.delete(`/students/${studentId}`);
              Alert.alert('Success', 'Student record deleted permanently');
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete record');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderStudentItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedStudent(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || item.name || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName || item.name}</Text>
          <Text style={styles.studentId}>{item.studentRollNumber || item.rollNumber}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>LEFT</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => handleDeleteStudent(item.studentId || item._id)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardDetailRow}>
          <Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            Left On: {new Date(item.leftDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.cardDetailRow, { marginTop: 6 }]}>
          <Info size={14} color={Colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={1}>
            Reason: {item.leaveReason || 'End of Academic Year'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View Final Profile</Text>
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
            placeholder="Search by name or roll no..."
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
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.emptyText}>No students found in record</Text>}
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
              <Text style={styles.modalTitle}>Archived Profile</Text>
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
                   <View style={styles.archivedBadge}>
                     <Text style={styles.archivedText}>ARCHIVED</Text>
                   </View>
                </View>
              </View>

              {/* Exit Summary */}
              <View style={[styles.infoSection, { backgroundColor: Colors.roles.warden + '05' }]}>
                <Text style={styles.sectionTitle}>Exit Summary</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date of Departure</Text>
                    <Text style={styles.infoValue}>{new Date(selectedStudent?.leftDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Room Number</Text>
                    <Text style={styles.infoValue}>{selectedStudent?.roomNumber || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.infoItemFull}>
                  <Text style={styles.infoLabel}>Reason for Leaving</Text>
                  <Text style={styles.infoValue}>{selectedStudent?.leaveReason || 'End of Stay / Graduated'}</Text>
                </View>
              </View>

              {/* Academic Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Academic History</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Faculty</Text>
                    <Text style={styles.infoValue}>{selectedStudent?.faculty || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Final Year</Text>
                    <Text style={styles.infoValue}>{selectedStudent?.studentYear || selectedStudent?.year || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.infoItemFull}>
                  <Text style={styles.infoLabel}>Degree Program</Text>
                  <Text style={styles.infoValue}>{selectedStudent?.studentDegree || selectedStudent?.degree || 'N/A'}</Text>
                </View>
              </View>

              {/* Personal Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Contact Archive</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoValue}>{selectedStudent?.contactNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>NIC / ID</Text>
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

              {/* Final Clearance Status */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Final Clearance</Text>
                <View style={styles.clearanceSummary}>
                   <View style={styles.clearanceRow}>
                     <Text style={styles.clearanceLabel}>Warden Review</Text>
                     <View style={styles.statusMiniBadge}>
                        <CheckCircle size={14} color="#10B981" />
                        <Text style={[styles.statusMiniText, { color: '#10B981' }]}>COMPLETED</Text>
                     </View>
                   </View>
                   <View style={styles.clearanceRow}>
                     <Text style={styles.clearanceLabel}>Keys Returned</Text>
                     <Text style={styles.clearanceValue}>Yes</Text>
                   </View>
                </View>
              </View>

              <View style={{ height: 40 }} />
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
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#6B7280' + '20', marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: '#6B7280' },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: '#EF444410' },
  cardBody: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.background },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  viewDetailsText: { fontSize: 13, fontWeight: '700', color: Colors.roles.warden },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '92%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  largeAvatar: { width: 70, height: 70, borderRadius: 24, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  largeAvatarText: { fontSize: 28, fontWeight: '900', color: Colors.roles.warden },
  profileName: { fontSize: 20, fontWeight: '900', color: Colors.text },
  profileIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  profileId: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  archivedBadge: { backgroundColor: '#6B728020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  archivedText: { fontSize: 9, fontWeight: '900', color: '#6B7280' },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: Colors.roles.warden, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  infoSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  infoItem: { flex: 1, minWidth: '45%' },
  infoItemFull: { width: '100%' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  clearanceSummary: { gap: 12 },
  clearanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearanceLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  clearanceValue: { fontSize: 13, fontWeight: '800', color: Colors.text },
  statusMiniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusMiniText: { fontSize: 10, fontWeight: '900' },
});