import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import Colors from '../../constants/Colors';
import { User, Phone, Lock, Save, Camera, X, Check, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function SecuritySettings() {
  const { user, token, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  // Phone Update State
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneState, setPhoneState] = useState({ step: 'form', newPhone: '', otp: '', loading: false });

  // Password Update State
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [pwdState, setPwdState] = useState({ step: 'form', newPwd: '', confirmPwd: '', otp: '', loading: false });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type,
    } as any);

    setLoading(true);
    try {
      const response = await api.put('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setUser({ ...user, profilePicture: response.data.profilePicture });
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    
    setLoading(true);
    try {
      const response = await api.put('/users/profile', { name });

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

  // --- Phone Update Logic ---
  const requestPhoneOTP = async () => {
    if (!/^\d{10}$/.test(phoneState.newPhone)) {
      return Alert.alert('Invalid Input', 'Enter a valid 10-digit number');
    }
    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/auth/request-phone-update', { newPhone: phoneState.newPhone });
      if (res.data.success) {
        Alert.alert('Success', 'OTP sent to new number!');
        setPhoneState(prev => ({ ...prev, step: 'otp' }));
      } else {
        Alert.alert('Error', res.data.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Connection error');
    } finally {
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyPhoneOTP = async () => {
    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/auth/verify-phone-update', { otp: phoneState.otp });
      if (res.data.success) {
        Alert.alert('Success', 'Phone number updated!');
        setPhoneState({ step: 'success', newPhone: '', otp: '', loading: false });
        // Optionally refresh user here, assuming setUser will be used or they re-login
        // We might need a generic refresh, but for now just updating the state might not auto-refresh unless authStore has it
      } else {
        Alert.alert('Error', res.data.message || 'Verification failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Connection error');
    } finally {
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  // --- Password Update Logic ---
  const requestPwdOTP = async () => {
    if (pwdState.newPwd !== pwdState.confirmPwd) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (pwdState.newPwd.length < 6) {
      return Alert.alert('Error', 'Min. 6 characters required');
    }
    if (!user?.phoneNumber) {
      return Alert.alert('Error', 'Please add a phone number first to receive security OTPs.');
    }

    setPwdState(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/auth/forgot-password', { 
        email: user.email, 
        newPassword: pwdState.newPwd, 
        confirmPassword: pwdState.confirmPwd 
      });
      if (res.data.success) {
        Alert.alert('Success', res.data.message || 'OTP Sent');
        setPwdState(prev => ({ ...prev, step: 'otp' }));
      } else {
        Alert.alert('Error', res.data.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Connection error');
    } finally {
      setPwdState(prev => ({ ...prev, loading: false }));
    }
  };

  const verifyPwdOTP = async () => {
    setPwdState(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.post('/auth/reset-password', { 
        email: user?.email, 
        otp: pwdState.otp 
      });
      if (res.data.success) {
        Alert.alert('Success', 'Password updated successfully!');
        setPwdState({ step: 'success', newPwd: '', confirmPwd: '', otp: '', loading: false });
      } else {
        Alert.alert('Error', res.data.message || 'Verification failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Connection error');
    } finally {
      setPwdState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={loading}>
            <View style={styles.avatar}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.profileImg} />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
              )}
            </View>
            <View style={styles.cameraBtn}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
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
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputContainer, styles.disabledInput]}>
            <Phone size={20} color={Colors.textMuted} />
            <Text style={styles.inputText}>{user?.phoneNumber || 'Not provided'}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setPhoneModalVisible(true)}>
              <Text style={styles.linkText}>{user?.phoneNumber ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputContainer, styles.disabledInput]}>
            <Lock size={20} color={Colors.textMuted} />
            <Text style={styles.inputText}>••••••••••••</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setPwdModalVisible(true)}>
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

      {/* Phone Update Modal */}
      <Modal visible={phoneModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Phone Number</Text>
              <TouchableOpacity onPress={() => {
                setPhoneModalVisible(false);
                setPhoneState({ step: 'form', newPhone: '', otp: '', loading: false });
              }}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {phoneState.step === 'form' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Enter your new 10-digit mobile number.</Text>
                <View style={styles.modalInputContainer}>
                  <Phone size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 07XXXXXXXX"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phoneState.newPhone}
                    onChangeText={t => setPhoneState(prev => ({ ...prev, newPhone: t.replace(/\D/g, '') }))}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.modalActionBtn, phoneState.loading && styles.disabledBtn]}
                  onPress={requestPhoneOTP}
                  disabled={phoneState.loading}
                >
                  {phoneState.loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionBtnText}>Request OTP Code</Text>}
                </TouchableOpacity>
              </View>
            )}

            {phoneState.step === 'otp' && (
              <View style={styles.modalBody}>
                <View style={styles.otpNotice}>
                  <Text style={styles.otpNoticeTitle}>Verification Sent</Text>
                  <Text style={styles.otpNoticeText}>Code sent to {phoneState.newPhone}</Text>
                </View>
                <Text style={styles.modalSubtitle}>Enter 6-Digit Code</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000 000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={phoneState.otp}
                  onChangeText={t => setPhoneState(prev => ({ ...prev, otp: t.replace(/\D/g, '') }))}
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalBackBtn} onPress={() => setPhoneState(prev => ({ ...prev, step: 'form' }))}>
                    <Text style={styles.modalBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalActionBtn, { flex: 1, marginTop: 0 }, phoneState.loading && styles.disabledBtn]}
                    onPress={verifyPhoneOTP}
                    disabled={phoneState.loading}
                  >
                    {phoneState.loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionBtnText}>Verify & Update</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {phoneState.step === 'success' && (
              <View style={styles.successBody}>
                <View style={styles.successIconBox}>
                  <Check size={32} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Identity Updated</Text>
                <Text style={styles.successText}>Your phone number has been updated successfully.</Text>
                <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setPhoneModalVisible(false);
                    setPhoneState({ step: 'form', newPhone: '', otp: '', loading: false });
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Update Modal */}
      <Modal visible={pwdModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => {
                setPwdModalVisible(false);
                setPwdState({ step: 'form', newPwd: '', confirmPwd: '', otp: '', loading: false });
              }}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {pwdState.step === 'form' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Create a new password (min. 6 characters).</Text>
                
                <View style={styles.modalInputContainer}>
                  <Lock size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="New Password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPwd}
                    value={pwdState.newPwd}
                    onChangeText={t => setPwdState(prev => ({ ...prev, newPwd: t }))}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalInputContainer, { marginTop: 12 }]}>
                  <Lock size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirm Password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showConfirm}
                    value={pwdState.confirmPwd}
                    onChangeText={t => setPwdState(prev => ({ ...prev, confirmPwd: t }))}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.modalActionBtn, pwdState.loading && styles.disabledBtn]}
                  onPress={requestPwdOTP}
                  disabled={pwdState.loading}
                >
                  {pwdState.loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionBtnText}>Authorize Password Reset</Text>}
                </TouchableOpacity>
              </View>
            )}

            {pwdState.step === 'otp' && (
              <View style={styles.modalBody}>
                <View style={[styles.otpNotice, { backgroundColor: Colors.roles.security + '10', borderColor: Colors.roles.security + '30' }]}>
                  <Text style={[styles.otpNoticeTitle, { color: Colors.roles.security }]}>Authorization Required</Text>
                  <Text style={styles.otpNoticeText}>Security code sent to your mobile.</Text>
                </View>
                <Text style={styles.modalSubtitle}>Enter Security Code</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000 000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pwdState.otp}
                  onChangeText={t => setPwdState(prev => ({ ...prev, otp: t.replace(/\D/g, '') }))}
                />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalBackBtn} onPress={() => setPwdState(prev => ({ ...prev, step: 'form' }))}>
                    <Text style={styles.modalBackBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalActionBtn, { flex: 1, marginTop: 0, backgroundColor: Colors.roles.security }, pwdState.loading && styles.disabledBtn]}
                    onPress={verifyPwdOTP}
                    disabled={pwdState.loading}
                  >
                    {pwdState.loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalActionBtnText}>Update Access</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {pwdState.step === 'success' && (
              <View style={styles.successBody}>
                <View style={styles.successIconBox}>
                  <Check size={32} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Security Updated</Text>
                <Text style={styles.successText}>Your password has been changed successfully.</Text>
                <TouchableOpacity 
                  style={[styles.modalActionBtn, { backgroundColor: Colors.roles.security }]}
                  onPress={() => {
                    setPwdModalVisible(false);
                    setPwdState({ step: 'form', newPwd: '', confirmPwd: '', otp: '', loading: false });
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileSection: { alignItems: 'center', padding: 40, backgroundColor: Colors.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 2 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 32, backgroundColor: Colors.roles.security + '20', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.roles.security },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.roles.security, padding: 8, borderRadius: 12, borderWidth: 3, borderColor: '#FFF' },
  emailText: { fontSize: 14, color: Colors.textMuted, marginTop: 16, fontWeight: '600' },
  form: { padding: 24, paddingBottom: 100 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '600' },
  inputText: { flex: 1, fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  disabledInput: { backgroundColor: Colors.background + '80' },
  linkBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.roles.security + '10', borderRadius: 8 },
  linkText: { fontSize: 12, fontWeight: '700', color: Colors.roles.security },
  saveBtn: { backgroundColor: Colors.roles.security, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, marginTop: 40, gap: 12, elevation: 4, shadowColor: Colors.roles.security, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalBody: { flex: 1 },
  modalSubtitle: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 16 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  modalInput: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '600' },
  modalActionBtn: { backgroundColor: Colors.roles.security, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32 },
  modalActionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  otpNotice: { backgroundColor: '#6366F110', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#6366F130', marginBottom: 24 },
  otpNoticeTitle: { fontSize: 12, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase', marginBottom: 4 },
  otpNoticeText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  otpInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, fontSize: 32, fontWeight: '900', color: Colors.text, textAlign: 'center', letterSpacing: 8 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  modalBackBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, padding: 18, borderRadius: 16, alignItems: 'center', paddingHorizontal: 24 },
  modalBackBtnText: { color: Colors.textMuted, fontSize: 16, fontWeight: '700' },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B98120', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', fontWeight: '500', marginBottom: 32 },
});
