import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Colors } from "../../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface WardenHomeProps {
  user: any;
  stats: any;
  onLogout?: () => void;
  onActionPress?: (action: string) => void;
}

/**
 * WardenHome Component
 * This is the primary dashboard view for Wardens.
 */
export default function WardenHome({ user, stats }: WardenHomeProps) {
  const wardenStats = [
    { label: 'Total Students', value: stats?.totalStudents || '142', icon: 'people', color: '#6366f1' },
    { label: 'Absent Today', value: stats?.absentToday || '12', icon: 'alert-circle', color: '#ef4444' },
    { label: 'Allocated Beds', value: stats?.allocatedBeds || '128', icon: 'bed', color: '#10b981' },
    { label: 'Requests', value: stats?.pendingRequests || '8', icon: 'mail', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.hero}>
        <Text style={styles.h2}>Warden Portal 👋</Text>
        <Text style={styles.baseMuted}>Managing {user?.hostelName || 'The Hostel Management System'}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {wardenStats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.smallMuted}>{stat.label}</Text>
            <Text style={styles.cardValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions Placeholder */}
      <View style={styles.section}>
        <Text style={styles.h3}>Recent Activities</Text>
        <View style={styles.activityCard}>
          <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.activityText}>New late pass request from Student ID #4521</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.bg,
  },
  hero: {
    marginBottom: 24,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  baseMuted: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  smallMuted: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  section: {
    marginTop: 8,
    paddingBottom: 40,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
});
