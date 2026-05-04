import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter, useNavigation } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ShieldCheck, Users, RefreshCw, Menu } from 'lucide-react-native';

export default function SecurityDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation();
  const [pinData, setPinData] = useState<{ pin: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchPin = async () => {
    try {
      const res = await api.get('/qr/security-pin');
      setPinData(res.data);
      if (res.data.expiresAt) {
        const diff = Math.floor((new Date(res.data.expiresAt).getTime() - new Date().getTime()) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);
      }
    } catch (error) {
      console.error('Error fetching security pin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPin();
    const intervalId = setInterval(fetchPin, 30000); // refresh every 30s just in case
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && pinData) {
      fetchPin();
    }
  }, [timeLeft, pinData]);

  if (loading && !pinData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.roles.security} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatarOuter}>
             <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
             </View>
             <View style={styles.onlineBadge} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.welcomeText}>Security Panel,</Text>
            <Text style={styles.nameText}>{user?.name || 'Officer'}</Text>
          </View>
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={styles.menuBtn}>
            <Menu size={24} color={Colors.roles.security} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Gate Access QR Code</Text>
          <Text style={styles.sectionSub}>Students scan this code to log entry/exit.</Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={pinData ? `GATE_ACCESS:${pinData.pin}` : "LOADING"}
              size={200}
              color={Colors.text}
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.pinSection}>
          <View style={styles.pinHeader}>
            <ShieldCheck size={24} color={Colors.roles.security} />
            <Text style={styles.pinTitle}>Current Security PIN</Text>
          </View>
          
          <View style={styles.pinDisplay}>
            {pinData?.pin.split('').map((digit, index) => (
              <View key={index} style={styles.pinDigitContainer}>
                <Text style={styles.pinDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.timerContainer}>
            <RefreshCw size={14} color={Colors.textMuted} />
            <Text style={styles.timerText}>
              Refreshing in {timeLeft} seconds
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/security/outside')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.roles.security + '15' }]}>
              <Users size={24} color={Colors.roles.security} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Outside & Late Students</Text>
              <Text style={styles.actionSub}>View real-time movement status</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 60, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  avatarOuter: { padding: 4, borderRadius: 32, backgroundColor: Colors.roles.security + '15', position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.roles.security + '10', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: Colors.roles.security },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFF' },
  welcomeText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  nameText: { fontSize: 24, fontWeight: '900', color: Colors.text, marginTop: 4 },
  menuBtn: { padding: 10, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  content: { padding: 24, paddingTop: 32 },
  qrSection: { alignItems: 'center', marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 20, fontWeight: '500' },
  qrContainer: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  pinSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, borderWidth: 1, borderColor: Colors.border },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pinTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  pinDisplay: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pinDigitContainer: { width: 48, height: 56, backgroundColor: Colors.background, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  pinDigit: { fontSize: 28, fontWeight: '900', color: Colors.roles.security },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  actionsSection: { gap: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, borderRadius: 20, elevation: 1, borderWidth: 1, borderColor: Colors.border },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  actionSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
