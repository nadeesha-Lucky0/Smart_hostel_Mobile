import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, Dimensions, SafeAreaView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/Colors';
import { authAPI } from '../../services/api';

const { width } = Dimensions.get('window');

/**
 * SignupScreen Component
 * Professional registration interface for the hostel management system.
 * Updated with standardized navigation paths.
 */
export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    phoneNumber: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const validateEmail = (email: string) => {
    const studentEmailRegex = /^[a-zA-Z]{2}\d{8}@my\.sliit\.lk$/i;
    return studentEmailRegex.test(email);
  };

  const handleSendOtp = async () => {
    setError('');
    if (!validateEmail(formData.email)) {
      setError('Please use official SLIIT email (e.g. IT21234567@my.sliit.lk)');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authAPI.sendSignupOtp(formData.email);
      if (res.data.success) {
        setOtpSent(true);
        setOtp('');
        Alert.alert("Success", "Verification code sent to your email.");
      } else {
        setError(res.data.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authAPI.verifySignupOtp(formData.email, otp);
      if (res.data.success) {
        setEmailVerified(true);
        Alert.alert("Verified", "Your email has been verified successfully.");
      } else {
        setError(res.data.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    if (!emailVerified) {
      setError('Please verify your email first');
      setLoading(false);
      return;
    }

    const emailPrefix = formData.email.split('@')[0].toUpperCase();
    if (formData.studentId.toUpperCase() !== emailPrefix) {
      setError(`Student ID must match email prefix (${emailPrefix})`);
      setLoading(false);
      return;
    }

    if (formData.phoneNumber.length !== 10 || !/^\d+$/.test(formData.phoneNumber)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.register(formData);
      if (res.data.success) {
        Alert.alert("Account Created", "Welcome to SLIIT Kandy Hostel Portal!", [
          { text: "OK", onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <Text style={s.title}>Join SLIIT Kandy</Text>
            <Text style={s.subtitle}>Hostel Management System</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>FULL NAME</Text>
              <View style={s.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Kamal Perera"
                  placeholderTextColor={Colors.textMuted}
                  value={formData.name}
                  onChangeText={(val) => setFormData({ ...formData, name: val })}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>PHONE NUMBER</Text>
              <View style={s.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="0712345678"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChangeText={(val) => setFormData({ ...formData, phoneNumber: val })}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>STUDENT ID</Text>
              <View style={s.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="IT21000000"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  value={formData.studentId}
                  onChangeText={(val) => setFormData({ ...formData, studentId: val.toUpperCase() })}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <View style={[s.inputWrapper, emailVerified && s.inputVerified]}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { paddingRight: 80 }]}
                  placeholder="it21000000@my.sliit.lk"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!emailVerified}
                  value={formData.email}
                  onChangeText={(val) => setFormData({ ...formData, email: val })}
                />
                {!emailVerified && (
                  <TouchableOpacity
                    style={s.verifyTag}
                    onPress={handleSendOtp}
                    disabled={otpLoading || !formData.email}
                  >
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.verifyTagText}>{otpSent ? 'RESEND' : 'VERIFY'}</Text>
                    )}
                  </TouchableOpacity>
                )}
                {emailVerified && (
                  <View style={s.verifiedIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  </View>
                )}
              </View>
            </View>

            {otpSent && !emailVerified && (
              <View style={[s.inputGroup, s.otpIn]}>
                <Text style={[s.label, { color: Colors.primary }]}>VERIFICATION CODE</Text>
                <View style={s.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, s.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <TouchableOpacity
                    style={[s.verifyTag, { backgroundColor: Colors.success }]}
                    onPress={handleVerifyOtp}
                    disabled={otpLoading || otp.length !== 6}
                  >
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.verifyTagText}>SUBMIT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {emailVerified && (
              <>
                <View style={s.inputGroup}>
                  <Text style={s.label}>PASSWORD</Text>
                  <View style={s.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(val) => setFormData({ ...formData, password: val })}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.label}>CONFIRM PASSWORD</Text>
                  <View style={s.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showConfirm}
                      value={formData.confirmPassword}
                      onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {error ? <Text style={s.errorTxt}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.mainBtn, (!emailVerified || loading) && s.mainBtnDisabled]}
              onPress={handleSignup}
              disabled={loading || !emailVerified}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.mainBtnText}>{emailVerified ? 'CREATE ACCOUNT' : 'VERIFY EMAIL FIRST'}</Text>
              )}
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={s.footerLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  heroSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.lg },
  logo: { width: 100, height: 100, marginBottom: Spacing.md },
  title: { fontSize: Typography['2xl'], fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },

  form: { gap: Spacing.md },
  inputGroup: { gap: 8 },
  label: { fontSize: Typography.xs, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputVerified: { borderColor: Colors.success + '80' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  eyeBtn: { padding: 8 },

  verifyTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    position: 'absolute',
    right: 12,
  },
  verifyTagText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  verifiedIcon: { position: 'absolute', right: 12 },

  otpIn: { marginTop: 4, transform: [{ scale: 1.02 }] },
  otpInput: { letterSpacing: 4, fontWeight: '900', color: Colors.primary },

  errorTxt: { color: Colors.danger, textAlign: 'center', fontWeight: '800', fontSize: 13, backgroundColor: Colors.danger + '15', padding: 12, borderRadius: 12 },

  mainBtn: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnDisabled: { opacity: 0.5 },
  mainBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingBottom: 40 },
  footerText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '900' },
});
