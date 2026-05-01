import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { User, Phone, Mail, Lock, Save, Camera, LogOut, ChevronRight, Bell, Shield } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import api from '../../services/api';

export default function StudentSettings() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    
    setLoading(true);
    try {
      const response = await api.put('/api/users/profile', { name });
      if (response.data.success) {
        setUser(response.data.data);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/');
      }}
    ]);
  };

  const SettingItem = ({ icon: Icon, label, value, onPress, color = Colors.text }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: color + '10' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      <ChevronRight size={18} color={Colors.border} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn}>
            <Camera size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileId}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.settingsGroup}>
          <SettingItem icon={User} label="Full Name" value={user?.name} color={Colors.roles.student} />
          <SettingItem icon={Phone} label="Contact Number" value={user?.phoneNumber || 'Add phone number'} color={Colors.roles.student} />
          <SettingItem icon={Mail} label="Email Address" value={user?.email} color={Colors.roles.student} />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Preferences</Text>
        <View style={styles.settingsGroup}>
          <SettingItem icon={Bell} label="Notifications" color={Colors.accent} />
          <SettingItem icon={Shield} label="Privacy & Security" color={Colors.secondary} />
          <SettingItem icon={Lock} label="Change Password" color={Colors.danger} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.version}>App Version 1.0.0 (Gold Release)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileSection: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 1 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 32, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.roles.student },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.roles.student, padding: 8, borderRadius: 12, borderWidth: 3, borderColor: '#FFF' },
  profileName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  profileId: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  section: { padding: 24, paddingBottom: 60 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  settingsGroup: { backgroundColor: Colors.surface, borderRadius: 24, overflow: 'hidden', elevation: 1 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.background },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingContent: { flex: 1, marginLeft: 16 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  settingValue: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 12, padding: 16 },
  logoutText: { fontSize: 16, fontWeight: '800', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 11, color: Colors.border, marginTop: 20, fontWeight: '700', letterSpacing: 0.5 },
});
