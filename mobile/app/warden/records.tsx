import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { Database, FileText, Download, Filter, Search } from 'lucide-react-native';
import api from '../../services/api';

export default function HostelRecords() {
  const { token } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Using student applications as a base for 'records' if a specific records endpoint isn't available
      const res = await api.get('/applications?status=Activated');
      setRecords(res.data);
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderRecordItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FileText size={20} color={Colors.roles.warden} />
        <View style={styles.headerInfo}>
          <Text style={styles.recordTitle}>{item.studentName}</Text>
          <Text style={styles.recordSub}>Official Allocation Record</Text>
        </View>
        <TouchableOpacity style={styles.downloadBtn}>
          <Download size={18} color={Colors.roles.warden} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>ROLL NUMBER</Text>
          <Text style={styles.detailValue}>{item.studentRollNumber}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>ROOM</Text>
          <Text style={styles.detailValue}>{item.assignedRoom || 'Pending'}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>YEAR</Text>
          <Text style={styles.detailValue}>{item.studentYear}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{records.length}</Text>
          <Text style={styles.statLab}>Active Records</Text>
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Filter size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Search size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Database size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No historical records found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsRow: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 12 },
  statBox: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 1 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLab: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  actionIconBtn: { width: 54, height: 54, backgroundColor: Colors.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  headerInfo: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  recordSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  downloadBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.roles.warden + '15', alignItems: 'center', justifyContent: 'center' },
  detailsGrid: { flexDirection: 'row', gap: 12 },
  detailBox: { flex: 1, backgroundColor: Colors.background, padding: 12, borderRadius: 16 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
