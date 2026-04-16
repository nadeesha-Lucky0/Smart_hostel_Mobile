import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import Colors from '../../constants/Colors';
import { 
  BedDouble, 
  UserPlus, 
  Users, 
  Search, 
  ChevronRight, 
  X, 
  Check, 
  ArrowLeft, 
  Info, 
  Filter,
  CreditCard,
  MapPin,
  Clock
} from 'lucide-react-native';
import api from '../../services/api';

type AllocationView = 'hub' | 'select_room' | 'confirm';
type SubTab = 'pending' | 'allocated';

export default function WardenAllocations() {
  const [view, setView] = useState<AllocationView>('hub');
  const [activeTab, setActiveTab] = useState<SubTab>('pending');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState<string>('all');
  
  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  // Selection states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'hub') {
      fetchStudents();
    }
  }, [view]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetching from student-payments/all as in web StudentApplications.jsx
      const res = await api.get('/student-payments/all');
      setStudents(res.data);
    } catch (err) {
      console.error('Fetch students error:', err);
      Alert.alert('Error', 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (wing: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms?wing=${wing}&activeOnly=true`);
      // Filter rooms that have at least one available bed
      const available = res.data.filter((r: any) => r.beds.some((b: any) => !b.isOccupied));
      setRooms(available);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAllocation = (student: any) => {
    setSelectedStudent(student);
    setView('select_room');
    fetchAvailableRooms(student.wing);
  };

  const handleSelectRoom = (room: any) => {
    setSelectedRoom(room);
    // Auto-select first available bed
    const firstBed = room.beds.find((b: any) => !b.isOccupied);
    if (firstBed) setSelectedBed(firstBed.bedId);
    setView('confirm');
  };

  const handleFinalizeAllocation = async () => {
    try {
      setLoading(true);
      await api.post('/allocations', {
        studentId: selectedStudent._id,
        roomId: selectedRoom._id,
        bedId: selectedBed
      });
      
      Alert.alert('Success', 'Room allocated successfully!', [
        { text: 'OK', onPress: () => resetAllocation() }
      ]);
    } catch (err: any) {
      Alert.alert('Allocation Failed', err.response?.data?.error || 'Could not complete allocation');
    } finally {
      setLoading(false);
    }
  };

  const resetAllocation = () => {
    setView('hub');
    setSelectedStudent(null);
    setSelectedRoom(null);
    setSelectedBed(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesTab = activeTab === 'allocated' ? s.isAllocated : !s.isAllocated;
    const matchesWing = wingFilter === 'all' || s.wing === wingFilter;
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (s.rollNumber || '').toLowerCase().includes(search.toLowerCase());
    
    return matchesTab && matchesWing && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'failed': return '#EF4444';
      case 'rejected': return '#F59E0B';
      default: return '#6366F1'; // Pending
    }
  };

  // Sub-components for different views
  const renderHub = () => (
    <View style={styles.container}>
      {/* Header & Filters */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            placeholder="Search student or roll number..." 
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wingFilters}>
            {['all', 'male', 'female'].map(wing => (
              <TouchableOpacity 
                key={wing} 
                style={[styles.wingBtn, wingFilter === wing && styles.wingBtnActive]}
                onPress={() => setWingFilter(wing)}
              >
                <Text style={[styles.wingBtnText, wingFilter === wing && styles.wingBtnTextActive]}>
                  {wing === 'all' ? 'All Wings' : wing.charAt(0).toUpperCase() + wing.slice(1) + ' Wing'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Custom Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending Allocation</Text>
          {students.filter(s => !s.isAllocated).length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{students.filter(s => !s.isAllocated).length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'allocated' && styles.tabActive]} 
          onPress={() => setActiveTab('allocated')}
        >
          <Text style={[styles.tabText, activeTab === 'allocated' && styles.tabTextActive]}>Allocated Students</Text>
        </TouchableOpacity>
      </View>

      {loading && view === 'hub' ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
          <Text style={styles.loadingText}>Fetching Student Records...</Text>
        </View>
      ) : (
        <FlatList 
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.studentId}>{item.rollNumber}</Text>
                </View>
                <View style={[styles.wingBadge, { backgroundColor: item.wing === 'male' ? '#3B82F615' : '#EC489915' }]}>
                  <Text style={[styles.wingBadgeText, { color: item.wing === 'male' ? '#3B82F6' : '#EC4899' }]}>
                    {item.wing?.toUpperCase()} WING
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardInfoGrid}>
                <View style={{ flex: 1 }}>
                   <Text style={styles.infoLabel}>DEGREE</Text>
                   <Text style={styles.infoText} numberOfLines={1}>{item.degree || 'N/A'}</Text>
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.infoLabel}>PAYMENT</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.paymentStatus) }]} />
                    <Text style={[styles.infoText, { color: getStatusColor(item.paymentStatus), fontWeight: '700' }]}>
                      {item.paymentStatus === 'success' ? 'Verified' : (item.paymentStatus || 'Pending').charAt(0).toUpperCase() + (item.paymentStatus || 'Pending').slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {activeTab === 'pending' ? (
                <TouchableOpacity 
                  style={[styles.allocateBtn, item.paymentStatus !== 'success' && styles.allocateBtnDisabled]}
                  onPress={() => handleStartAllocation(item)}
                  disabled={item.paymentStatus !== 'success'}
                >
                  <UserPlus size={18} color="#FFF" />
                  <Text style={styles.allocateBtnText}>Allocate Room</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.allocatedStatus}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.assignedRoomText}>Room Allocation Completed</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No students found matching your criteria</Text>
            </View>
          }
        />
      )}
    </View>
  );

  const renderRoomSelection = () => (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setView('hub')} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Select Room</Text>
          <Text style={styles.headerSub} numberOfLines={1}>Assigning to {selectedStudent?.name}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.roles.warden} />
      ) : (
        <FlatList 
          data={rooms}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.gridList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.roomSelectCard} onPress={() => handleSelectRoom(item)}>
              <Text style={styles.roomNumText}>{selectedStudent?.wing === 'female' ? 'F' : 'M'}{item.roomnumber}</Text>
              <Text style={styles.roomTypeText}>{item.type}</Text>
              <View style={styles.roomBeds}>
                {item.beds.map((b: any) => (
                  <View key={b.bedId} style={[styles.bedMiniDot, b.isOccupied ? styles.bedOccupied : styles.bedAvailable]} />
                ))}
              </View>
              <Text style={styles.roomAvailabilityText}>
                {item.beds.filter((b: any) => !b.isOccupied).length} Available
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setView('select_room')} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Allocation</Text>
      </View>

      <View style={styles.confirmContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Users size={20} color={Colors.roles.warden} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Student</Text>
              <Text style={styles.summaryValue}>{selectedStudent?.name}</Text>
              <Text style={styles.summaryDetail}>{selectedStudent?.rollNumber} • {selectedStudent?.wing?.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={[styles.summaryRow, { marginTop: 24 }]}>
            <View style={styles.iconBox}>
              <BedDouble size={20} color={Colors.roles.warden} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Room & Bed</Text>
              <Text style={styles.summaryValue}>
                Room {selectedStudent?.wing === 'female' ? 'F' : 'M'}{selectedRoom?.roomnumber} • Bed {selectedBed}
              </Text>
              <Text style={styles.summaryDetail}>{selectedRoom?.type} Room</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.finalizeBtn, loading && styles.disabledBtn]} 
          onPress={handleFinalizeAllocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Check size={20} color="#FFF" />
              <Text style={styles.finalizeBtnText}>Finalize Allocation</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelBtn} onPress={resetAllocation} disabled={loading}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  switch (view) {
    case 'select_room': return renderRoomSelection();
    case 'confirm': return renderConfirmation();
    default: return renderHub();
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  filterRow: {
    marginTop: 12,
  },
  wingFilters: {
    gap: 8,
  },
  wingBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wingBtnActive: {
    backgroundColor: Colors.roles.warden,
    borderColor: Colors.roles.warden,
  },
  wingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  wingBtnTextActive: {
    color: '#FFF',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.roles.warden + '10',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.roles.warden,
  },
  tabBadge: {
    backgroundColor: Colors.roles.warden,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
  },
  studentId: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  wingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  wingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  allocateBtn: {
    backgroundColor: Colors.roles.warden,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 10,
  },
  allocateBtnDisabled: {
    backgroundColor: Colors.border,
  },
  allocateBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  allocatedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B98110',
    padding: 12,
    borderRadius: 12,
  },
  assignedRoomText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  subHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  gridList: {
    padding: 12,
  },
  roomSelectCard: {
    flex: 1,
    margin: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomNumText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  roomTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  roomBeds: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  bedMiniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bedOccupied: { backgroundColor: Colors.border },
  bedAvailable: { backgroundColor: '#10B981' },
  roomAvailabilityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  confirmContent: {
    padding: 24,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.roles.warden + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: 14,
    color: Colors.roles.warden,
    fontWeight: '700',
    marginTop: 2,
  },
  finalizeBtn: {
    backgroundColor: Colors.roles.warden,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 18,
    marginTop: 32,
    gap: 12,
    shadowColor: Colors.roles.warden,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  finalizeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  cancelBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
