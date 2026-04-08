import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Colors } from "../../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface SecurityHomeProps {
  user: any;
  stats?: any;
  onLogout?: () => void;
  onActionPress?: (action: string) => void;
}

/**
 * SecurityHome Component
 * This is the primary dashboard view for Security staff.
 */
export default function SecurityHome({ user, stats }: SecurityHomeProps) {
  const secStats = [
    { label: 'Check-ins', value: '42', icon: 'log-in', color: '#10b981' },
    { label: 'Check-outs', value: '28', icon: 'log-out', color: '#6366f1' },
    { label: 'Pending', value: '14', icon: 'time', color: '#f59e0b' },
    { label: 'Alerts', value: '0', icon: 'shield-checkmark', color: '#3b82f6' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.hero}>
        <Text style={styles.h2}>Security Portal 🛡️</Text>
        <Text style={styles.baseMuted}>Gate Control | {user?.name || 'Security Officer'}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {secStats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.smallMuted}>{stat.label}</Text>
            <Text style={styles.cardValue}>{stat.value}</Text>
          </View>
        ))}
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
});
