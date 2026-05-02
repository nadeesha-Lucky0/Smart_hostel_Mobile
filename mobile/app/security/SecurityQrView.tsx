import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, ScrollView,
  FlatList, Alert, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../store/AuthContext';
import { Colors, Typography, Spacing, Radius } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchMyQrStatus, submitQrScan, fetchSecurityPin,
  fetchOutsideStudents, fetchLateStudents,
} from '../../services/qr';

export function StudentView({ user, onBack }) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/student');
  };
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [destination, setDestination] = useState('');
  const [goingHome, setGoingHome] = useState(false);
  const [pendingPin, setPendingPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const s = await fetchMyQrStatus();
      setStatus(s);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not load status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to scan the Gate QR code.');
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const pin = String(data || '').trim();
    const nextAction = status?.status === 'INSIDE' ? 'exit' : 'entry';
    setScanning(false);
    if (nextAction === 'exit') {
      setPendingPin(pin);
      setShowExitModal(true);
    } else {
      submitScan(pin, 'entry');
    }
  };

  const submitScan = async (pin, action, dest, home) => {
    if (!user?.studentId) {
      Alert.alert('Error', 'Student ID not found. Please log out and log in again.');
      return;
    }
    try {
      setSubmitting(true);
      await submitQrScan({
        studentId: user.studentId,
        action,
        securityPin: pin,
        destination: action === 'exit' ? dest : undefined,
        goingHome: home,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        action === 'entry' ? 'Checked In' : 'Checked Out',
        action === 'entry' ? 'Welcome back! You are now marked INSIDE.' : `Logged out to: ${dest}`,
        [{ text: 'OK', onPress: loadStatus }]
      );
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Scan Failed', e?.response?.data?.message || 'Could not process scan.');
    } finally {
      setSubmitting(false);
      setShowExitModal(false);
      setDestination('');
      setGoingHome(false);
    }
  };

  const isInside = status?.status === 'INSIDE';
  const gradientColors = isInside ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626'];

  if (scanning) {
    return (
      <View style={s.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={s.scanOverlay}>
          <View style={s.scanCornerTL} /><View style={s.scanCornerTR} />
          <View style={s.scanCornerBL} /><View style={s.scanCornerBR} />
        </View>
        <Text style={s.scanHint}>Point at the Security Gate QR Code</Text>
        <TouchableOpacity style={s.cancelScanBtn} onPress={() => setScanning(false)}>
          <Text style={s.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.pageTitle}>In / Out</Text>
          <Text style={s.pageSubtitle}>HOSTEL GATE ACCESS</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.scrollContent}>

        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
        ) : (
          <>
            <LinearGradient colors={gradientColors} style={s.statusCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.statusLabel}>CURRENT STATUS</Text>
              <Text style={s.statusValue}>{isInside ? 'INSIDE' : 'OUTSIDE'}</Text>
              {status?.lastTime && (
                <Text style={s.statusMeta}>
                  Last {status.lastAction} - {new Date(status.lastTime).toLocaleTimeString()}
                </Text>
              )}
            </LinearGradient>

            <View style={s.infoCard}>
              <Text style={s.infoText}>
                {isInside
                  ? 'To check OUT, scan the Gate QR code at the security post.'
                  : 'To check IN, scan the Gate QR code at the entrance.'}
              </Text>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={s.scanBtn} onPress={openScanner} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#6C63FF', '#4A44CC']}
                  style={s.scanBtnGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={s.scanBtnText}>Scan Gate QR Code</Text>
                  <Text style={s.scanBtnSub}>Tap to open camera</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={loadStatus} style={s.refreshBtn}>
              <Text style={s.refreshText}>Refresh Status</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={showExitModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Where are you going?</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Library, Town, Home..."
              placeholderTextColor={Colors.textMuted}
              value={destination}
              onChangeText={setDestination}
            />
            <TouchableOpacity
              style={[s.toggleRow, goingHome && s.toggleRowActive]}
              onPress={() => setGoingHome(!goingHome)}
            >
              <Text style={s.toggleText}>{goingHome ? 'Going Home: Yes' : 'Going Home: No'}</Text>
            </TouchableOpacity>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setShowExitModal(false); setScanned(false); }}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirm, (!destination.trim() || submitting) && s.modalConfirmDisabled]}
                onPress={() => {
                  if (!destination.trim()) { Alert.alert('Required', 'Please enter your destination.'); return; }
                  submitScan(pendingPin, 'exit', destination.trim(), goingHome);
                }}
                disabled={!destination.trim() || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.modalConfirmText}>Confirm Exit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export function SecurityView({ onBack }) {
  const router = useRouter();
  const { logout } = useAuth();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/security/qr-scanner');
  };
  const [pin, setPin] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [outsideCount, setOutsideCount] = useState(null);
  const [outside, setOutside] = useState([]);
  const [lateCount, setLateCount] = useState(0);
  const [lateStudents, setLateStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('qr');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (e) {
      Alert.alert('Logout Failed', 'Please try again.');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pinRes, outsideRes] = await Promise.all([
        fetchSecurityPin(),
        fetchOutsideStudents(),
      ]);
      const lateRes = await fetchLateStudents();
      setPin(pinRes.pin);
      setExpiresAt(pinRes.expiresAt || '');
      setOutsideCount(outsideRes.outsideCount);
      setOutside(outsideRes.outside);
      setLateCount(lateRes?.lateCount || 0);
      setLateStudents(lateRes?.lateStudents || []);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.pageTitle}>Gate Control</Text>
          <Text style={s.pageSubtitle}>SECURITY DASHBOARD</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.headerLogoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'qr' && s.tabActive]} onPress={() => setTab('qr')}>
          <Text style={[s.tabText, tab === 'qr' && s.tabTextActive]}>Gate QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'outside' && s.tabActive]} onPress={() => setTab('outside')}>
          <Text style={[s.tabText, tab === 'outside' && s.tabTextActive]}>
            Outside {outsideCount !== null ? `(${outsideCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'late' && s.tabActive]} onPress={() => setTab('late')}>
          <Text style={[s.tabText, tab === 'late' && s.tabTextActive]}>
            Late ({lateCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : tab === 'qr' ? (
        <ScrollView contentContainerStyle={s.scrollContent}>
          <View style={s.qrCard}>
            <LinearGradient colors={['#1A1A2E', '#252540']} style={s.qrGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.qrCardLabel}>GATE QR CODE</Text>
              <Text style={s.qrCardSub}>Show this to students at the gate</Text>
              <View style={s.qrBox}>
                <QRCode value={pin || 'SHMS_GATE'} size={200} backgroundColor="white" color="black" />
              </View>
              <View style={s.pinBox}>
                <Text style={s.pinLabel}>SECURITY PIN</Text>
                <Text style={s.pinValue}>{pin}</Text>
                {expiresAt ? (
                  <Text style={s.pinExpiry}>
                    Expires: {new Date(expiresAt).toLocaleTimeString()}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={loadData}>
            <Text style={s.refreshText}>Refresh QR</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : tab === 'outside' ? (
        <FlatList
          data={outside}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: Spacing.md }}
          ListEmptyComponent={<Text style={s.emptyText}>All students are inside</Text>}
          refreshing={loading}
          onRefresh={loadData}
          renderItem={({ item }) => {
            if (!item.student) return null;
            return (
              <View style={[s.studentCard, item.isLate && s.studentCardLate]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{item.student.name}</Text>
                  <Text style={s.studentMeta}>
                    {item.student.studentId} - {item.student.wing} wing - Room {item.student.room}
                  </Text>
                  <Text style={s.studentMeta}>To: {item.destination}</Text>
                </View>
                {item.isLate && (
                  <View style={s.lateBadge}>
                    <Text style={s.lateBadgeText}>LATE</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={lateStudents}
          keyExtractor={(_, i) => `late-${i}`}
          contentContainerStyle={{ padding: Spacing.md }}
          ListEmptyComponent={<Text style={s.emptyText}>No late students now</Text>}
          refreshing={loading}
          onRefresh={loadData}
          renderItem={({ item }) => (
            <View style={[s.studentCard, s.studentCardLate]}>
              <View style={{ flex: 1 }}>
                <Text style={s.studentName}>{item?.name || 'Unknown'}</Text>
                <Text style={s.studentMeta}>{item?.studentId || 'N/A'}</Text>
                <Text style={s.studentMeta}>{item?.email || 'No email'}</Text>
              </View>
              <View style={s.lateBadge}>
                <Text style={s.lateBadgeText}>LATE</Text>
              </View>
            </View>
          )}
        />
      )}

    </SafeAreaView>
  );
}

export function WardenView({ onBack }) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/warden');
  };
  const [outside, setOutside] = useState([]);
  const [lateCount, setLateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [outsideRes, lateRes] = await Promise.all([
        fetchOutsideStudents(),
        fetchLateStudents(),
      ]);
      setOutside(outsideRes.outside);
      setLateCount(lateRes.lateCount);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.pageTitle}>In / Out Monitor</Text>
          <Text style={s.pageSubtitle}>WARDEN DASHBOARD</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={[s.statCard, { borderColor: Colors.danger }]}>
          <Text style={s.statNum}>{outside.length}</Text>
          <Text style={s.statLabel}>Outside</Text>
        </View>
        <View style={[s.statCard, { borderColor: Colors.warning }]}>
          <Text style={s.statNum}>{lateCount}</Text>
          <Text style={s.statLabel}>Late</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={outside}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: Spacing.md }}
          ListEmptyComponent={<Text style={s.emptyText}>All students are inside</Text>}
          refreshing={loading}
          onRefresh={loadData}
          renderItem={({ item }) => {
            if (!item.student) return null;
            return (
              <View style={[s.studentCard, item.isLate && s.studentCardLate]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.studentName}>{item.student.name}</Text>
                  <Text style={s.studentMeta}>
                    {item.student.studentId} - {item.student.wing} wing
                  </Text>
                  <Text style={s.studentMeta}>
                    To: {item.destination} {item.goingHome ? '- Going Home' : ''}
                  </Text>
                  <Text style={s.studentMeta}>
                    Since: {new Date(item.lastExitAt).toLocaleTimeString()}
                  </Text>
                </View>
                {item.isLate && (
                  <View style={s.lateBadge}>
                    <Text style={s.lateBadgeText}>LATE</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function SecurityQrScreen() {
  return <SecurityView />;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  backBtn: { padding: 4, marginLeft: -4 },
  headerLogoutBtn: { marginLeft: 'auto', padding: 6 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing['2xl'] },
  pageTitle: { fontSize: Typography['3xl'], fontWeight: '900', color: '#fff' },
  pageSubtitle: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  statusCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  statusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.xs, fontWeight: '700', letterSpacing: 1.5 },
  statusValue: { color: '#fff', fontSize: Typography['4xl'], fontWeight: '900', marginVertical: 4 },
  statusMeta: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sm, marginTop: 4 },
  infoCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  infoText: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },
  scanBtn: { borderRadius: Radius.xl, marginBottom: Spacing.md, overflow: 'hidden', elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 16 },
  scanBtnGradient: { padding: Spacing.xl, alignItems: 'center' },
  scanBtnText: { color: '#fff', fontSize: Typography.xl, fontWeight: '900' },
  scanBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.xs, marginTop: 4 },
  refreshBtn: { alignSelf: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  refreshText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.sm },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scanOverlay: { position: 'absolute', top: '25%', left: '15%', right: '15%', bottom: '25%' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 36, height: 36, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#6C63FF', borderTopLeftRadius: 8 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#6C63FF', borderTopRightRadius: 8 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 36, height: 36, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#6C63FF', borderBottomLeftRadius: 8 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#6C63FF', borderBottomRightRadius: 8 },
  scanHint: { position: 'absolute', bottom: '18%', alignSelf: 'center', color: '#fff', fontWeight: '700', fontSize: Typography.base, textShadowColor: '#000', textShadowRadius: 4 },
  cancelScanBtn: { position: 'absolute', bottom: '8%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full },
  cancelScanText: { color: '#fff', fontWeight: '800', fontSize: Typography.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingBottom: 48 },
  modalTitle: { color: '#fff', fontSize: Typography['2xl'], fontWeight: '900', marginBottom: Spacing.lg },
  modalInput: { backgroundColor: Colors.bgInput, borderRadius: Radius.lg, color: '#fff', fontSize: Typography.base, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  toggleRowActive: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.1)' },
  toggleText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  modalCancel: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.bgElevated, alignItems: 'center' },
  modalCancelText: { color: Colors.textSecondary, fontWeight: '700' },
  modalConfirm: { flex: 2, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.danger, alignItems: 'center' },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { color: '#fff', fontWeight: '900', fontSize: Typography.base },
  qrCard: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  qrGradient: { padding: Spacing.xl, alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  qrCardLabel: { color: Colors.primary, fontWeight: '900', fontSize: Typography.sm, letterSpacing: 1.5, marginBottom: 4 },
  qrCardSub: { color: Colors.textSecondary, fontSize: Typography.xs, marginBottom: Spacing.lg },
  qrBox: { backgroundColor: '#fff', padding: 16, borderRadius: Radius.lg, marginBottom: Spacing.lg, elevation: 8 },
  pinBox: { alignItems: 'center' },
  pinLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '700', letterSpacing: 1.5 },
  pinValue: { color: '#fff', fontSize: Typography['4xl'], fontWeight: '900', letterSpacing: 8, marginTop: 4 },
  pinExpiry: { color: Colors.warning, fontSize: Typography.xs, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: '700', fontSize: Typography.sm },
  tabTextActive: { color: '#fff' },
  studentCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  studentCardLate: { borderColor: Colors.warning },
  studentName: { color: '#fff', fontWeight: '800', fontSize: Typography.base },
  studentMeta: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  lateBadge: { backgroundColor: Colors.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  lateBadgeText: { color: '#000', fontWeight: '900', fontSize: Typography.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2 },
  statNum: { color: '#fff', fontSize: Typography['3xl'], fontWeight: '900' },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: '700', letterSpacing: 1 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing['2xl'], fontSize: Typography.base },
});

