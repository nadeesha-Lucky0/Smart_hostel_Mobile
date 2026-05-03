import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Image,
  ImageBackground 
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { User, Mail, Lock, Phone, IdCard, CheckCircle } from 'lucide-react-native';
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
    <ImageBackground 
      source={require('../../assets/hostel_bg.jpg')} 
      style={styles.container}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  logo: { width: '80%', height: 100, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center', fontWeight: '600' },
  form: { backgroundColor: 'rgba(255,255,255,0.70)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(255,255,255,0.9)' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '700' },
  button: { backgroundColor: Colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  cancelLink: { marginTop: 32, marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.7)', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 32, elevation: 2 },
  cancelLinkText: { color: '#1F2937', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
