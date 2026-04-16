import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { User, Phone, Lock, Save, Camera } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function WardenSettings() {
  const { user, token, setUser } = useAuthStore();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'W'}</Text>
          </View>
          <TouchableOpacity style={styles.cameraBtn}>
            <Camera size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <User size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Phone size={20} color={Colors.textMuted} />
          <Text style={styles.inputText}>{user?.phoneNumber || 'Not provided'}</Text>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Lock size={20} color={Colors.textMuted} />
          <Text style={styles.inputText}>••••••••••••</Text>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Change</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.disabledBtn]} 
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileSection: { alignItems: 'center', padding: 40, backgroundColor: Colors.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 2 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 32, backgroundColor: Colors.roles.warden + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.roles.warden },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.roles.warden, padding: 8, borderRadius: 12, borderWidth: 3, borderColor: '#FFF' },
  emailText: { fontSize: 14, color: Colors.textMuted, marginTop: 16, fontWeight: '600' },
  form: { padding: 24, paddingBottom: 100 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '600' },
  inputText: { flex: 1, fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  disabledInput: { backgroundColor: Colors.background + '80' },
  linkBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.roles.warden + '10', borderRadius: 8 },
  linkText: { fontSize: 12, fontWeight: '700', color: Colors.roles.warden },
  saveBtn: { backgroundColor: Colors.roles.warden, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, marginTop: 40, gap: 12, elevation: 4, shadowColor: Colors.roles.warden, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
