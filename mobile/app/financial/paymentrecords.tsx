import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking } from 'react-native';
import Colors from '../../constants/Colors';
import { Search, Info, CreditCard, Eye, Calendar, User, Clock, FileText, ChevronRight } from 'lucide-react-native';
import api from '../../services/api';

export default function FinancialRecords() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/financial/records');
      if (res.data.success) {
        // Filter only those that have a refund payment document
        const processed = (res.data.data || [])
          .filter((r: any) => r.refundPayment?.documentUrl)
          .map((r: any) => ({
            ...r,
            type: 'Refundable',
            amount: r.refundPayment.amount,
            date: r.refundPayment.submittedDate,
            doc: r.refundPayment.documentUrl,
            status: r.refund_status || 'Pending',
            period: 'Security Deposit'
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setRecords(processed);
      }
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRecords = records.filter(r => 
    (r.studentName || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.rollNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.studentName || '?').charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{item.studentName}</Text>
          <Text style={styles.subtitle}>{item.rollNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: (item.status === 'Accepted' || item.status === 'Approved') ? '#10B98120' : 
                         item.status === 'Rejected' ? '#EF444420' : '#F59E0B20' 
        }]}>
          <Text style={[styles.statusText, { 
            color: (item.status === 'Accepted' || item.status === 'Approved') ? '#10B981' : 
                   item.status === 'Rejected' ? '#EF4444' : '#F59E0B' 
          }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountText}>LKR {item.amount?.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.dateBox}>
          <Calendar size={12} color={Colors.textMuted} />
          <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={() => item.doc && Linking.openURL(item.doc)}>
          <Text style={styles.viewBtnText}>View Receipt</Text>
          <Eye size={14} color={Colors.roles.financial} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Search */}
      <View style={styles.searchBox}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search student, roll no..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.roles.financial} />
        </View>
      ) : (
        <FlatList 
          data={filteredRecords}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <FileText size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No transaction records found</Text>
            </View>
          }
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBox: { padding: 16, backgroundColor: Colors.surface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 12, borderRadius: 16, height: 48, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.roles.financial + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.roles.financial },
  headerInfo: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 11, color: Colors.textMuted, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  detailsGrid: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginBottom: 20, gap: 24 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 6 },
  typeTag: { alignSelf: 'flex-start', backgroundColor: Colors.roles.financial + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeTagText: { fontSize: 10, fontWeight: '800', color: Colors.roles.financial },
  amountText: { fontSize: 15, fontWeight: '900', color: Colors.text },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewBtnText: { fontSize: 12, fontWeight: '800', color: Colors.roles.financial },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
