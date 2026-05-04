import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import { MapPin, QrCode, ArrowRight } from 'lucide-react-native';

export default function StudentInOut() {
  const router = useRouter();
  const [movement, setMovement] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovement = async () => {
    try {
      const res = await api.get('/qr/my-status');
      if (res.data) setMovement(res.data);
    } catch (err) {
      console.error('Error fetching movement status', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMovement();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMovement();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.roles.student]} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Pass & History</Text>
        <Text style={styles.headerSub}>Manage your hostel entries and exits</Text>
      </View>

      <View style={styles.quickEntrySection}>
        <Text style={styles.sectionTitle}>Movement Summary</Text>
        <View style={styles.entryCard}>
           <MapPin size={28} color={movement?.status === 'OUTSIDE' ? '#F59E0B' : Colors.roles.student} />
           <View style={styles.entryInfo}>
             <Text style={styles.entryStatus}>
               Currently: {movement?.status || 'INSIDE HOSTEL'}
             </Text>
             <Text style={styles.entryTime}>
               {movement?.lastTime ? `Last update: ${new Date(movement.lastTime).toLocaleString()}` : 'No recent movement logs'}
             </Text>
           </View>
        </View>
      </View>

      <View style={styles.scanSection}>
        <Text style={styles.sectionTitle}>Gate Access</Text>
        <TouchableOpacity 
          style={styles.scanCard} 
          onPress={() => router.push('/student/scanner')}
        >
          <View style={styles.scanIcon}>
            <QrCode size={28} color="#FFF" />
          </View>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>Scan Gate QR</Text>
            <Text style={styles.scanSub}>Log your entry or exit by scanning the officer's QR code</Text>
          </View>
          <ArrowRight size={24} color={Colors.border} />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 32 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },
  quickEntrySection: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  entryInfo: { flex: 1 },
  entryStatus: { fontSize: 16, fontWeight: '800', color: Colors.text },
  entryTime: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  scanSection: { marginBottom: 32 },
  scanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, borderRadius: 24, elevation: 4, shadowColor: Colors.roles.student, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, borderWidth: 1, borderColor: Colors.border },
  scanIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.roles.student, alignItems: 'center', justifyContent: 'center' },
  scanInfo: { flex: 1, marginLeft: 16, marginRight: 8 },
  scanTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scanSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '500', lineHeight: 18 },
});
