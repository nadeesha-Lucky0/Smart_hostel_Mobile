import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Modal, TextInput, ScrollView, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { Bell, Megaphone, Calendar, ChevronRight, Plus, X, Send, Type, AlignLeft } from 'lucide-react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function WardenNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error('Fetch notices error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreateNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/notices', newNotice);
      Alert.alert('Success', 'Notice broadcasted successfully!');
      setCreateModalVisible(false);
      setNewNotice({ title: '', content: '' });
      fetchNotices();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create notice');
    } finally {
      setActionLoading(false);
    }
  };

  const renderNoticeItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Megaphone size={20} color={Colors.roles.warden} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.noticeTitle}>{item.title}</Text>
          <View style={styles.dateRow}>
            <Calendar size={12} color={Colors.textMuted} />
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.noticeContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryBox}>
        <View style={styles.sumInfo}>
          <Text style={styles.sumVal}>{notices.length}</Text>
          <Text style={styles.sumLab}>Active Notices</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.createBtnText}>New Notice</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={notices}
          renderItem={renderNoticeItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No notices broadcasted yet</Text>
            </View>
          }
        />
      )}

      {/* Create Notice Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Broadcast Notice</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Notice Title</Text>
              <View style={styles.inputWrapper}>
                <Type size={20} color={Colors.textMuted} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="e.g., Mandatory Meeting"
                  value={newNotice.title}
                  onChangeText={(text) => setNewNotice(prev => ({ ...prev, title: text }))}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <Text style={styles.inputLabel}>Content</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 16 }]}>
                <AlignLeft size={20} color={Colors.textMuted} />
                <TextInput 
                  style={[styles.textInput, { height: 150, textAlignVertical: 'top' }]}
                  placeholder="Type the announcement details here..."
                  multiline
                  value={newNotice.content}
                  onChangeText={(text) => setNewNotice(prev => ({ ...prev, content: text }))}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity 
                style={[styles.summitBtn, actionLoading && { opacity: 0.7 }]}
                onPress={handleCreateNotice}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFF" />
                    <Text style={styles.summitBtnText}>Broadcast Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryBox: { flexDirection: 'row', padding: 24, alignItems: 'center', backgroundColor: Colors.surface, margin: 16, borderRadius: 28, elevation: 2, gap: 16 },
  sumInfo: { flex: 1 },
  sumVal: { fontSize: 28, fontWeight: '900', color: Colors.text },
  sumLab: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.roles.warden, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 18, gap: 8, elevation: 4 },
  createBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 28, padding: 24, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  noticeTitle: { fontSize: 17, fontWeight: '900', color: Colors.text },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  noticeContent: { fontSize: 14, color: Colors.text, lineHeight: 22, fontWeight: '500' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalBody: { marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  textInput: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: Colors.text, fontWeight: '600' },
  summitBtn: { height: 64, backgroundColor: Colors.roles.warden, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4, marginTop: 12 },
  summitBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' }
});

