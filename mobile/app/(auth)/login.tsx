import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Image, ImageBackground } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Colors from '../../constants/Colors';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import api from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        await login(userData, token);
        router.replace('/');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials or server error';
      setError(msg);
      Alert.alert('Login Error', msg);
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
              <Text style={styles.title}>SLIIT Kandy Uni Hostel</Text>
              <Text style={styles.subtitle}>Smart Hostel Management System</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="itxxxxxxxx@my.sliit.lk"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textMuted} />
                  ) : (
                    <Eye size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
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
  logo: { width: '80%', height: 120, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4, fontWeight: '600' },
  form: { backgroundColor: 'rgba(255,255,255,0.70)', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', elevation: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#1F2937', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(255,255,255,0.9)' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '700' },
  errorText: { color: Colors.danger, marginTop: 12, fontSize: 14, textAlign: 'center', fontWeight: '700' },
  loginButton: { backgroundColor: Colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32, elevation: 4 },
  disabledButton: { opacity: 0.7 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  signupLink: { color: Colors.primary, fontWeight: '900', fontSize: 14, textDecorationLine: 'underline' },
});
