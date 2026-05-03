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
import Colors from '../constants/Colors';
import {
  Search,
  Calendar,
  X,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  ChevronRight,
} from 'lucide-react-native';
import api from '../services/api';

/**
 * REFERENCE FILE - Not Used in Active Routes
 * 
 * Original implementation of Left Students feature.
 * Now consolidated into profiles.tsx under "Left students" tab.
 * 
 * This file is kept for documentation and backup purposes.
 */

export default function LeftStudents() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave/left-students');
      let data = response.data;
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
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardDetailRow}>
          <Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            Left: {new Date(item.leftDate).toLocaleDateString()}
          </Text>
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
            (s.studentName || s.name || '').toLowerCase().includes(search.toLowerCase())
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
              <Text style={styles.modalTitle}>Student Details</Text>
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
                  <Calendar size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>
                    Left: {new Date(selectedStudent?.leftDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Phone size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.contactNumber || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Mail size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.studentEmail || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={18} color={Colors.roles.warden} />
                  <Text style={styles.infoText}>{selectedStudent?.permanentAddress || 'Campus Hostel'}</Text>
                </View>
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
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EF4444' + '20' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: '#EF4444' },
  cardBody: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.background },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
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
  profileId: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  infoSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 32 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  infoText: { fontSize: 15, fontWeight: '600', color: Colors.text },
});