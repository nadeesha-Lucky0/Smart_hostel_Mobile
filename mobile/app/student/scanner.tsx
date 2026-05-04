import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { X, ShieldCheck, MapPin, ArrowRightLeft } from 'lucide-react-native';

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();

  // Form state
  const [action, setAction] = useState<'entry' | 'exit'>('exit');
  const [pin, setPin] = useState('');
  const [destination, setDestination] = useState('');
  const [goingHome, setGoingHome] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    if (data && data.startsWith('GATE_ACCESS:')) {
      const extractedPin = data.split(':')[1];
      if (extractedPin && extractedPin.length === 4) {
        setPin(extractedPin);
        setShowForm(true);
      } else {
        Alert.alert('Invalid QR Code', 'The scanned QR code is invalid.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } else {
      Alert.alert('Invalid QR Code', 'Please scan a valid Gate Access QR code.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!pin || pin.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit security PIN.');
      return;
    }
    if (action === 'exit' && !destination && !goingHome) {
      Alert.alert('Error', 'Please enter your destination or mark going home.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        studentId: user?.studentId || user?.email?.split('@')[0], // fallback if studentId is not in store
        action,
        destination: goingHome ? 'Home' : destination,
        goingHome,
        securityPin: pin,
      };
      
      const response = await api.post('/qr/scan', payload);
      
      if (response.data) {
        Alert.alert('Success', `Successfully logged ${action.toUpperCase()}!`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Failed', error.response?.data?.message || 'Failed to log scan. Please check your PIN.');
      setScanned(false);
      setShowForm(false);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <KeyboardAvoidingView style={styles.formContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Log Gate Access</Text>
            <TouchableOpacity onPress={() => { setShowForm(false); setScanned(false); }}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionToggle}>
            <TouchableOpacity 
              style={[styles.toggleBtn, action === 'entry' && styles.activeToggle]}
              onPress={() => setAction('entry')}
            >
              <ArrowRightLeft size={16} color={action === 'entry' ? '#FFF' : Colors.textMuted} />
              <Text style={[styles.toggleText, action === 'entry' && styles.activeToggleText]}>ENTRY</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, action === 'exit' && styles.activeToggle]}
              onPress={() => setAction('exit')}
            >
              <ArrowRightLeft size={16} color={action === 'exit' ? '#FFF' : Colors.textMuted} />
              <Text style={[styles.toggleText, action === 'exit' && styles.activeToggleText]}>EXIT</Text>
            </TouchableOpacity>
          </View>

          {/* Hidden PIN input as it's extracted from QR */}
          {action === 'exit' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Destination</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color={Colors.roles.student} />
                  <TextInput
                    style={styles.input}
                    placeholder="Where are you going?"
                    value={destination}
                    onChangeText={setDestination}
                    editable={!goingHome}
                  />
                </View>
              </View>
              
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Going Home</Text>
                  <Text style={styles.switchSub}>Check this if you are going home</Text>
                </View>
                <Switch 
                  value={goingHome} 
                  onValueChange={setGoingHome}
                  trackColor={{ false: '#D1D5DB', true: Colors.roles.student + '50' }}
                  thumbColor={goingHome ? Colors.roles.student : '#FFF'}
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Confirm {action.toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.scanText}>Position the QR code within the frame</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  message: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: Colors.text },
  btn: { backgroundColor: Colors.roles.student, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: Colors.roles.student, borderRadius: 24, backgroundColor: 'transparent' },
  scanText: { color: '#FFF', marginTop: 24, fontSize: 16, fontWeight: '600' },
  cancelBtn: { position: 'absolute', bottom: 40, padding: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold' },
  formContainer: { flex: 1, backgroundColor: Colors.background },
  scrollForm: { padding: 24, paddingTop: 40 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  formTitle: { fontSize: 24, fontWeight: '900', color: Colors.text },
  actionToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8 },
  activeToggle: { backgroundColor: Colors.roles.student },
  toggleText: { fontSize: 14, fontWeight: '800', color: Colors.textMuted },
  activeToggleText: { color: '#FFF' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 32 },
  switchLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  switchSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  submitBtn: { backgroundColor: Colors.roles.student, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
