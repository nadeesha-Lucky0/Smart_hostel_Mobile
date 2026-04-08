import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Colors } from "../../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface StudentHomeProps {
  user: any;
  studentData: any;
  onActionPress?: (action: string) => void;
}

/**
 * StudentHome Component
 * This is the primary dashboard view for Students.
 * Group members: You can edit the UI design and layout here.
 */
export default function StudentHome({ user, studentData }: StudentHomeProps) {
  const stats = [
    { label: 'Room No', value: studentData?.roomNo || 'N/A', icon: 'business', color: '#6366f1' },
    { label: 'Bed No', value: studentData?.bedNo || 'N/A', icon: 'bed', color: '#ec4899' },
    { label: 'Floor', value: studentData?.floor || 'N/A', icon: 'layers', color: '#10b981' },
    { label: 'Status', value: studentData?.status || 'Active', icon: 'checkmark-circle', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.h2}>Welcome, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.baseMuted}>Your hostel dashboard is ready.</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.smallMuted}>{stat.label}</Text>
            <Text style={styles.cardValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* Notices Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.h3}>Recent Notices</Text>
          <Text style={styles.linkText}>View All</Text>
        </View>
        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Ionicons name="notifications" size={20} color={Colors.primary} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.smallBold}>Monthly Maintenance Notice</Text>
            <Text style={styles.smallMuted}>Hostel blocks A & B will have maintenance on Friday...</Text>
          </View>
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
  smallBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noticeContent: {
    flex: 1,
  },
});
