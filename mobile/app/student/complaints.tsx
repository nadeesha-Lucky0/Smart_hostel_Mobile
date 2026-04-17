import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react-native';
import api from '../../services/api';

export default function StudentComplaints() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newComplaint, setNewComplaint] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints/my');
      setComplaints(res.data);
    } catch (err) {
      console.error('Fetch student complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComplaint.title.trim() || !newComplaint.description.trim()) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    try {
      setSubmitting(true);
      await api.post('/complaints', newComplaint);
      Alert.alert('Success', 'Complaint submitted successfully');
      setModalVisible(false);
      setNewComplaint({ title: '', description: '' });
      fetchComplaints();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return { color: '#10B981', icon: CheckCircle };
      case 'in progress': return { color: Colors.accent, icon: Clock };
      default: return { color: Colors.textMuted, icon: AlertCircle };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Grievance Portal</Text>
          <Text style={styles.subtitle}>Report issues or suggest improvements for your hostel</Text>
        </View>

        <View style={styles.list}>
          {loading ? (
             <ActivityIndicator size="large" color={Colors.roles.student} style={{ marginTop: 40 }} />
          ) : complaints.length > 0 ? (
             complaints.map((item, index) => {
               const status = getStatusIcon(item.status);
               return (
                  <View key={item._id || index} style={styles.complaintCard}>
                     <View style={styles.complaintHeader}>
                        <Text style={styles.complaintTitle}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                           <status.icon size={12} color={status.color} />
                           <Text style={[styles.statusText, { color: status.color }]}>{item.status || 'Pending'}</Text>
                        </View>
                     </View>
                     <Text style={styles.complaintDesc} numberOfLines={2}>{item.description}</Text>
                     <View style={styles.complaintFooter}>
                        <Text style={styles.complaintTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        <TouchableOpacity style={styles.viewDetailBtn}>
                           <Text style={styles.viewDetailText}>View Chat</Text>
                        </TouchableOpacity>
                     </View>
                  </View>
               );
             })
          ) : (
            <View style={styles.emptyContainer}>
               <MessageSquare size={48} color={Colors.border} />
               <Text style={styles.emptyText}>No grievances recorded</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
         <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Complaint</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
               <Text style={styles.label}>Title</Text>
               <TextInput 
                  style={styles.input} 
                  value={newComplaint.title}
                  onChangeText={(t) => setNewComplaint(prev => ({ ...prev, title: t }))}
                  placeholder="Subject of your complaint"
               />

               <Text style={[styles.label, { marginTop: 24 }]}>Description</Text>
               <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={newComplaint.description}
                  onChangeText={(t) => setNewComplaint(prev => ({ ...prev, description: t }))}
                  placeholder="Describe the issue in detail..."
                  multiline={true}
                  numberOfLines={4}
               />

               <TouchableOpacity 
                  style={[styles.submitBtn, submitting && styles.disabledBtn]} 
                  onPress={handleSubmit}
                  disabled={submitting}
               >
                  {submitting ? <ActivityIndicator color="#FFF" /> : (
                     <>
                        <Send size={20} color="#FFF" />
                        <Text style={styles.submitText}>Submit Grievance</Text>
                     </>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  list: { padding: 24 },
  complaintCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1 },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  complaintTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1, marginRight: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  complaintDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginBottom: 16 },
  complaintFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.background },
  complaintTime: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  viewDetailBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.roles.student + '10', borderRadius: 8 },
  viewDetailText: { fontSize: 11, fontWeight: '800', color: Colors.roles.student },
  fab: { position: 'absolute', bottom: 32, right: 32, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.roles.student, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: Colors.roles.student, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  form: {},
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.background, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, fontSize: 15, fontWeight: '600' },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.roles.student, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, marginTop: 40, gap: 12 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
});
