import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { 
  Bell, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  User,
  ShieldAlert,
  Camera,
  QrCode,
  CreditCard,
  Layers,
  Clock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const DashboardCard = ({ title, value, color, icon: Icon, sub, isLoading }: any) => (
  <View style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
    <View style={styles.cardHeader}>
      <Icon size={18} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {isLoading ? (
      <ActivityIndicator size="small" color={color} style={{ marginVertical: 8, alignSelf: 'flex-start' }} />
    ) : (
      <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
    )}
    <Text style={styles.cardSub}>{sub}</Text>
  </View>
);

export default function StudentDashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false); // RESTORED
  const [recentNotice, setRecentNotice] = useState<any>(null);
  
  // Dashboard Stats
  const [appStatus, setAppStatus] = useState('Pending');
  const [refundAmount, setRefundAmount] = useState('0.00');
  const [wing, setWing] = useState('NOT ASSIGNED');
  const [roomInfo, setRoomInfo] = useState('N/A');

  const fetchDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      // 1. Fetch Application Status
      try {
        const appRes = await api.get('/applications/me');
        if (appRes.data && !appRes.data.error) {
          setAppStatus(appRes.data.applicationStatus || 'Pending');
          if (appRes.data.studentWing) setWing(appRes.data.studentWing.toUpperCase() + ' WING');
        }
      } catch (e) {}

      // 2. Fetch Allocation / Room Info
      try {
        const allocRes = await api.get('/allocations/me');
        if (allocRes.data?.success && allocRes.data.data) {
          const a = allocRes.data.data;
          setRoomInfo(`${a.studentWing === 'female' ? 'F' : 'M'}${a.roomnumber} · Bed ${a.bedId}`);
          setWing(a.studentWing.toUpperCase() + ' WING');
        }
      } catch (e) {}

      // 3. Fetch Refund Amount from StudentPayment
      try {
        if (user?.studentId) {
            const payRes = await api.get(`/student-payments/${user.studentId}`);
            if (payRes.data && payRes.data.refundPayment) {
                const amount = payRes.data.refundPayment.amount || 0;
                setRefundAmount(amount.toLocaleString('en-LK', { minimumFractionDigits: 2 }));
            }
        }
      } catch (e) {}

      // 4. Fetch Recent Notice
      try {
        const noticeRes = await api.get('/notices');
        const list = Array.isArray(noticeRes.data) ? noticeRes.data : noticeRes.data?.data ?? [];
        if (list.length > 0) setRecentNotice(list[0]);
      } catch (e) {}

    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need camera roll permissions to upload your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) handleUpload(result.assets[0].uri);
  };

  const handleProfilePicPress = () => {
    Alert.alert(
      'Profile Picture',
      'Would you like to update or remove your profile picture?',
      [
        { text: 'Update Picture', onPress: pickImage },
        { 
          text: 'Remove Picture', 
          onPress: () => {
            Alert.alert('Remove Picture', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', onPress: removeImage, style: 'destructive' }
            ]);
          }, 
          style: 'destructive' 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = async () => {
    setUploading(true);
    try {
      await api.delete('/users/profile-picture');
      setUser({ ...user, profilePicture: undefined } as any);
      Alert.alert('Success', 'Profile picture removed');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to remove profile picture');
    } finally { setUploading(false); }
  };

  const handleUpload = async (uri: string) => {
    setUploading(true);
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;
    formData.append('file', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: filename, type } as any);
    try {
      const response = await api.put('/users/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setUser({ ...user, profilePicture: response.data.profilePicture } as any);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error: any) { Alert.alert('Upload Failed', error.response?.data?.message || 'Server error'); } finally { setUploading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.flex} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.roles.student} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.profileBtn} onPress={handleProfilePicPress} disabled={uploading}>
               <View style={styles.avatarOuter}>
                 <View style={styles.avatar}>
                    {user?.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
                    )}
                 </View>
                 <View style={styles.activeBadge} />
               </View>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Good Morning,</Text>
              <Text style={styles.name}>{user?.name || 'Student'}</Text>
            </View>
          </View>

          <View style={styles.idCard}>
            <View style={styles.idHeader}>
              <Text style={styles.idName}>{user?.name}</Text>
              <ShieldAlert size={18} color="#FFF" opacity={0.8} />
            </View>
            <Text style={styles.idRoll}>{user?.email}</Text>
            <View style={styles.idFooter}>
               <View style={styles.idBadge}>
                 <Text style={styles.idBadgeText}>{roomInfo === 'N/A' ? 'PENDING ALLOCATION' : 'ACTIVE RESIDENT'}</Text>
               </View>
               <Text style={styles.idWing}>{wing}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <DashboardCard 
              title="Application" 
              value={appStatus} 
              color={Colors.roles.student} 
              icon={CheckCircle}
              sub="Registration Status"
              isLoading={loading}
            />
            <DashboardCard 
              title="Refund" 
              value={`Rs. ${refundAmount}`} 
              color="#0ea5e9" 
              icon={CreditCard}
              sub="Refundable Deposit"
              isLoading={loading}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            <TouchableOpacity onPress={() => router.push('/student/applications')}>
              <Text style={styles.viewAll}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roomCard}>
            <View style={styles.roomIcon}>
              <Layers size={22} color={Colors.roles.student} />
            </View>
            <View style={styles.roomBody}>
               <Text style={styles.roomLabel}>Your Allocation</Text>
               <Text style={styles.roomValue}>{roomInfo}</Text>
            </View>
            <View style={[styles.roomBadge, { backgroundColor: roomInfo === 'N/A' ? '#f59e0b20' : '#10b98120' }]}>
               <Text style={[styles.roomBadgeText, { color: roomInfo === 'N/A' ? '#f59e0b' : '#10b981' }]}>
                  {roomInfo === 'N/A' ? 'Waiting' : 'Occupied'}
               </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notices</Text>
            <TouchableOpacity onPress={() => router.push('/student/notices')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentNotice ? (
            <TouchableOpacity style={styles.noticeCard} onPress={() => router.push('/student/notices')}>
              <View style={styles.noticeIcon}>
                <Bell size={20} color={Colors.roles.student} />
              </View>
              <View style={styles.noticeBody}>
                <Text style={styles.noticeTitle} numberOfLines={1}>{recentNotice.title}</Text>
                <Text style={styles.noticeTime}>
                  {new Date(recentNotice.createdAt).toLocaleDateString()} • {recentNotice.createdBy?.name || 'Warden'}
                </Text>
              </View>
              <ArrowRight size={18} color={Colors.border} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyNotice}>
               <Clock size={20} color={Colors.textMuted} />
               <Text style={styles.emptyNoticeText}>No recent notices</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  header: { padding: 24, paddingBottom: 0, paddingTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerInfo: { marginLeft: 16 },
  greeting: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  avatarOuter: { padding: 4, borderRadius: 40, borderWidth: 2, borderColor: Colors.roles.student + '40' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.roles.student },
  activeBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
  profileBtn: { padding: 2 },
  idCard: { backgroundColor: Colors.roles.student, borderRadius: 24, padding: 20, elevation: 8, shadowColor: Colors.roles.student, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  idHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idName: { fontSize: 18, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  idRoll: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '700' },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  idBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  idBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.8 },
  idWing: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  content: { padding: 24 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  card: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 10, fontWeight: '900', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 17, fontWeight: '900', color: '#1e293b' },
  cardSub: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  viewAll: { fontSize: 12, fontWeight: '700', color: Colors.roles.student },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 24, elevation: 1, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: Colors.roles.student },
  roomIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center' },
  roomBody: { flex: 1, marginLeft: 16 },
  roomLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  roomValue: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  roomBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roomBadgeText: { fontSize: 10, fontWeight: '900' },
  noticeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 24, elevation: 1 },
  noticeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, marginLeft: 16 },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  noticeTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  emptyNotice: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10, backgroundColor: Colors.surface, borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.border },
  emptyNoticeText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted }
});
