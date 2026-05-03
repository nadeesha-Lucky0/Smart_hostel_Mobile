import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  Plus,
  Trash2,
  X,
  Building,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Lock,
  Search,
  Table,
  FileDown,
  ChevronRight,
  Home,
  User,
  RefreshCw,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import api from '../../services/api';

const { width } = Dimensions.get('window');

// Status helpers matching web app
const STATUS_CYCLE = ['AVAILABLE', 'OCCUPIED', 'MISSING'];
const CA_STATUS_CYCLE = ['AVAILABLE', 'MISSING', 'MAINTENANCE'];

const getNextStatus = (s: string) => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
const getNextCAStatus = (s: string) => CA_STATUS_CYCLE[(CA_STATUS_CYCLE.indexOf(s) + 1) % CA_STATUS_CYCLE.length];

const StatusBadge = ({ status, onClick, disabled }: { status: string, onClick?: () => void, disabled?: boolean }) => {
  const getColors = () => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#ECFDF5', text: '#059669', icon: CheckCircle };
      case 'OCCUPIED': return { bg: '#EEF2FF', text: '#4F46E5', icon: Lock };
      case 'MISSING': return { bg: '#FFFBEB', text: '#D97706', icon: AlertTriangle };
      case 'MAINTENANCE': return { bg: '#FEF2F2', text: '#DC2626', icon: AlertTriangle };
      default: return { bg: '#F3F4F6', text: '#4B5563', icon: CheckCircle };
    }
  };

  const { bg, text, icon: Icon } = getColors();

  return (
    <TouchableOpacity
      onPress={onClick}
      disabled={disabled || !onClick}
      style={[styles.statusBadge, { backgroundColor: bg }, disabled && { opacity: 0.6 }]}
    >
      <Icon size={12} color={text} style={{ marginRight: 4 }} />
      <Text style={[styles.statusText, { color: text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// --- Common Areas Tab ---
const CommonAreasTab = () => {
  const [subTab, setSubTab] = useState('Ground Floor');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ itemName: '', itemType: '', uniqueCode: '', status: 'AVAILABLE' });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/resources/common-area?areaName=${subTab}`);
      setItems(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load items');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [subTab]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!form.itemName || !form.itemType || !form.uniqueCode) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await api.post('/resources/common-area', { ...form, areaName: subTab });
      Alert.alert('Success', 'Item added successfully');
      setShowAddModal(false);
      setForm({ itemName: '', itemType: '', uniqueCode: '', status: 'AVAILABLE' });
      load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusCycle = async (item: any) => {
    const newStatus = getNextCAStatus(item.status);
    try {
      await api.put(`/resources/common-area/${item._id}/status`, { status: newStatus });
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, status: newStatus } : i));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/resources/common-area/${id}`);
            setItems(prev => prev.filter(i => i._id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete item');
          }
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Shared Resources</Text>
          <Text style={styles.sectionSub}>Manage Items in Public Areas</Text>
        </View>
      </View>

      <View style={[styles.subHeaderRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <View style={styles.subTabGroup}>
          {['Ground Floor', 'Floor 1'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSubTab(tab)}
              style={[styles.miniTab, subTab === tab && styles.miniTabActive]}
            >
              <Text style={[styles.miniTabText, subTab === tab && styles.miniTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.miniActionBtn} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={Colors.roles.warden} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.roles.warden} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items in {subTab}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.resourceCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.nameSection}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemType}>{item.itemType}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardFooterRow}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.uniqueCode}</Text>
                </View>
                <StatusBadge status={item.status} onClick={() => handleStatusCycle(item)} />
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item — {subTab}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Office Chair #3"
                value={form.itemName}
                onChangeText={t => setForm({ ...form, itemName: t })}
              />
              <Text style={styles.inputLabel}>Item Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chair, Table, Fan..."
                value={form.itemType}
                onChangeText={t => setForm({ ...form, itemType: t })}
              />
              <Text style={styles.inputLabel}>Unique Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CA-GF-001"
                value={form.uniqueCode}
                onChangeText={t => setForm({ ...form, uniqueCode: t })}
              />
              <Text style={styles.inputLabel}>Initial Status</Text>
              <View style={styles.statusSelector}>
                {CA_STATUS_CYCLE.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm({ ...form, status: s })}
                    style={[styles.statusOption, form.status === s && styles.statusOptionActive]}
                  >
                    <Text style={[styles.statusOptionText, form.status === s && styles.statusOptionTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Add to Inventory</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Student Floors Tab ---
const StudentFloorsTab = () => {
  const [wing, setWing] = useState('male');
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFloors = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/floors?wing=${wing}`);
      const sorted = res.data.sort((a: any, b: any) => a.floorNumber - b.floorNumber);
      setFloors(sorted);
      if (sorted.length > 0 && !selectedFloor) {
        setSelectedFloor(sorted[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load floors');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [wing, selectedFloor]);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  const loadRooms = useCallback(async (floorId: string) => {
    try {
      const res = await api.get(`/rooms?floor=${floorId}`);
      setRooms(res.data.sort((a: any, b: any) => a.roomnumber - b.roomnumber));
    } catch (err) {
      Alert.alert('Error', 'Failed to load rooms');
    }
  }, []);

  useEffect(() => {
    if (selectedFloor) {
      loadRooms(selectedFloor._id);
    }
  }, [selectedFloor, loadRooms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFloors(true);
    if (selectedFloor) {
      await loadRooms(selectedFloor._id);
    }
    setRefreshing(false);
  };

  const handleMigrate = async () => {
    Alert.alert('Confirm Migration', 'Add goods to all rooms?', [
      { text: 'Cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setMigrating(true);
          try {
            await api.post('/rooms/migrate-goods');
            Alert.alert('Success', 'Migration complete');
            loadFloors();
          } catch (err) {
            Alert.alert('Error', 'Migration failed');
          } finally {
            setMigrating(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Hostel Wings</Text>
          <Text style={styles.sectionSub}>Manage Floors & Room Inventory</Text>
        </View>
      </View>

      <View style={[styles.subHeaderRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <View style={styles.subTabGroup}>
          <TouchableOpacity
            onPress={() => { setWing('male'); setSelectedFloor(null); }}
            style={[styles.miniTab, wing === 'male' && styles.miniTabActive]}
          >
            <Text style={[styles.miniTabText, wing === 'male' && styles.miniTabTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setWing('female'); setSelectedFloor(null); }}
            style={[styles.miniTab, wing === 'female' && styles.miniTabActive]}
          >
            <Text style={[styles.miniTabText, wing === 'female' && styles.miniTabTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.miniActionBtn} 
          onPress={handleMigrate} 
          disabled={migrating}
        >
          <RefreshCw size={20} color={Colors.roles.warden} style={migrating && { transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.floorPills}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {floors.map(floor => (
            <TouchableOpacity
              key={floor._id}
              onPress={() => setSelectedFloor(floor)}
              style={[
                styles.floorPill,
                selectedFloor?._id === floor._id && (floor.isactive ? styles.floorPillActive : styles.floorPillInactive)
              ]}
            >
              <Text style={[styles.floorPillText, selectedFloor?._id === floor._id && styles.floorPillTextActive]}>
                Floor {floor.floorNumber}
              </Text>
              {!floor.isactive && <View style={styles.inactiveDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedFloor && !selectedFloor.isactive && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={16} color="#D97706" />
          <Text style={styles.warningText}>This floor is disabled. Read-only mode.</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.roles.warden} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rooms}
          numColumns={2}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => {
            const occ = item.beds?.filter((b: any) => b.isOccupied).length || 0;
            const total = item.beds?.length || 0;
            const isFull = total > 0 && occ === total;
            const isEmpty = total === 0 || occ === 0;

            return (
              <TouchableOpacity
                onPress={() => setSelectedRoom(item)}
                style={[
                  styles.roomCard,
                  isFull ? styles.roomFull : isEmpty ? styles.roomVacant : styles.roomPartial
                ]}
              >
                <Text style={styles.roomNumber}>{item.Roomid || 'N/A'}</Text>
                <Text style={[styles.roomStatus, { color: isFull ? Colors.danger : isEmpty ? Colors.success : '#D97706' }]}>
                  {isFull ? 'FULL' : isEmpty ? 'VACANT' : `${occ}/${total} OCC`}
                </Text>
                <Text style={styles.roomType}>{item.type || 'Standard'}</Text>
                <Pencil size={12} color="#CBD5E1" style={styles.pencilIcon} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          floorActive={selectedFloor?.isactive !== false}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </View>
  );
};

// --- Room Detail Modal ---
const RoomDetailModal = ({ room: initialRoom, floorActive, onClose }: any) => {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const loadGoods = async () => {
      try {
        const res = await api.get(`/rooms/${initialRoom._id}/goods`);
        setRoom(res.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load goods');
      } finally {
        setLoading(false);
      }
    };
    loadGoods();
  }, [initialRoom._id]);

  const handleUpdateGood = async (bedId: string | null, goodId: string, field: string, value: any) => {
    if (!floorActive) return;
    setSaving(goodId);
    try {
      const res = await api.put(`/rooms/${room._id}/goods/${goodId}`, { bedId, [field]: value });
      setRoom(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Room {initialRoom.Roomid}</Text>
              <Text style={styles.modalSubtitle}>{initialRoom.type} room · Floor {initialRoom.floorNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.roles.warden} style={{ margin: 40 }} />
          ) : room ? (
            <ScrollView style={styles.modalBody}>
              {room.beds.map((bed: any) => (
                <View key={bed.bedId} style={styles.bedSection}>
                  <View style={styles.bedHeader}>
                    <Text style={styles.bedTitle}>Bed {bed.bedId}</Text>
                    {bed.isOccupied && bed.allocation ? (
                      <View style={styles.studentBadge}>
                        <User size={12} color={Colors.roles.warden} />
                        <Text style={styles.studentName}>{bed.allocation.studentName}</Text>
                      </View>
                    ) : (
                      <Text style={styles.vacantText}>Vacant</Text>
                    )}
                  </View>
                  <View style={styles.goodsList}>
                    {bed.goods?.map((good: any) => (
                      <View key={good._id} style={styles.goodRow}>
                        <Text style={styles.goodType}>{good.type || good.itemType}</Text>
                        <TextInput
                          style={styles.goodInput}
                          placeholder="Code"
                          defaultValue={good.uniqueCode}
                          onBlur={(e) => handleUpdateGood(bed.bedId, good._id, 'uniqueCode', e.nativeEvent.text)}
                          editable={floorActive && saving !== good._id}
                        />
                        <StatusBadge
                          status={good.status}
                          disabled={!floorActive || saving === good._id}
                          onClick={() => handleUpdateGood(bed.bedId, good._id, 'status', getNextStatus(good.status))}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

export default function HostelResources() {
  const [mainTab, setMainTab] = useState<'common' | 'student'>('common');
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = () => {
    // This is a placeholder since the actual loading logic is inside the sub-components.
    // However, we can use a key or a global refresh trigger if needed.
    // For now, let's just alert or trigger the child.
    // Since we don't have a direct ref to child, we'll use a simple hack: toggle a 'refreshKey'
    setRefreshKey(prev => prev + 1);
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/furniture/search?code=${searchCode.trim()}`);
      const result = res.data;
      if (result.type === 'room') {
        Alert.alert('Found!', `Item found in Room ${result.room.Roomid}`);
        setMainTab('student');
      } else {
        Alert.alert('Found!', `Item found in ${result.item.areaName}`);
        setMainTab('common');
      }
    } catch (err: any) {
      Alert.alert('Not Found', 'No item matching this code was found.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Consolidated Header Container */}
      <View style={styles.headerContainer}>

        {/* Search inside header group */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Furniture Code..."
            value={searchCode}
            onChangeText={setSearchCode}
            onSubmitEditing={handleSearch}
          />
          {searching && <ActivityIndicator size="small" color={Colors.roles.warden} style={{ marginRight: 12 }} />}
        </View>

        {/* Main Tabs inside header group */}
        <View style={styles.mainTabContainer}>
          <TouchableOpacity
            onPress={() => setMainTab('common')}
            style={[styles.mainTab, mainTab === 'common' && styles.mainTabActive]}
          >
            <Text style={[styles.mainTabText, mainTab === 'common' && styles.mainTabTextActive]}>Common Areas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMainTab('student')}
            style={[styles.mainTab, mainTab === 'student' && styles.mainTabActive]}
          >
            <Text style={[styles.mainTabText, mainTab === 'student' && styles.mainTabTextActive]}>Student Floors</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {mainTab === 'common' ? <CommonAreasTab key={`ca-${refreshKey}`} /> : <StudentFloorsTab key={`sf-${refreshKey}`} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 16, height: 50, borderWidth: 1, borderColor: Colors.border, elevation: 1, marginBottom: 20 },
  searchInput: { flex: 1, paddingHorizontal: 12, fontSize: 14, fontWeight: '600', color: Colors.text },

  mainTabContainer: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 14, gap: 4 },
  mainTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  mainTabActive: { backgroundColor: Colors.roles.warden, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  mainTabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  mainTabTextActive: { color: '#FFF' },

  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  subTabGroup: { flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 12, gap: 4 },
  miniTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniTabActive: { backgroundColor: Colors.roles.warden, elevation: 2, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  miniTabText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  miniTabTextActive: { color: '#FFF' },
  miniActionBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.roles.warden + '10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.roles.warden + '30' },

  resourceCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  nameSection: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  itemType: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  codeText: { fontSize: 11, fontWeight: '800', color: Colors.roles.warden, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  sectionSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },

  wingSwitcher: { marginHorizontal: 20, flexDirection: 'row', backgroundColor: Colors.background, padding: 4, borderRadius: 14, gap: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  wingBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  wingBtnActive: { backgroundColor: Colors.roles.warden, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  wingBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  wingBtnTextActive: { color: '#FFF' },
  migrateBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  floorPills: { marginBottom: 16 },
  floorPill: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
  floorPillActive: { backgroundColor: Colors.roles.warden, borderColor: Colors.roles.warden },
  floorPillInactive: { backgroundColor: '#64748B', borderColor: '#64748B' },
  floorPillText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  floorPillTextActive: { color: '#FFF' },
  inactiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', marginLeft: 8 },

  warningBanner: { marginHorizontal: 20, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  warningText: { fontSize: 12, color: '#D97706', fontWeight: '700' },

  roomCard: { flex: 1, margin: 8, backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: '#E2E8F0' },
  roomFull: { borderColor: '#FEE2E2' },
  roomVacant: { borderColor: '#ECFDF5' },
  roomPartial: { borderColor: '#FEF3C7' },
  roomNumber: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  roomStatus: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  roomType: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  pencilIcon: { position: 'absolute', top: 12, right: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 28, overflow: 'hidden', elevation: 20 },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 2 },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  statusSelector: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusOption: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  statusOptionActive: { backgroundColor: Colors.roles.warden },
  statusOptionText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  statusOptionTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: Colors.roles.warden, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 20, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  bedSection: { marginBottom: 24, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  bedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bedTitle: { fontSize: 14, fontWeight: '900', color: '#1F2937', textTransform: 'uppercase' },
  studentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  studentName: { fontSize: 11, fontWeight: '800', color: Colors.roles.warden },
  vacantText: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  goodsList: { gap: 8 },
  goodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', padding: 8, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  goodType: { width: 70, fontSize: 10, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  goodInput: { flex: 1, height: 36, backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 8, fontSize: 12, fontWeight: '700', color: Colors.roles.warden, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '700' },
});
