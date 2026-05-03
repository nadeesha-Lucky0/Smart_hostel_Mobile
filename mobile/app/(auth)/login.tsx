import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, Dimensions, SafeAreaView, Modal, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { Colors, Typography, Spacing } from '../../constants/Colors';

const { width } = Dimensions.get('window');

/**
 * LoginScreen Component
 * Professional login interface for the hostel management system.
 * Updated with standardized navigation paths.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext handles redirection to (tabs)
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    // Simulating API call
    setTimeout(() => {
      setForgotLoading(false);
      setForgotModal(false);
      Alert.alert('Success', 'If an account exists with this email, you will receive reset instructions.');
    }, 1500);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo & Welcome */}
          <View style={s.heroSection}>
            <Image 
              source={require('../../assets/images/idHsN22NWk_logos.png')} 
              style={s.logo} 
              resizeMode="contain" 
            />
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>Hostel Management System</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Student Email</Text>
              <View style={s.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="ITXXXXXXXX@my.sliit.lk"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <View style={s.row}>
                <Text style={s.label}>Password</Text>
                <TouchableOpacity onPress={() => setForgotModal(true)}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={Colors.textMuted} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[s.loginBtn, loading && s.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={s.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Reset Password</Text>
            <Text style={s.modalSubtitle}>Enter your student email to receive recovery instructions.</Text>
            <TextInput
              style={s.modalInput}
              placeholder="ITXXXXXXXX@my.sliit.lk"
              placeholderTextColor={Colors.textMuted}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setForgotModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.submitBtn} 
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  heroSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  logo: { width: 120, height: 120, marginBottom: Spacing.md },
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },

  form: { gap: Spacing.lg },
  inputGroup: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
  forgotText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: { flex: 1, color: '#fff', fontSize: Typography.base, marginLeft: 10 },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  footerText: { color: Colors.textMuted, fontSize: Typography.sm },
  signupText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24, gap: 16 },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  modalSubtitle: { fontSize: Typography.sm, color: Colors.textMuted, lineHeight: 20 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, height: 50, paddingHorizontal: 16, color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: Colors.textMuted, fontWeight: '600' },
  submitBtn: { flex: 1, height: 48, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});
