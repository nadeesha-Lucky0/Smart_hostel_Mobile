import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { Clock, MapPin, AlertCircle, Search } from 'lucide-react-native';

export default function OutsideStudents() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/qr/outside');
      if (response.data && response.data.outside) {
        setStudents(response.data.outside);
      }
    } catch (err) {
      console.error('Error fetching outside students:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isLate = item.isLate && !item.goingHome;
    const isGoingHome = item.goingHome;

    return (
      <View style={[styles.card, isLate && styles.lateCard, isGoingHome && styles.homeCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, isLate ? styles.lateAvatar : (isGoingHome ? styles.homeAvatar : undefined)]}>
              <Text style={[styles.avatarText, isLate && { color: '#EF4444' }, isGoingHome && { color: '#3B82F6' }]}>
                {item.student?.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.name}>{item.student?.name || 'Unknown Student'}</Text>
              <Text style={styles.rollNo}>{item.student?.studentId || 'N/A'} • {item.student?.wing || 'N/A'} Wing</Text>
            </View>
          </View>
          {isLate && (
            <View style={styles.lateBadge}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={styles.lateText}>LATE</Text>
            </View>
          )}
          {isGoingHome && (
            <View style={styles.homeBadge}>
              <Text style={styles.homeText}>GOING HOME</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Clock size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              Left at: {new Date(item.lastExitAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {item.destination && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={Colors.textMuted} />
              <Text style={styles.detailText}>
                Destination: {item.destination}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.roles.security} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={(item, index) => item.student?.studentId || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.roles.security]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No students are currently outside.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100, gap: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, elevation: 1, borderWidth: 1, borderColor: Colors.border },
  lateCard: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  homeCard: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.roles.security + '15', alignItems: 'center', justifyContent: 'center' },
  lateAvatar: { backgroundColor: '#FEE2E2' },
  homeAvatar: { backgroundColor: '#DBEAFE' },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.roles.security },
  name: { fontSize: 15, fontWeight: '800', color: Colors.text },
  rollNo: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  lateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lateText: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
  homeBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  homeText: { fontSize: 10, fontWeight: '900', color: '#3B82F6' },
  cardBody: { gap: 6, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});
