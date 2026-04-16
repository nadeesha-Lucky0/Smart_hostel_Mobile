import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import Colors from '../../constants/Colors';
import { Layers, MapPin, Grid, Info, X, Check, Power } from 'lucide-react-native';
import api from '../../services/api';

export default function RoomManagement() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState('male');
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchFloors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/floors?wing=${selectedWing}`);
      setFloors(res.data);
    } catch (err) {
      console.error('Fetch floors error:', err);
      Alert.alert('Error', 'Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  }, [selectedWing]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  const fetchRooms = async (floorId: string) => {
    try {
      setRoomsLoading(true);
      const res = await api.get(`/rooms?floor=${floorId}`);
      setRooms(res.data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleToggleRoomStatus = async (roomId: string) => {
    try {
      await api.patch(`/rooms/${roomId}/toggle-status`);
      // Update local state
      setRooms(prev => prev.map(r => r._id === roomId ? { ...r, isactive: !r.isactive } : r));
    } catch (err) {
      Alert.alert('Error', 'Failed to update room status');
    }
  };

  const handleViewRooms = (floor: any) => {
    setSelectedFloor(floor);
    fetchRooms(floor._id);
  };

  const renderFloorItem = ({ item }: any) => (
    <TouchableOpacity style={styles.floorCard} onPress={() => handleViewRooms(item)}>
      <View style={styles.floorHeader}>
        <View style={styles.floorIcon}>
          <Layers size={20} color={selectedWing === 'male' ? Colors.roles.student : Colors.roles.financial} />
        </View>
        <Text style={styles.floorNumber}>Floor {item.floorNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.isactive ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.isactive ? '#10B981' : '#EF4444' }]}>
            {item.isactive ? 'Active' : 'Maintenance'}
          </Text>
        </View>
      </View>
      
      <View style={styles.floorDetails}>
        <View style={styles.detailItem}>
          <Grid size={16} color={Colors.textMuted} />
          <Text style={styles.detailText}>{item.numberOfRooms || 0} Rooms</Text>
        </View>
        <View style={styles.detailItem}>
          <MapPin size={16} color={Colors.textMuted} />
          <Text style={styles.detailText}>{selectedWing.toUpperCase()} Wing</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewRoomsBtn} onPress={() => handleViewRooms(item)}>
        <Text style={styles.viewRoomsBtnText}>Manage Rooms</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.wingToggle}>
        <TouchableOpacity 
          style={[styles.wingBtn, selectedWing === 'male' && styles.activeWingBtn]}
          onPress={() => setSelectedWing('male')}
        >
          <Text style={[styles.wingBtnText, selectedWing === 'male' && styles.activeWingBtnText]}>Male Wing</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.wingBtn, selectedWing === 'female' && styles.activeWingBtn]}
          onPress={() => setSelectedWing('female')}
        >
          <Text style={[styles.wingBtnText, selectedWing === 'female' && styles.activeWingBtnText]}>Female Wing</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={floors}
          renderItem={renderFloorItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No floors found for this wing</Text>
            </View>
          }
        />
      )}

      {/* Room Selection Modal */}
      <Modal
        visible={!!selectedFloor}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFloor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Floor {selectedFloor?.floorNumber}</Text>
                <Text style={styles.modalSub}>{selectedWing.toUpperCase()} Wing • Rooms</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFloor(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {roomsLoading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={Colors.roles.warden} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.roomsGrid}>
                {rooms.map(room => (
                  <View key={room._id} style={[styles.roomCard, !room.isactive && styles.inactiveRoom]}>
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomNumber}>{selectedWing === 'female' ? 'F' : 'M'}{room.roomnumber}</Text>
                      <TouchableOpacity onPress={() => handleToggleRoomStatus(room._id)}>
                        <Power size={18} color={room.isactive ? '#10B981' : '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.roomType}>{room.type}</Text>
                    <View style={styles.bedsRow}>
                      {room.beds.map((bed: any) => (
                        <View 
                          key={bed.bedId} 
                          style={[styles.bedDot, bed.isOccupied ? styles.occupiedBed : styles.availableBed]}
                        />
                      ))}
                    </View>
                    <Text style={styles.occupancyText}>
                      {room.beds.filter((b: any) => b.isOccupied).length}/{room.beds.length} Beds
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  wingToggle: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  wingBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  activeWingBtn: { backgroundColor: Colors.roles.warden, borderColor: Colors.roles.warden },
  wingBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  activeWingBtnText: { color: '#FFF' },
  list: { padding: 16, paddingBottom: 100 },
  floorCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  floorIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  floorNumber: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  floorDetails: { flexDirection: 'row', gap: 24, marginBottom: 20, paddingHorizontal: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  viewRoomsBtn: { borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 16, alignItems: 'center' },
  viewRoomsBtnText: { fontSize: 14, fontWeight: '800', color: Colors.roles.warden },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  modalLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 },
  roomCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: 20, padding: 16, elevation: 1 },
  inactiveRoom: { opacity: 0.6 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomNumber: { fontSize: 16, fontWeight: '800', color: Colors.text },
  roomType: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },
  bedsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  bedDot: { width: 8, height: 8, borderRadius: 4 },
  availableBed: { backgroundColor: '#10B981' },
  occupiedBed: { backgroundColor: Colors.border },
  occupancyText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
});
