import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';
import { 
  Home, 
  Bed, 
  Users, 
  FileCheck, 
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export default function WardenDashboard() {
  const [stats, setStats] = useState({ rooms: '0', beds: '0', students: '0', pending: '0' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/warden-stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>Warden Panel</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Rooms" 
          value={stats.rooms} 
          sub="Dynamic" 
          icon={Home} 
          color={Colors.roles.warden} 
        />
        <StatCard 
          title="Total Beds" 
          value={stats.beds} 
          sub={`${stats.availableBeds || 0} Available`} 
          icon={Bed} 
          color={Colors.roles.student} 
        />
        <StatCard 
          title="Students" 
          value={stats.students} 
          sub={`Inside: ${stats.studentsInside || '...'}`} 
          icon={Users} 
          color={Colors.roles.financial} 
        />
        <StatCard 
          title="Pending Apps" 
          value={stats.pending} 
          sub="Requires Action" 
          icon={FileCheck} 
          color={Colors.accent} 
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Occupancy Overview</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View Details</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartPlaceholder}>
          <View style={styles.occupancyBarContainer}>
            <View style={[styles.occupancyBar, { width: `${stats.occupancyRate || 0}%`, backgroundColor: Colors.roles.warden }]} />
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Occupied: {stats.occupiedBeds || 0}</Text>
            <Text style={styles.chartLabel}>Available: {stats.availableBeds || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {[
            { id: 1, text: 'Student IT22001542 activated', time: '2 mins ago', icon: Activity },
            { id: 2, text: 'Room 302 allocation updated', time: '15 mins ago', icon: TrendingUp },
            { id: 3, text: 'New complaint from Block A', time: '1 hour ago', icon: Activity },
          ].map(item => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <item.icon size={16} color={Colors.textMuted} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
              <ChevronRight size={16} color={Colors.border} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 32 },
  welcomeText: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },
  nameText: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { 
    width: (width - 48) / 2, 
    backgroundColor: Colors.surface, 
    borderRadius: 24, 
    padding: 16, 
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { padding: 8, borderRadius: 12 },
  statSub: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statTitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  section: { padding: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  viewAllText: { fontSize: 14, fontWeight: '700', color: Colors.roles.warden },
  chartPlaceholder: { backgroundColor: Colors.surface, padding: 20, borderRadius: 24, elevation: 1 },
  occupancyBarContainer: { height: 12, backgroundColor: Colors.background, borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  occupancyBar: { height: '100%', borderRadius: 6 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  activityList: { backgroundColor: Colors.surface, borderRadius: 24, overflow: 'hidden', elevation: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.background },
  activityIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyCenter: 'center' },
  activityContent: { flex: 1, marginLeft: 12 },
  activityText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  activityTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
