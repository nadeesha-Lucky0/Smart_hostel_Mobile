import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from '../../constants/Colors';
import { Scan, RotateCcw, X, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function SecurityScanner() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setScanned(false);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  useEffect(() => {
    requestPermission();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    // In a real app, you would verify this ID against the backend
    Alert.alert(
      'Access Granted',
      `Student ID: ${data}\nTime: ${new Date().toLocaleTimeString()}`,
      [{ text: 'OK', onPress: () => setScanned(false) }]
    );
  };

  if (!permission) {
    return <View style={styles.center}><Text>Requesting for camera permission</Text></View>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={requestPermission}>
          <Text style={styles.retryText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      /> */}
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF' }}>Camera Component Disabled for Debugging</Text>
      </View>
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Entrance Scanner</Text>
          <Text style={styles.subtitle}>Scan student QR code for access</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Scan size={48} color="rgba(255,255,255,0.5)" />
        </View>

        <View style={styles.footer}>
          {scanned && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => setScanned(false)}>
              <RotateCcw size={20} color="#FFF" />
              <Text style={styles.resetText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="#FF9999" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between', padding: 40 },
  header: { padding: 30, paddingTop: 60, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  scanArea: { width: 250, height: 250, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: Colors.secondary, borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  footer: { alignItems: 'center', gap: 20 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, gap: 10 },
  resetText: { color: '#FFF', fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { color: '#FF9999', fontWeight: '600' },
  errorText: { marginBottom: 20, fontSize: 16 },
  retryBtn: { padding: 12, backgroundColor: Colors.primary, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '600' }
});
