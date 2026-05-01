import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../store/authStore';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Calendar, 
  History,
  ShieldCheck,
  RefreshCw
} from 'lucide-react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StudentInOut() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // For student, we get current status and last action
      const res = await api.get('/qr/my-status');
      if (res.data.success && res.data.lastAction) {
        // Construct a single log item from the status if no logs available
        const currentLog = {
          _id: 'latest',
          movementType: res.data.lastAction.toLowerCase(),
          timestamp: res.data.lastTime,
          location: 'Hostel Main Gate'
        };
        setLogs([currentLog]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Fetch student logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderLogItem = (item: any, index: number) => {
    const isEntry = item.type === 'ENTRY' || item.movementType === 'entry';
    return (
      <View key={item._id || index} style={styles.logCard}>
        <View style={[styles.logIndicator, { backgroundColor: isEntry ? '#10B98120' : '#EF444420' }]}>
          {isEntry ? <LogIn size={18} color="#10B981" /> : <LogOut size={18} color="#EF4444" />}
        </View>
        <View style={styles.logContent}>
          <Text style={styles.logType}>{isEntry ? 'Entry' : 'Exit'} Recorded</Text>
          <Text style={styles.logLocation}>Hostel Main Gate</Text>
        </View>
        <View style={styles.logTimeBox}>
           <Text style={styles.logTime}>{new Date(item.createdAt || item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
           <Text style={styles.logDate}>{new Date(item.createdAt || item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.qrSection}>
        <View style={styles.passCard}>
           <View style={styles.passHeader}>
              <ShieldCheck size={20} color={Colors.roles.student} />
              <Text style={styles.passTitle}>SECURE PASS</Text>
           </View>
           
           <View style={styles.qrContainer}>
              <QRCode
                value={user?.id || 'guest'}
                size={width * 0.45}
                color={Colors.text}
                backgroundColor={Colors.surface}
              />
           </View>

           <Text style={styles.passId}>{user?.email}</Text>
           <Text style={styles.passPrompt}>Scan this QR code at the security checkpoint</Text>
           
           <TouchableOpacity style={styles.refreshBtn} onPress={() => {}}>
              <RefreshCw size={16} color={Colors.textMuted} />
              <Text style={styles.refreshText}>Dynamic update in 52s</Text>
           </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
           <View style={styles.titleRow}>
              <History size={20} color={Colors.text} />
              <Text style={styles.sectionTitle}>Movement History</Text>
           </View>
           <TouchableOpacity onPress={fetchLogs}>
              <RefreshCw size={16} color={Colors.roles.student} />
           </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.roles.student} style={{ marginTop: 20 }} />
        ) : logs.length > 0 ? (
          logs.slice(0, 5).map((log, index) => renderLogItem(log, index))
        ) : (
          <View style={styles.emptyContainer}>
            <Clock size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No recent movements recorded</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  qrSection: { padding: 24, paddingBottom: 12 },
  passCard: { backgroundColor: Colors.surface, borderRadius: 32, padding: 24, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  passHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  passTitle: { fontSize: 13, fontWeight: '900', color: Colors.roles.student, letterSpacing: 1 },
  qrContainer: { padding: 16, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: Colors.border },
  passId: { fontSize: 12, fontWeight: '700', color: Colors.text, marginTop: 24 },
  passPrompt: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  refreshText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  historySection: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 20, marginBottom: 12, elevation: 1 },
  logIndicator: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logContent: { flex: 1, marginLeft: 16 },
  logType: { fontSize: 14, fontWeight: '700', color: Colors.text },
  logLocation: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  logTimeBox: { alignItems: 'flex-end' },
  logTime: { fontSize: 14, fontWeight: '800', color: Colors.text },
  logDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
