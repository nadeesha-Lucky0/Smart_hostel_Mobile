import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Platform, Alert } from 'react-native';
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
  Camera
} from 'lucide-react-native';
import api from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

const DashboardCard = ({ title, value, color, icon: Icon, sub }: any) => (
  <View style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
    <View style={styles.cardHeader}>
      <Icon size={20} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardSub}>{sub}</Text>
  </View>
);

export default function StudentDashboard() {
  const { user, setUser } = useAuthStore();
  const [stats, setStats] = useState({ applicationStatus: 'Pending', payments: 'Up to date', lastEntry: 'N/A' });
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Mock or actual fetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

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

    if (!result.canceled) {
      handleUpload(result.assets[0].uri);
    }
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
            Alert.alert(
              'Remove Picture',
              'Are you sure you want to remove your profile picture?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', onPress: removeImage, style: 'destructive' }
              ]
            );
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
      Alert.alert('Success', 'Profile picture removed successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (uri: string) => {
    setUploading(true);
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: filename,
      type,
    } as any);

    try {
      const response = await api.put('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        // Update local auth store with new picture URL
        setUser({ ...user, profilePicture: response.data.profilePicture } as any);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Server error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Colors.roles.student} 
        />
      }
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
               <Text style={styles.idBadgeText}>ACTIVE RESIDENT</Text>
             </View>
             <Text style={styles.idWing}>MALE WING</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <DashboardCard 
            title="Application" 
            value={stats.applicationStatus} 
            color={Colors.roles.student} 
            icon={CheckCircle}
            sub="Hostel Registration"
          />
          <DashboardCard 
            title="Finance" 
            value="Rs. 0" 
            color={Colors.primary} 
            icon={Calendar}
            sub="Current Balance"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notices</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Bell size={20} color={Colors.accent} />
          </View>
          <View style={styles.noticeBody}>
            <Text style={styles.noticeTitle}>Emergency Maintenance</Text>
            <Text style={styles.noticeTime}>2 hours ago • Warden Office</Text>
          </View>
          <ArrowRight size={18} color={Colors.border} />
        </TouchableOpacity>

        <View style={styles.quickEntrySection}>
          <Text style={styles.sectionTitle}>Movement Summary</Text>
          <View style={styles.entryCard}>
             <MapPin size={24} color={Colors.roles.student} />
             <View style={styles.entryInfo}>
               <Text style={styles.entryStatus}>Currently: INSIDE HOSTEL</Text>
               <Text style={styles.entryTime}>Last update: Today, 08:30 AM</Text>
             </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingBottom: 0, paddingTop: 60 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerInfo: { marginLeft: 16 },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.text },
  avatarOuter: { padding: 4, borderRadius: 40, borderWidth: 2, borderColor: Colors.roles.student + '40' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.roles.student },
  activeBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
  profileBtn: { padding: 2 },
  idCard: { backgroundColor: Colors.roles.student, borderRadius: 24, padding: 20, elevation: 8, shadowColor: Colors.roles.student, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  idHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idName: { fontSize: 18, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  idRoll: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  idBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  idBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  idWing: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  content: { padding: 24 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  card: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  cardValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  viewAll: { fontSize: 12, fontWeight: '700', color: Colors.roles.student },
  noticeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 1 },
  noticeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, marginLeft: 16 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  noticeTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  quickEntrySection: { marginTop: 32 },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: Colors.border },
  entryInfo: { flex: 1 },
  entryStatus: { fontSize: 14, fontWeight: '800', color: Colors.text },
  entryTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
});
