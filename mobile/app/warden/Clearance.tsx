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
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  ChevronRight,
} from 'lucide-react-native';
import api from '../../services/api';

/**
 * REFERENCE FILE - Not Used in Active Routes
 * 
 * Original implementation of Clearance feature.
 * Now consolidated into profiles.tsx under "Clearance" tab.
 * 
 * This file is kept for documentation and backup purposes.
 */

export default function Clearance() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      if (newStatus === 'Rejected' && !rejectionReason.trim()) {
        Alert.alert('Required', 'Please provide a reason for rejection');
        setActionLoading(false);
        return;
      }

      await api.patch(`/clearance/${studentId}/warden`, {
        wardenStatus: newStatus,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : null,
      });

      Alert.alert('Success', `Clearance ${newStatus === 'Approved' ? 'approved' : 'rejected'} successfully`);
      setSelectedStudent(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return Colors.accent;
    }
  };

  const renderStudentItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedStudent(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
          <Text style={styles.studentId}>{item.studentRollNumber}</Text>
        </View>
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
          data={students.filter(s => 
            (s.studentName || '').toLowerCase().includes(search.toLowerCase())
          )}
          renderItem={renderStudentItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
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
              <Text style={styles.modalTitle}>Manage Clearance</Text>
              <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{(selectedStudent?.studentName || '?').charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{selectedStudent?.studentName}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rejection Reason (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason..."
                  placeholderTextColor={Colors.textMuted}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.dualActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleUpdateStatus(selectedStudent._id, 'Approved')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Approve</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleUpdateStatus(selectedStudent._id, 'Rejected')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Reject</Text>}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  textInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  dualActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});