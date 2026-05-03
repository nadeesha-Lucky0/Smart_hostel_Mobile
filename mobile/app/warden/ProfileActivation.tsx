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
  CheckCircle,
  XCircle,
  Clock,
  X,
  Info,
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
 * Original implementation of Profile Activation feature.
 * Now consolidated into profiles.tsx under "Profile activation" tab.
 * 
 * This file is kept for documentation and backup purposes.
 */

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
];

export default function ProfileActivation() {
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/applications?status=Room Allocated');
      let data = response.data;

      const formatted = data.map((s: any) => ({
        ...s,
        approvalStatus: s.approvalStatus?.toLowerCase() || 'pending',
      }));

      const filtered = formatted.filter((s: any) => s.approvalStatus === activeTab);
      setStudents(Array.isArray(filtered) ? filtered : []);
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Failed to fetch students');
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

      if (newStatus === 'rejected' && !rejectionReason.trim()) {
        Alert.alert('Required', 'Please provide a reason for rejection');
        setActionLoading(false);
        return;
      }

      await api.patch(`/applications/${studentId}/profile-approval`, {
        approvalStatus: newStatus,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : null,
        approvalComments: newStatus === 'approved' ? approvalComments : null,
      });

      Alert.alert('Success', `Profile ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
      setSelectedStudent(null);
      setRejectionReason('');
      setApprovalComments('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update approval status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return Colors.textMuted;
    }
  };

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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeTab) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(activeTab) }]}>
            {activeTab.toUpperCase()}
          </Text>
        </View>
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
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tab: { width: '48.4%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 18, gap: 8 },
  activeTab: { backgroundColor: Colors.roles.warden + '15' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  activeTabLabel: { color: Colors.roles.warden },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.roles.warden },
  headerInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});