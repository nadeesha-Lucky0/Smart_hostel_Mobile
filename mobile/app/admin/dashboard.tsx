import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, Platform, KeyboardAvoidingView, ImageBackground, Image, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import { Users, ShieldCheck, UserPlus, Trash2, Mail, Phone, Lock, X, Check, ChevronRight, UserCircle, Briefcase, Plus, TrendingUp, Layout, Activity, UserCheck, Shield, Settings, Server, Globe } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      {trend && (
        <View style={styles.trendBadge}>
          <TrendingUp size={12} color="#10B981" />
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      )}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  </View>
);

const ManagementCard = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.mgmtCard} onPress={onPress}>
    <View style={[styles.mgmtIconBox, { backgroundColor: color + '15' }]}>
      <Icon size={24} color={color} />
    </View>
    <View style={styles.mgmtTextContainer}>
      <Text style={styles.mgmtTitle}>{title}</Text>
      <Text style={styles.mgmtSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.mgmtArrow}>
      <ChevronRight size={18} color={Colors.textMuted} />
    </View>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, warden: 0, security: 0, financial: 0 });
  
  // Create User Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'warden', phoneNumber: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      const data = res.data.data || res.data;
      if (Array.isArray(data)) {
        setStaff(data);
        calculateStats(data);
      }
    } catch (err: any) {
      console.error('Fetch staff error:', err);
      Alert.alert('Error', 'Failed to load staff accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const calculateStats = (users: any[]) => {
    const s = { total: users.length, warden: 0, security: 0, financial: 0 };
    users.forEach(u => {
      if (u.role === 'warden') s.warden++;
      if (u.role === 'security') s.security++;
      if (u.role === 'financial') s.financial++;
    });
    setStats(s);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      Alert.alert('Success', `User status updated to ${status}`);
      fetchStaff();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteStaff = (id: string, name: string) => {
    Alert.alert(
      'Terminate Access',
      `Are you sure you want to delete ${name}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Terminate', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${id}`);
              Alert.alert('Success', 'Staff account removed');
              fetchStaff();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete staff member');
            }
          }
        }
      ]
    );
  };

  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      return Alert.alert('Error', 'Please fill in all required fields');
    }
    
    setSubmitting(true);
    try {
      await api.post('/admin/users', newStaff);
      Alert.alert('Success', 'New staff member created successfully');
      setModalVisible(false);
      setNewStaff({ name: '', email: '', role: 'warden', phoneNumber: '', password: '' });
      fetchStaff();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'warden': return Colors.roles.warden;
      case 'security': return Colors.roles.security;
      case 'financial': return Colors.roles.financial;
      default: return Colors.textMuted;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={{ width: 180, height: 100, marginBottom: 24 }} 
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.roles.warden} />
        <Text style={{ marginTop: 16, color: Colors.textMuted, fontWeight: '600' }}>Initializing Admin Panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.roles.warden]} />}
      >
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' }} 
          style={styles.header}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/admin/settings')}>
                 <View style={styles.avatarOuter}>
                   <View style={styles.avatar}>
                      {user?.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.profileImg} />
                      ) : (
                        <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
                      )}
                   </View>
                   <View style={styles.onlineBadge} />
                 </View>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.welcomeText}>System Administrator,</Text>
                <Text style={styles.nameText}>Admin Dashboard</Text>
              </View>
            </View>

            <View style={styles.tabToggle}>
              {(['overview', 'staff'] as const).map(tab => (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabBtnText, activeTab === tab && styles.activeTabBtnText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {activeTab === 'overview' ? (
            <>
              <View style={styles.statsGrid}>
                <StatCard 
                  title="Total Staff" 
                  value={stats.total} 
                  sub="Registered Personnel" 
                  icon={Users} 
                  color={Colors.roles.warden} 
                />
                <StatCard 
                  title="Wardens" 
                  value={stats.warden} 
                  sub="Hostel Management" 
                  icon={Briefcase} 
                  color={Colors.roles.warden} 
                />
                <StatCard 
                  title="Security" 
                  value={stats.security} 
                  sub="Site Safety" 
                  icon={ShieldCheck} 
                  color={Colors.roles.security} 
                />
                <StatCard 
                  title="Financial" 
                  value={stats.financial} 
                  sub="Accounting" 
                  icon={Check} 
                  color={Colors.roles.financial} 
                />
              </View>

              {/* System Management Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>System Management</Text>
                  <View style={styles.activeLabel}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeLabelText}>ACTIVE</Text>
                  </View>
                </View>
                
                <View style={styles.mgmtContainer}>
                  <ManagementCard 
                    title="Provision New Staff" 
                    subtitle="Create Warden, Security or Financial accounts"
                    icon={UserPlus}
                    color={Colors.roles.warden}
                    onPress={() => setModalVisible(true)}
                  />
                  <ManagementCard 
                    title="Identity & Access" 
                    subtitle="Manage staff permissions and credentials"
                    icon={Shield}
                    color="#F59E0B"
                    onPress={() => setActiveTab('staff')}
                  />
                  <ManagementCard 
                    title="System Audit Logs" 
                    subtitle="View historical changes and access logs"
                    icon={Activity}
                    color="#6366F1"
                    onPress={() => Alert.alert('Audit Logs', 'Comprehensive audit logs are available in the Desktop Administration portal.')}
                  />
                  <ManagementCard 
                    title="Platform Settings" 
                    subtitle="Configure global hostel parameters"
                    icon={Settings}
                    color="#10B981"
                    onPress={() => router.push('/admin/settings')}
                  />
                </View>
              </View>

              <View style={styles.infraCard}>
                <View style={styles.infraHeader}>
                  <Server size={20} color="#FFF" />
                  <Text style={styles.infraTitle}>Infrastructure Status</Text>
                </View>
                <View style={styles.infraGrid}>
                  <View style={styles.infraItem}>
                    <Text style={styles.infraLabel}>Backend API</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusName}>Operational</Text>
                    </View>
                  </View>
                  <View style={styles.infraDivider} />
                  <View style={styles.infraItem}>
                    <Text style={styles.infraLabel}>Database</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusName}>Stable</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.staffList}>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.roles.warden} style={{ marginTop: 40 }} />
              ) : staff.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={Colors.textMuted} opacity={0.3} />
                  <Text style={styles.emptyText}>No staff members found</Text>
                </View>
              ) : (
                staff.map((item) => (
                  <View key={item._id} style={styles.staffCard}>
                    <View style={styles.staffHeader}>
                      <View style={[styles.staffAvatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                        <Text style={[styles.avatarChar, { color: getRoleColor(item.role) }]}>
                          {item.name?.charAt(0) || 'U'}
                        </Text>
                      </View>
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{item.name}</Text>
                        <View style={styles.roleBadgeContainer}>
                          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '15' }]}>
                            <Text style={[styles.roleBadgeText, { color: getRoleColor(item.role) }]}>
                              {item.role?.toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Verified' ? '#10B98115' : '#F59E0B15' }]}>
                            <Text style={[styles.statusBadgeText, { color: item.status === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                              {item.status || 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteStaff(item._id, item.name)}>
                        <Trash2 size={20} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.staffDetails}>
                      <View style={styles.detailRow}>
                        <Mail size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>{item.email}</Text>
                      </View>
                      {item.phoneNumber && (
                        <View style={styles.detailRow}>
                          <Phone size={14} color={Colors.textMuted} />
                          <Text style={styles.detailText}>{item.phoneNumber}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.miniActionBtn, { borderColor: '#10B98130' }]}
                        onPress={() => handleUpdateStatus(item._id, 'Verified')}
                      >
                        <Check size={14} color="#10B981" />
                        <Text style={[styles.miniActionText, { color: '#10B981' }]}>Verify</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.miniActionBtn, { borderColor: '#F59E0B30' }]}
                        onPress={() => handleUpdateStatus(item._id, 'Pending')}
                      >
                        <ShieldCheck size={14} color="#F59E0B" />
                        <Text style={[styles.miniActionText, { color: '#F59E0B' }]}>Pending</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provision New Staff</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <UserCircle size={20} color={Colors.textMuted} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter staff name" 
                  value={newStaff.name}
                  onChangeText={t => setNewStaff({...newStaff, name: t})}
                />
              </View>

              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textMuted} />
                <TextInput 
                  style={styles.input} 
                  placeholder="staff@sliit.lk" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newStaff.email}
                  onChangeText={t => setNewStaff({...newStaff, email: t})}
                />
              </View>

              <Text style={styles.inputLabel}>Access Role</Text>
              <View style={styles.roleSelector}>
                {['warden', 'security', 'financial'].map((r) => (
                  <TouchableOpacity 
                    key={r}
                    style={[styles.roleOption, newStaff.role === r && { backgroundColor: getRoleColor(r), borderColor: getRoleColor(r) }]}
                    onPress={() => setNewStaff({...newStaff, role: r})}
                  >
                    <Text style={[styles.roleOptionText, newStaff.role === r && { color: '#FFF' }]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Temporary Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textMuted} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Min 6 characters" 
                  secureTextEntry
                  value={newStaff.password}
                  onChangeText={t => setNewStaff({...newStaff, password: t})}
                />
              </View>

              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={Colors.textMuted} />
                <TextInput 
                  style={styles.input} 
                  placeholder="07XXXXXXXX" 
                  keyboardType="number-pad"
                  value={newStaff.phoneNumber}
                  onChangeText={t => setNewStaff({...newStaff, phoneNumber: t})}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleCreateStaff}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <UserPlus size={20} color="#FFF" />
                    <Text style={styles.submitBtnText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 260, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 24, paddingTop: 60, justifyContent: 'space-between' },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  nameText: { fontSize: 26, fontWeight: '900', color: '#FFF', marginTop: 4 },
  profileBtn: { borderRadius: 30 },
  avatarOuter: { padding: 4, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 28, fontWeight: '900', color: Colors.roles.warden },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
  tabToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTabBtn: { backgroundColor: '#FFF' },
  tabBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  activeTabBtnText: { color: Colors.roles.warden },
  content: { marginTop: -20, backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: (width - 52) / 2, backgroundColor: Colors.surface, borderRadius: 24, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconContainer: { padding: 10, borderRadius: 12 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#10B98115', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  statContent: { gap: 2 },
  statValue: { fontSize: 24, fontWeight: '900', color: Colors.text },
  statTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  statSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  activeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B98110', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeLabelText: { fontSize: 10, fontWeight: '900', color: '#10B981' },

  mgmtContainer: { gap: 12 },
  mgmtCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: Colors.border, elevation: 1 },
  mgmtIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  mgmtTextContainer: { flex: 1 },
  mgmtTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  mgmtSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  mgmtArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  infraCard: { backgroundColor: Colors.roles.warden, borderRadius: 24, padding: 20, marginTop: 10 },
  infraHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  infraTitle: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  infraGrid: { flexDirection: 'row', alignItems: 'center' },
  infraItem: { flex: 1 },
  infraLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusName: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  infraDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },

  staffList: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, color: Colors.textMuted, fontWeight: '600' },
  staffCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, elevation: 1 },
  staffHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  staffAvatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarChar: { fontSize: 22, fontWeight: '800' },
  staffInfo: { flex: 1, marginLeft: 16 },
  staffName: { fontSize: 17, fontWeight: '800', color: Colors.text },
  roleBadgeContainer: { flexDirection: 'row', gap: 6, marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },
  staffDetails: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  detailText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  miniActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  miniActionText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalForm: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: Colors.text, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '600' },
  roleSelector: { flexDirection: 'row', gap: 10, marginTop: 8 },
  roleOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  roleOptionText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  submitBtn: { backgroundColor: Colors.roles.warden, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, marginTop: 32, gap: 12 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
