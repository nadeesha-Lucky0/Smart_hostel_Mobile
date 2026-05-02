import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { User, Mail, Lock, Phone, IdCard, ArrowRight, CheckCircle } from 'lucide-react-native';
import api from '../../services/api';

type Step = 'EMAIL' | 'OTP' | 'DETAILS';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState<Step>('EMAIL');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = async () => {
    if (!email || !email.includes('@my.sliit.lk')) {
      Alert.alert('Invalid Email', 'Please use your SLIIT student email (@my.sliit.lk)');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-signup-otp', { email });
      if (res.data.success) {
        setStep('OTP');
        Alert.alert('OTP Sent', 'Check your student email for the verification code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-signup-otp', { email, otp });
      if (res.data.success) {
        setStep('DETAILS');
        // Pre-fill student ID from email
        const id = email.split('@')[0].toUpperCase();
        setStudentId(id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !password || !studentId || !phoneNumber) {
      Alert.alert('Missing Fields', 'Please fill in all details.');
      return;
    }
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        studentId,
        phoneNumber
      });
      if (res.data.success) {
        Alert.alert('Success!', 'Registration complete. Please log in.');
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Student Signup</Text>
          <Text style={styles.subtitle}>
            {step === 'EMAIL' && 'Verify your student email to begin'}
            {step === 'OTP' && 'Enter the code sent to your email'}
            {step === 'DETAILS' && 'Complete your profile information'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'EMAIL' && (
            <>
              <Text style={styles.label}>Student Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="itxxxxxxxx@my.sliit.lk"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 'OTP' && (
            <>
              <Text style={styles.label}>6-Digit OTP</Text>
              <View style={styles.inputContainer}>
                <CheckCircle size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Verify Code</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('EMAIL')} style={styles.backLink}>
                <Text style={styles.backLinkText}>Change Email</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'DETAILS' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} />
              </View>

              <Text style={styles.label}>Student ID</Text>
              <View style={styles.inputContainer}>
                <IdCard size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput style={styles.input} placeholder="IT21XXXXXX" value={studentId} editable={false} />
              </View>

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  form: { backgroundColor: Colors.surface, padding: 24, borderRadius: 24, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F3F4F6' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  button: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: Colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
  cancelLink: { marginTop: 32, alignItems: 'center' },
  cancelLinkText: { color: Colors.textMuted, fontSize: 14 },
});
