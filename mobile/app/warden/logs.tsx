import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { LogIn, LogOut, Clock, Calendar, User, Search } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function MovementLogs() {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qr/logs');
      setLogs(res.data.logs || res.data || []);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const renderLogItem = ({ item }: any) => {
    const isEntry = item.type === 'ENTRY' || item.movementType === 'entry';
    return (
      <View style={styles.card}>
        <View style={[styles.typeIndicator, { backgroundColor: isEntry ? Colors.secondary + '20' : Colors.danger + '20' }]}>
          {isEntry ? <LogIn size={18} color={Colors.secondary} /> : <LogOut size={18} color={Colors.danger} />}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.studentId}>{item.studentRollNumber}</Text>
          <View style={styles.timeRow}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.timeText}>{new Date(item.createdAt || item.timestamp).toLocaleTimeString()}</Text>
            <View style={styles.dot} />
            <Calendar size={12} color={Colors.textMuted} />
            <Text style={styles.timeText}>{new Date(item.createdAt || item.timestamp).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={[styles.statusText, { color: isEntry ? Colors.secondary : Colors.danger }]}>
            {isEntry ? 'ENTRY' : 'EXIT'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Movement Logs</Text>
          <Text style={styles.sectionSub}>Entry & Exit Tracking</Text>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{logs.filter((l: any) => l.type === 'ENTRY').length}</Text>
          <Text style={styles.summaryLabel}>Entries</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{logs.filter((l: any) => l.type === 'EXIT').length}</Text>
          <Text style={styles.summaryLabel}>Exits</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No movement records found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryBar: { flexDirection: 'row', backgroundColor: Colors.surface, margin: 16, padding: 16, borderRadius: 24, elevation: 1, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: Colors.border },
  list: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 24, padding: 16, marginBottom: 12, alignItems: 'center', elevation: 1 },
  typeIndicator: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: 16 },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  studentId: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  timeText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border, marginHorizontal: 4 },
  statusBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.background },
  statusText: { fontSize: 10, fontWeight: '900' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  sectionSub: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
});
