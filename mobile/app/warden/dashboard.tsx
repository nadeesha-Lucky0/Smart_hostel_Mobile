import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, 
  ActivityIndicator, RefreshControl, ImageBackground, Image 
} from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  Home, 
  Bed, 
  Users, 
  FileCheck, 
  ChevronRight,
  TrendingUp,
  Activity,
  UserCheck,
  CreditCard,
  LogOut,
  MapPin,
  Clock,
  ArrowUpRight,
  Layout
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
  <View style={[styles.statCard]}>
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

const QuickAction = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Icon size={24} color={color} />
    </View>
    <View style={styles.actionTextContainer}>
      <Text style={styles.actionTitle}>{title}</Text>
      {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
    </View>
    <ArrowUpRight size={14} color={Colors.textMuted} style={styles.actionArrow} />
  </TouchableOpacity>
);

export default function WardenDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeWing, setActiveWing] = useState<'all' | 'male' | 'female'>('all');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
        <Text style={{ marginTop: 16, color: Colors.textMuted, fontWeight: '600' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  const currentStats = stats ? (activeWing === 'all' ? stats : (activeWing === 'male' ? stats.maleStats : stats.femaleStats)) : null;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.roles.warden]} />}
    >
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' }} 
        style={styles.header}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/warden/settings')}>
               <View style={styles.avatarOuter}>
                 <View style={styles.avatar}>
                    {user?.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} style={styles.profileImg} />
                    ) : (
                      <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'W'}</Text>
                    )}
                 </View>
                 <View style={styles.onlineBadge} />
               </View>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>Warden Panel</Text>
            </View>
          </View>

          <View style={styles.wingToggle}>
            {(['all', 'male', 'female'] as const).map(wing => (
              <TouchableOpacity 
                key={wing} 
                style={[styles.wingBtn, activeWing === wing && styles.activeWingBtn]}
                onPress={() => setActiveWing(wing)}
              >
                <Text style={[styles.wingBtnText, activeWing === wing && styles.activeWingBtnText]}>
                  {wing.charAt(0).toUpperCase() + wing.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Students" 
            value={currentStats?.totalStudents || 0} 
            sub={`Inside: ${currentStats?.studentsInside || 0}`} 
            icon={Users} 
            color={Colors.roles.warden} 
            trend="+12%"
          />
          <StatCard 
            title="Room Status" 
            value={currentStats?.activeRooms || 0} 
            sub={`of ${currentStats?.totalRooms || 0} Rooms`} 
            icon={Home} 
            color="#10B981" 
          />
          <StatCard 
            title="Bed Availability" 
            value={currentStats?.availableBeds || 0} 
            sub={`${currentStats?.occupancyRate || 0}% Occupied`} 
            icon={Bed} 
            color="#F59E0B" 
          />
          <StatCard 
            title="Pending Actions" 
            value={(currentStats?.paymentWaiting || 0) + (currentStats?.readyToActivate || 0)} 
            sub="Requires Review" 
            icon={FileCheck} 
            color="#EF4444" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Management</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
            <QuickAction 
              title="Activate Profiles" 
              subtitle="Manage student status"
              icon={UserCheck} 
              color={Colors.roles.warden} 
              onPress={() => router.push('/warden/profiles')}
            />
            <QuickAction 
              title="Payment Review" 
              subtitle="Verify monthly dues"
              icon={CreditCard} 
              color="#10B981" 
              onPress={() => router.push('/warden/payment')}
            />
            <QuickAction 
              title="Room Allocation" 
              subtitle="Assign rooms & beds"
              icon={Layout} 
              color="#F59E0B" 
              onPress={() => router.push('/warden/allocations')}
            />
            <QuickAction 
              title="Floor & Room" 
              subtitle="Manage hostel layout"
              icon={Home} 
              color="#6366F1" 
              onPress={() => router.push('/warden/allocations')} // Assuming this goes to allocations or similar
            />
            <QuickAction 
              title="Hostel Notices" 
              subtitle="Broadcast announcements"
              icon={Activity} 
              color={Colors.accent} 
              onPress={() => router.push('/warden/notices')}
            />
            <QuickAction 
              title="Student Logs" 
              subtitle="Entry & exit history"
              icon={Clock} 
              color={Colors.textMuted} 
              onPress={() => router.push('/warden/records')}
            />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movement Status</Text>
            <View style={styles.liveBadge}>
               <View style={styles.liveDot} />
               <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.movementCard}>
            <View style={styles.movementItem}>
              <View style={[styles.mIcon, { backgroundColor: '#10B98120' }]}>
                <Clock size={20} color="#10B981" />
              </View>
              <View style={styles.mInfo}>
                <Text style={styles.mLabel}>Students Inside</Text>
                <Text style={styles.mValue}>{currentStats?.studentsInside || 0}</Text>
              </View>
            </View>
            <View style={styles.mDivider} />
            <View style={styles.movementItem}>
              <View style={[styles.mIcon, { backgroundColor: '#F59E0B20' }]}>
                <LogOut size={20} color="#F59E0B" />
              </View>
              <View style={styles.mInfo}>
                <Text style={styles.mLabel}>Students Outside</Text>
                <Text style={styles.mValue}>{currentStats?.studentsOutside || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Entry/Exit Log</Text>
            <TouchableOpacity onPress={() => router.push('/warden/outside')}>
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.actionCardFull} 
            onPress={() => router.push('/warden/outside')}
          >
             <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
               <Users size={24} color="#3B82F6" />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={styles.actionTitle}>Outside & Late Students</Text>
               <Text style={styles.actionSub}>Monitor students currently outside</Text>
             </View>
             <ChevronRight size={20} color={Colors.border} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent System Activity</Text>
            <TouchableOpacity onPress={() => router.push('/warden/records')}>
              <Text style={styles.viewAllText}>View History</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityFeed}>
            <View style={styles.emptyActivity}>
               <Activity size={32} color={Colors.border} />
               <Text style={styles.emptyActivityText}>No recent activities to show</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 260, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 24, paddingTop: 60, justifyContent: 'space-between' },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  nameText: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 4 },
  profileBtn: { borderRadius: 30 },
  avatarOuter: { padding: 4, borderRadius: 40, borderWidth: 2, borderColor: Colors.roles.warden + '40' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.roles.warden },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
  wingToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 4 },
  wingBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeWingBtn: { backgroundColor: '#FFF' },
  wingBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  activeWingBtnText: { color: Colors.roles.warden },
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
  viewAllText: { fontSize: 14, fontWeight: '700', color: Colors.roles.warden },
  actionsRow: { gap: 12 },
  actionCard: { width: 180, backgroundColor: Colors.surface, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginRight: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionTextContainer: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  actionSubtitle: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  actionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  actionArrow: { marginLeft: 4 },
  actionCardFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
  movementCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  movementItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mInfo: { gap: 2 },
  mLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  mValue: { fontSize: 20, fontWeight: '900', color: Colors.text },
  mDivider: { width: 1, height: 40, backgroundColor: Colors.border, marginHorizontal: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EF444410', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
  activityFeed: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20 },
  emptyActivity: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
  emptyActivityText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
});
