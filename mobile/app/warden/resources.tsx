import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { Package, Box, Tag, Layers, Plus } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function HostelResources() {
  const { token } = useAuthStore();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources');
      setResources(res.data);
    } catch (err) {
      console.error('Fetch resources error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderResourceItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Box size={24} color={Colors.roles.warden} />
        </View>
        <View style={styles.info}>
          <Text style={styles.resourceName}>{item.name}</Text>
          <Text style={styles.resourceType}>{item.type || 'Material'}</Text>
        </View>
        <View style={styles.countBox}>
          <Text style={styles.countText}>{item.quantity || 0}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.tag}>
          <Tag size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>{item.category || 'Maintenance'}</Text>
        </View>
        <View style={styles.tag}>
          <Layers size={12} color={Colors.textMuted} />
          <Text style={styles.tagText}>{item.status || 'In Stock'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.summaryCard}>
          <Text style={styles.sumVal}>{resources.length}</Text>
          <Text style={styles.sumLab}>Total Items</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.roles.warden} />
        </View>
      ) : (
        <FlatList 
          data={resources}
          renderItem={renderResourceItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No resources recorded</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, padding: 20, borderRadius: 24, elevation: 2 },
  sumVal: { fontSize: 24, fontWeight: '800', color: Colors.text },
  sumLab: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  addBtn: { width: 64, height: 64, backgroundColor: Colors.roles.warden, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  iconBox: { width: 50, height: 50, backgroundColor: Colors.background, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  resourceName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  resourceType: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  countBox: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.roles.warden + '15', borderRadius: 12 },
  countText: { fontSize: 16, fontWeight: '800', color: Colors.roles.warden },
  cardFooter: { flexDirection: 'row', gap: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
});
