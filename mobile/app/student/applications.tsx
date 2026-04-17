import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  Info,
  ChevronRight,
  ArrowRight
} from 'lucide-react-native';
import api from '../../services/api';

export default function StudentApplications() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Endpoint for student's own applications
      const res = await api.get('/applications/me');
      setApplications(res.data);
    } catch (err) {
      console.error('Fetch student applications error:', err);
      // Fallback or empty state
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activated':
      case 'approved': return { color: '#10B981', bg: '#10B98115', icon: CheckCircle };
      case 'rejected':
      case 'cancelled': return { color: '#EF4444', bg: '#EF444415', icon: XCircle };
      default: return { color: Colors.accent, bg: Colors.accent + '15', icon: Clock };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Applications</Text>
          <Text style={styles.subtitle}>Track your hostel registration and room requests</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.roles.student} style={{ marginTop: 40 }} />
        ) : applications.length > 0 ? (
          <View style={styles.list}>
            {applications.map((app, index) => {
              const style = getStatusStyle(app.applicationStatus || app.status);
              return (
                <View key={app._id || index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.statusIcon, { backgroundColor: style.bg }]}>
                      <style.icon size={20} color={style.color} />
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.appTitle}>Hostel Allocation</Text>
                      <Text style={styles.appDate}>Applied on {new Date(app.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: style.bg }]}>
                      <Text style={[styles.badgeText, { color: style.color }]}>{app.applicationStatus || app.status || 'Pending'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>ACADEMIC YEAR</Text>
                      <Text style={styles.detailValue}>{app.studentYear || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>ROOM TYPE</Text>
                      <Text style={styles.detailValue}>{app.roomPreference || 'Standard'}</Text>
                    </View>
                  </View>

                  {app.applicationStatus === 'Room Allocated' && (
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>View Allocation Details</Text>
                      <ArrowRight size={16} color="#FFF" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
               <ClipboardList size={48} color={Colors.border} />
            </View>
            <Text style={styles.emptyTitle}>No Active Applications</Text>
            <Text style={styles.emptySub}>You haven't submitted any hostel applications yet.</Text>
            <TouchableOpacity style={styles.applyNowBtn} onPress={() => Alert.alert('Notice', 'Hostel applications are currently closed.')}>
               <Plus size={20} color="#FFF" />
               <Text style={styles.applyNowText}>New Application</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  list: { padding: 24 },
  card: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: 16 },
  appTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  appDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardDivider: { height: 1, backgroundColor: Colors.background, marginVertical: 16 },
  detailsRow: { flexDirection: 'row', gap: 24 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '900', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  actionBtn: { backgroundColor: Colors.roles.student, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, marginTop: 16, gap: 10 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 36, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 24, elevation: 2 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, fontWeight: '500' },
  applyNowBtn: { backgroundColor: Colors.roles.student, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 32, gap: 10, elevation: 4 },
  applyNowText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
