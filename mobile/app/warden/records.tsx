import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import { Database, FileText, Filter, Search, Pencil, Trash2, X, ChevronRight, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function HostelRecords() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/allocations');
      setRecords(res.data);
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  const handleDeleteAllocation = (id: string, studentName: string) => {
    Alert.alert(
      'Delete Allocation',
      `Are you sure you want to delete the record for ${studentName}? This will free up the assigned bed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/allocations/${id}`);
              Alert.alert('Success', 'Record deleted successfully');
              fetchRecords();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete record');
            }
          } 
        }
      ]
    );
  };

  const openEditModal = async (allocation: any) => {
    setEditingAllocation(allocation);
    setSelectedBedId(allocation.bedId);
    setIsEditModalOpen(true);
    
    try {
      const res = await api.get(`/floors?wing=${allocation.wing}`);
      const activeFloors = res.data.filter((f: any) => f.isactive);
      setFloors(activeFloors);
      
      const currentFloor = activeFloors.find((f: any) => f.floorNumber === allocation.floorNumber);
      if (currentFloor) {
        setSelectedFloorId(currentFloor._id);
        fetchRooms(currentFloor._id, allocation.roomnumber);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load floor data');
    }
  };

  const fetchRooms = async (floorId: string, currentRoomNumber?: number) => {
    try {
      const res = await api.get(`/rooms?floor=${floorId}`);
      setRooms(res.data);
      if (currentRoomNumber) {
        const currentRoom = res.data.find((r: any) => r.roomnumber === currentRoomNumber);
        if (currentRoom) setSelectedRoomId(currentRoom._id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load rooms');
    }
  };

  const handleUpdateAllocation = async () => {
    if (!selectedRoomId || !selectedBedId) {
      return Alert.alert('Error', 'Please select both room and bed');
    }
    
    setUpdating(true);
    try {
      await api.put(`/allocations/${editingAllocation._id}`, {
        roomId: selectedRoomId,
        bedId: selectedBedId
      });
      Alert.alert('Success', 'Allocation updated successfully');
      setIsEditModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update allocation');
    } finally {
      setUpdating(false);
    }
  };

  const renderRecordItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: Colors.roles.warden + '15' }]}>
          <FileText size={22} color={Colors.roles.warden} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.recordTitle}>{item.studentName || 'Unknown Student'}</Text>
          <Text style={styles.recordSub}>{item.studentRollNumber || 'No ID'}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Pencil size={18} color={Colors.roles.warden} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteAllocation(item._id, item.studentName)}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.detailsGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>LOCATION</Text>
          <Text style={styles.detailValue}>
            {item.wing === 'female' ? 'F' : 'M'}{item.roomnumber} · Bed {item.bedId}
          </Text>
          <Text style={styles.detailSubLabel}>Floor {item.floorNumber}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>ROOM TYPE</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item.roomType || 'Standard'}</Text>
          <Text style={styles.detailSubLabel}>Allocated</Text>
        </View>
      </View>
      
      <View style={styles.footerRow}>
        <Text style={styles.dateLabel}>Allocated on: {item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString() : 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Hostel Records</Text>
          <Text style={styles.sectionSub}>Allocation History & Inventory</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{records.length}</Text>
          <Text style={styles.statLab}>Active Records</Text>
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Filter size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Search size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Database size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No historical records found</Text>
            </View>
          }
        />
      )}

      {/* Reassignment Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Allocation</Text>
                <Text style={styles.modalSub}>{editingAllocation?.studentName}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Target Floor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {floors.map(f => (
                  <TouchableOpacity 
                    key={f._id} 
                    style={[styles.selectorItem, selectedFloorId === f._id && styles.activeSelectorItem]}
                    onPress={() => {
                      setSelectedFloorId(f._id);
                      setSelectedRoomId('');
                      setSelectedBedId('');
                      fetchRooms(f._id);
                    }}
                  >
                    <Text style={[styles.selectorText, selectedFloorId === f._id && styles.activeSelectorText]}>Floor {f.floorNumber}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionTitle}>Target Room</Text>
              <View style={styles.roomsGrid}>
                {rooms.map(r => {
                  const isAvailable = r.beds.some((b: any) => !b.isOccupied || b.student === editingAllocation?.studentId);
                  return (
                    <TouchableOpacity 
                      key={r._id} 
                      style={[styles.roomSelectorItem, selectedRoomId === r._id && styles.activeRoomSelectorItem]}
                      onPress={() => {
                        setSelectedRoomId(r._id);
                        setSelectedBedId('');
                      }}
                    >
                      <View style={[styles.roomStatusDot, { backgroundColor: isAvailable ? '#10B981' : '#EF4444' }]} />
                      <Text style={[styles.roomSelectorText, selectedRoomId === r._id && styles.activeRoomSelectorText]}>Room {r.roomnumber}</Text>
                      <Text style={styles.roomTypeText}>{r.type}</Text>
                      {selectedRoomId === r._id && <View style={styles.checkIcon}><Check size={12} color="#FFF" /></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedRoomId && (
                <>
                  <Text style={styles.sectionTitle}>Select Available Bed</Text>
                  <View style={styles.bedsRow}>
                    {['A', 'B'].map(bid => {
                      const roomData = rooms.find(r => r._id === selectedRoomId);
                      if (bid === 'B' && roomData?.type === 'single') return null;
                      
                      const bedData = roomData?.beds.find((b: any) => b.bedId === bid);
                      const isOccupied = bedData?.isOccupied && bedData?.student !== editingAllocation?.studentId;
                      const isCurrent = bedData?.student === editingAllocation?.studentId;
                      const isSelected = selectedBedId === bid;

                      return (
                        <TouchableOpacity 
                          key={bid}
                          disabled={isOccupied}
                          style={[
                            styles.bedSelectorItem, 
                            isSelected && styles.activeBedSelectorItem,
                            isOccupied && styles.occupiedBedItem
                          ]}
                          onPress={() => setSelectedBedId(bid)}
                        >
                          <View style={[
                            styles.bedIconBox,
                            isOccupied ? styles.bedIconOccupied : (isSelected ? styles.bedIconSelected : (isCurrent ? styles.bedIconCurrent : styles.bedIconAvailable))
                          ]}>
                            {isOccupied ? <X size={18} color="#EF4444" /> : <Check size={18} color={isSelected ? '#FFF' : (isCurrent ? Colors.roles.warden : '#10B981')} />}
                          </View>
                          <Text style={[styles.bedSelectorText, isSelected && styles.activeBedSelectorText]}>Bed {bid}</Text>
                          <Text style={[
                            styles.bedOptionStatus,
                            { color: isOccupied ? '#EF4444' : (isSelected ? Colors.roles.warden : (isCurrent ? Colors.roles.warden : '#10B981')) }
                          ]}>
                            {isOccupied ? 'Occupied' : (isCurrent ? 'Current' : (isSelected ? 'Selected' : 'Available'))}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[styles.updateBtn, updating && { opacity: 0.7 }]} 
                onPress={handleUpdateAllocation}
                disabled={updating || !selectedRoomId || !selectedBedId}
              >
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Save New Allocation</Text>}
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
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statsRow: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 12 },
  statBox: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 1 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLab: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  actionIconBtn: { width: 54, height: 54, backgroundColor: Colors.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 28, padding: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  recordSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  deleteBtn: { borderColor: '#EF444430', backgroundColor: '#EF444405' },
  downloadLink: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.roles.warden + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  downloadText: { fontSize: 11, fontWeight: '800', color: Colors.roles.warden },
  detailsGrid: { flexDirection: 'row', gap: 12 },
  detailBox: { flex: 1, backgroundColor: Colors.background, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: Colors.border + '50' },
  detailLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '800', color: Colors.text },
  detailSubLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  footerRow: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border + '50', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '85%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  modalBody: { paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 16 },
  selectorScroll: { flexDirection: 'row', marginBottom: 8 },
  selectorItem: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.background, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  activeSelectorItem: { backgroundColor: Colors.roles.warden, borderColor: Colors.roles.warden },
  selectorText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  activeSelectorText: { color: '#FFF' },
  roomsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
  roomSelectorItem: { 
    width: '30%', 
    backgroundColor: Colors.background, 
    paddingVertical: 14, 
    paddingHorizontal: 4, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    alignItems: 'center', 
    position: 'relative', 
    marginBottom: 2 
  },
  activeRoomSelectorItem: { borderColor: Colors.roles.warden, backgroundColor: Colors.roles.warden + '05', borderWidth: 2 },
  roomStatusDot: { position: 'absolute', top: 8, left: 8, width: 6, height: 6, borderRadius: 3 },
  roomSelectorText: { fontSize: 13, fontWeight: '800', color: Colors.text },
  activeRoomSelectorText: { color: Colors.roles.warden },
  roomTypeText: { fontSize: 8, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  checkIcon: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.roles.warden, borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.surface },
  bedsRow: { flexDirection: 'row', gap: 16 },
  bedSelectorItem: { flex: 1, backgroundColor: Colors.background, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  activeBedSelectorItem: { borderColor: Colors.roles.warden, backgroundColor: Colors.roles.warden + '05', borderWidth: 2 },
  occupiedBedItem: { opacity: 0.5, backgroundColor: '#F1F5F9' },
  bedIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bedIconAvailable: { backgroundColor: '#10B98115' },
  bedIconSelected: { backgroundColor: Colors.roles.warden },
  bedIconCurrent: { backgroundColor: Colors.roles.warden + '15' },
  bedIconOccupied: { backgroundColor: '#EF444415' },
  bedSelectorText: { fontSize: 15, fontWeight: '800', color: Colors.text },
  activeBedSelectorText: { color: Colors.roles.warden },
  bedOptionStatus: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  updateBtn: { backgroundColor: Colors.roles.warden, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 40, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  sectionSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
});
