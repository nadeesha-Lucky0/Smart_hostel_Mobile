import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { MessageSquare, Clock, CheckCircle, AlertCircle, ChevronRight, X, User, Tag, Calendar, Send } from 'lucide-react-native';
import api from '../../services/api';

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [response, setResponse] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Fetch complaints error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleUpdateStatus = async (status: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/complaints/${selectedComplaint._id}/status`, { status, response });
      Alert.alert('Success', `Complaint marked as ${status}`);
      setSelectedComplaint(null);
      setResponse('');
      fetchComplaints();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const renderComplaintItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedComplaint(item)}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={styles.categoryText}>{item.category || 'General'}</Text>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      
      <Text style={styles.subjectText} numberOfLines={1}>{item.subject}</Text>
      <Text style={styles.studentInfo}>{item.studentName} • {item.studentRollNumber}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
        <View style={styles.actionPrompt}>
          <Text style={styles.actionPromptText}>View & Action</Text>
          <ChevronRight size={16} color={Colors.roles.warden} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#10B981';
      case 'in-progress': return Colors.roles.warden;
      case 'pending': return '#F59E0B';
      default: return Colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    const size = 16;
    switch (status?.toLowerCase()) {
      case 'resolved': return <CheckCircle size={size} color="#10B981" />;
      case 'in-progress': return <Clock size={size} color={Colors.roles.warden} />;
      case 'pending': return <AlertCircle size={size} color="#F59E0B" />;
      default: return <MessageSquare size={size} color={Colors.textMuted} />;
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={complaints}
          renderItem={renderComplaintItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No complaints yet</Text>
            </View>
          }
        />
      )}

      {/* Complaint Detail Modal */}
      <Modal
        visible={!!selectedComplaint}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(selectedComplaint?.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(selectedComplaint?.status) }]}>
                    {selectedComplaint?.status?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detailDate}>{new Date(selectedComplaint?.createdAt).toLocaleString()}</Text>
              </View>

              <Text style={styles.detailSubject}>{selectedComplaint?.subject}</Text>
              
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <User size={18} color={Colors.textMuted} />
                  <Text style={styles.infoValue}>{selectedComplaint?.studentName} ({selectedComplaint?.studentRollNumber})</Text>
                </View>
                <View style={styles.infoRow}>
                  <Tag size={18} color={Colors.textMuted} />
                  <Text style={styles.infoValue}>{selectedComplaint?.category || 'General Complaint'}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Description</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{selectedComplaint?.description}</Text>
              </View>

              <Text style={styles.sectionLabel}>Response to Student</Text>
              <TextInput 
                style={styles.responseInput}
                placeholder="Type your response here..."
                multiline
                numberOfLines={4}
                value={response}
                onChangeText={setResponse}
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.actionGrid}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: Colors.roles.warden, borderWidth: 1 }]} 
                  onPress={() => handleUpdateStatus('in-progress')}
                  disabled={actionLoading}
                >
                  <Clock size={20} color={Colors.roles.warden} />
                  <Text style={[styles.actionBtnText, { color: Colors.roles.warden }]}>In Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]} 
                  onPress={() => handleUpdateStatus('resolved')}
                  disabled={actionLoading}
                >
                  <CheckCircle size={20} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Resolved</Text>
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
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 28, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { flex: 1, fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  timeText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  subjectText: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  studentInfo: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 13, fontWeight: '800' },
  actionPrompt: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionPromptText: { fontSize: 13, fontWeight: '700', color: Colors.roles.warden },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: '92%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBody: { marginBottom: 24 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '900' },
  detailDate: { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  detailSubject: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 24, lineHeight: 28 },
  infoBox: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: Colors.roles.warden },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  descriptionBox: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 24 },
  descriptionText: { fontSize: 15, color: Colors.text, lineHeight: 22, fontWeight: '600' },
  responseInput: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, fontSize: 15, color: Colors.text, textAlignVertical: 'top', height: 120, marginBottom: 24, fontWeight: '600', borderWidth: 1, borderColor: Colors.border },
  actionGrid: { flexDirection: 'row', gap: 12, paddingBottom: 20 },
  actionBtn: { flex: 1, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 2 },
  actionBtnText: { fontSize: 15, fontWeight: '800' }
});

