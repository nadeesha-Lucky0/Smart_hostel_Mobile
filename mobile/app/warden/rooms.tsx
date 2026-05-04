import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, Switch } from 'react-native';
import Colors from '../../constants/Colors';
import { Layers, MapPin, Grid, Info, X, Check, Power, AlertTriangle, ShieldCheck, Trash2, Users } from 'lucide-react-native';
import api from '../../services/api';

export default function RoomManagement() {
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState('male');
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [floorRooms, setFloorRooms] = useState<Record<string, any[]>>({});
  
  // Add Floor Modal State
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [selectedNewFloors, setSelectedNewFloors] = useState<number[]>([]);
  const [addingFloors, setAddingFloors] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const potentialFloors = [2, 3, 4, 5, 6, 7, 8];

  const fetchFloors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/floors?wing=${selectedWing}`);
      const floorData = res.data;
      setFloors(floorData);
      
      // Mirror web app: fetch rooms for all floors to calculate occupancy
      const roomMap: Record<string, any[]> = {};
      for (const floor of floorData) {
        try {
          const roomsRes = await api.get(`/rooms?floor=${floor._id}`);
          roomMap[floor._id] = roomsRes.data;
        } catch (roomErr) {
          console.error(`Failed to fetch rooms for floor ${floor.floorNumber}:`, roomErr);
          roomMap[floor._id] = [];
        }
      }
      setFloorRooms(roomMap);
    } catch (err) {
      console.error('Fetch floors error:', err);
      Alert.alert('Error', 'Failed to fetch infrastructure data');
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

  const handleAddFloors = async () => {
    if (selectedNewFloors.length === 0) return;
    
    setAddingFloors(true);
    try {
      // Sequential addition as standard REST often uses POST /floors per item
      for (const floorNum of selectedNewFloors) {
        await api.post('/floors', {
          floorNumber: floorNum,
          wing: selectedWing,
          floorID: `${selectedWing.toUpperCase()}_FL${floorNum}`
        });
      }
      
      Alert.alert('Success', `Successfully added ${selectedNewFloors.length} floors to ${selectedWing} wing`);
      setIsAddFloorModalOpen(false);
      setSelectedNewFloors([]);
      fetchFloors();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add floors');
    } finally {
      setAddingFloors(false);
    }
  };

  const toggleNewFloorSelection = (floorNum: number) => {
    setSelectedNewFloors(prev => 
      prev.includes(floorNum) 
        ? prev.filter(f => f !== floorNum)
        : [...prev, floorNum]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFloors();
    setRefreshing(false);
  };

  const handleToggleFloorStatus = async (floor: any) => {
    const action = floor.isactive ? 'Deactivate' : 'Activate';
    
    const performToggle = async () => {
      try {
        setTogglingId(floor._id);
        const res = await api.patch(`/floors/${floor._id}/toggle`);
        // Update local state
        setFloors(prev => prev.map(f => f._id === floor._id ? res.data : f));
        
        // If the floor we toggled is the one currently open in modal, refresh its rooms
        if (selectedFloor?._id === floor._id) {
          fetchRooms(floor._id);
        }
        
        Alert.alert('Success', `Floor ${floor.floorNumber} ${action.toLowerCase()}d successfully`);
      } catch (err: any) {
        Alert.alert('Action Failed', err.response?.data?.error || `Could not ${action.toLowerCase()} floor`);
      } finally {
        setTogglingId(null);
      }
    };

    if (floor.isactive) {
      Alert.alert(
        'Deactivate Floor',
        `Are you sure you want to deactivate Floor ${floor.floorNumber}? All rooms on this floor will also be deactivated.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Deactivate', style: 'destructive', onPress: performToggle }
        ]
      );
    } else {
      performToggle();
    }
  };

  const handleToggleRoomStatus = async (room: any) => {
    const action = room.isactive ? 'Deactivate' : 'Activate';
    
    const performToggle = async () => {
      try {
        setTogglingId(room._id);
        const res = await api.patch(`/rooms/${room._id}/toggle`);
        // Update local state
        setRooms(prev => prev.map(r => r._id === room._id ? { ...r, isactive: !r.isactive } : r));
      } catch (err: any) {
        Alert.alert('Action Failed', err.response?.data?.error || `Could not ${action.toLowerCase()} room`);
      } finally {
        setTogglingId(null);
      }
    };

    if (room.isactive) {
      // Check for occupancy (frontend check to complement backend)
      const hasStudents = room.beds.some((b: any) => b.isOccupied);
      if (hasStudents) {
        Alert.alert('Cannot Deactivate', 'This room has occupied beds. Please reallocate students before deactivating.');
        return;
      }

      Alert.alert(
        'Deactivate Room',
        `Deactivate Room ${selectedWing === 'female' ? 'F' : 'M'}${room.roomnumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Deactivate', style: 'destructive', onPress: performToggle }
        ]
      );
    } else {
      performToggle();
    }
  };

  const handleDeleteFloor = async (floor: any) => {
    Alert.alert(
      'Delete Floor',
      `Are you sure you want to permanently delete Floor ${floor.floorNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setTogglingId(floor._id);
              await api.delete(`/floors/${floor._id}`);
              setFloors(prev => prev.filter(f => f._id !== floor._id));
              Alert.alert('Success', 'Floor deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete floor');
            } finally {
              setTogglingId(null);
            }
          }
        }
      ]
    );
  };

  const handleViewRooms = (floor: any) => {
    setSelectedFloor(floor);
    fetchRooms(floor._id);
  };

  const renderFloorItem = ({ item: floor }: any) => {
    if (!floor) return null;
    
    const roomsForFloor = floorRooms[floor._id] || [];
    const totalBeds = roomsForFloor.reduce((sum, r) => sum + r.beds.length, 0);
    const occupiedBeds = roomsForFloor.reduce((sum, r) => sum + r.beds.filter((b: any) => b.isOccupied).length, 0);

    return (
      <View style={[styles.floorCard, !floor.isactive && styles.inactiveCard]}>
        <View style={styles.floorHeader}>
          <View style={[styles.floorIcon, { backgroundColor: floor.isactive ? Colors.roles.warden + '15' : Colors.border }]}>
            <Layers size={22} color={floor.isactive ? Colors.roles.warden : Colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.floorNumber}>Floor {floor.floorNumber}</Text>
            <Text style={styles.floorIdText}>{floor.floorID}</Text>
          </View>
          <View style={styles.floorToggleAction}>
            {togglingId === floor._id ? (
              <ActivityIndicator size="small" color={Colors.roles.warden} />
            ) : (
              <Switch 
                value={floor.isactive} 
                onValueChange={() => handleToggleFloorStatus(floor)}
                trackColor={{ false: Colors.border, true: Colors.roles.warden }}
                thumbColor={'#FFF'}
              />
            )}
          </View>
        </View>
        
        <View style={styles.floorStatsRow}>
          <View style={styles.statItem}>
            <Grid size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{roomsForFloor.length || floor.numberOfRooms || 0} Rooms</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>
              {occupiedBeds} / {totalBeds} Beds
            </Text>
          </View>
        </View>

        <View style={styles.floorActionsRow}>
          <TouchableOpacity 
            style={[styles.manageBtn, !floor.isactive && styles.manageBtnDisabled]} 
            onPress={() => handleViewRooms(floor)}
            disabled={!floor.isactive}
          >
            <Text style={[styles.manageBtnText, !floor.isactive && styles.manageBtnTextDisabled]}>Manage Room Layout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteFloorBtn, occupiedBeds > 0 && styles.deleteFloorBtnDisabled]} 
            onPress={() => handleDeleteFloor(floor)}
            disabled={occupiedBeds > 0}
          >
            <Trash2 size={18} color={occupiedBeds > 0 ? Colors.textMuted : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Floor & Room</Text>
        <Text style={styles.screenSub}>Manage floors, rooms and bed capacity</Text>
      </View>
      
      <View style={styles.wingHeader}>
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

        <TouchableOpacity style={styles.addFloorBtnSecondary} onPress={() => setIsAddFloorModalOpen(true)}>
          <Layers size={18} color={Colors.roles.warden} />
          <Text style={styles.addFloorBtnTextSecondary}>Add New Floor to {selectedWing.charAt(0).toUpperCase() + selectedWing.slice(1)} Wing</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
          <Text style={styles.loadingText}>Fetching Infrastructure...</Text>
        </View>
      ) : (
        <FlatList 
          data={floors}
          renderItem={renderFloorItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertTriangle size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Floors Found</Text>
              <Text style={styles.emptySub}>Please check the web dashboard to initialize floors for this wing.</Text>
            </View>
          }
        />
      )}

      {/* Add Floor Modal */}
      <Modal
        visible={isAddFloorModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAddFloorModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addFloorModal]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Floors</Text>
                <Text style={styles.modalSub}>Select floors for {selectedWing.toUpperCase()} Wing</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddFloorModalOpen(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.floorPickerGrid}>
               {potentialFloors.map(num => {
                 const alreadyExists = floors.some(f => f.floorNumber === num);
                 const isSelected = selectedNewFloors.includes(num);
                 
                 return (
                   <TouchableOpacity 
                     key={num}
                     disabled={alreadyExists || addingFloors}
                     onPress={() => toggleNewFloorSelection(num)}
                     style={[
                       styles.floorOption,
                       alreadyExists && styles.floorOptionDisabled,
                       isSelected && styles.floorOptionSelected
                     ]}
                   >
                     <Text style={[
                       styles.floorOptionText,
                       alreadyExists && styles.floorOptionTextDisabled,
                       isSelected && styles.floorOptionTextSelected
                     ]}>
                       Floor {num}
                     </Text>
                     {alreadyExists && <Text style={styles.alreadyAddedText}>Existing</Text>}
                     {isSelected && <View style={styles.checkBadge}><Check size={10} color="#FFF" /></View>}
                   </TouchableOpacity>
                 );
               })}
            </View>

            <TouchableOpacity 
              style={[styles.confirmAddBtn, (selectedNewFloors.length === 0 || addingFloors) && styles.disabledBtn]}
              onPress={handleAddFloors}
              disabled={selectedNewFloors.length === 0 || addingFloors}
            >
              {addingFloors ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.confirmAddBtnText}>Add {selectedNewFloors.length} Floors</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                <Text style={styles.modalSub}>{selectedWing.toUpperCase()} Wing • Inventory</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFloor(null)} style={styles.closeBtn}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {roomsLoading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={Colors.roles.warden} />
                <Text style={styles.modalLoaderText}>Loading Room Matrix...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.roomsGrid}>
                {rooms.map(room => (
                  <View key={room._id} style={[styles.roomCard, !room.isactive && styles.inactiveRoom]}>
                    <View style={styles.roomHeader}>
                      <Text style={styles.roomNumber}>{selectedWing === 'female' ? 'F' : 'M'}{room.roomnumber}</Text>
                      {togglingId === room._id ? (
                        <ActivityIndicator size="small" color={Colors.roles.warden} />
                      ) : (
                        <TouchableOpacity onPress={() => handleToggleRoomStatus(room)}>
                          <Power size={18} color={room.isactive ? '#10B981' : '#EF4444'} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.roomType}>{room.type}</Text>
                    <View style={styles.bedsGrid}>
                      {room.beds.map((bed: any) => (
                        <View 
                          key={bed.bedId} 
                          style={[styles.bedPill, bed.isOccupied ? styles.occupiedBedPill : styles.availableBedPill]}
                        >
                          <Text style={[styles.bedIdText, bed.isOccupied ? styles.occupiedText : styles.availableText]}>
                            {bed.bedId}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.statusLabel}>
                      {room.isactive ? (room.beds.every((b: any) => b.isOccupied) ? 'Full' : 'Available') : 'Maintenance'}
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
  screenHeader: { 
    paddingHorizontal: 20, 
    paddingTop: 24, 
    paddingBottom: 12,
    backgroundColor: Colors.surface 
  },
  screenTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: Colors.text 
  },
  screenSub: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: Colors.textMuted,
    marginTop: 2 
  },
  wingHeader: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  wingToggle: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 14, gap: 4 },
  wingBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeWingBtn: { backgroundColor: Colors.roles.warden, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  wingBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  activeWingBtnText: { color: '#FFF' },
  list: { padding: 20, paddingBottom: 100 },
  floorCard: { backgroundColor: Colors.surface, borderRadius: 28, padding: 20, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  inactiveCard: { opacity: 0.75, backgroundColor: '#F8FAFC' },
  floorHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  floorIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  floorNumber: { fontSize: 18, fontWeight: '900', color: Colors.text },
  floorIdText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  floorToggleAction: { paddingLeft: 8 },
  floorStatsRow: { flexDirection: 'row', gap: 20, marginBottom: 20, paddingHorizontal: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  addFloorBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.roles.warden + '10',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.roles.warden + '40',
  },
  addFloorBtnTextSecondary: {
    color: Colors.roles.warden,
    fontSize: 14,
    fontWeight: '800',
  },
  floorActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteFloorBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EF444410',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF444420',
  },
  deleteFloorBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: 'transparent',
    opacity: 0.4,
  },
  manageBtn: { flex: 1, backgroundColor: Colors.background, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  manageBtnDisabled: { borderColor: 'transparent', backgroundColor: Colors.border + '15' },
  manageBtnText: { fontSize: 13, fontWeight: '800', color: Colors.roles.warden },
  manageBtnTextDisabled: { color: Colors.textMuted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 16, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textMuted, fontWeight: '500', textAlign: 'center', lineHeight: 20 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36, height: '88%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: Colors.text },
  modalSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  modalLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  modalLoaderText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  roomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 60 },
  roomCard: { width: '47.8%', backgroundColor: Colors.background, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: Colors.border },
  inactiveRoom: { opacity: 0.6, backgroundColor: Colors.border + '05' },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roomNumber: { fontSize: 18, fontWeight: '900', color: Colors.text },
  roomType: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 1 },
  bedsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  bedPill: { flex: 1, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  availableBedPill: { backgroundColor: '#10B98115', borderWidth: 1, borderColor: '#10B98130' },
  occupiedBedPill: { backgroundColor: Colors.danger + '15', borderWidth: 1, borderColor: Colors.danger + '30' },
  bedIdText: { fontSize: 12, fontWeight: '900' },
  availableText: { color: '#10B981' },
  occupiedText: { color: Colors.danger },
  statusLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  pageTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  addFloorBtn: { backgroundColor: Colors.roles.warden, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  addFloorBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  addFloorModal: { height: 'auto', maxHeight: '75%', borderRadius: 36, margin: 20, marginBottom: 100 },
  floorPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginVertical: 20 },
  floorOption: { width: '45%', backgroundColor: Colors.background, paddingVertical: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  floorOptionSelected: { borderColor: Colors.roles.warden, backgroundColor: Colors.roles.warden + '05', borderWidth: 2 },
  floorOptionDisabled: { opacity: 0.5, backgroundColor: Colors.border + '15' },
  floorOptionText: { fontSize: 16, fontWeight: '800', color: Colors.text },
  floorOptionTextSelected: { color: Colors.roles.warden },
  floorOptionTextDisabled: { color: Colors.textMuted },
  alreadyAddedText: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase' },
  checkBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: Colors.roles.warden, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.surface },
  confirmAddBtn: { backgroundColor: Colors.roles.warden, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  confirmAddBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
});
