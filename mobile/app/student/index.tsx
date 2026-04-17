import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { 
  Bell, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  User,
  ShieldAlert
} from 'lucide-react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const DashboardCard = ({ title, value, color, icon: Icon, sub }: any) => (
  <View style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]}>
    <View style={styles.cardHeader}>
      <Icon size={20} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardSub}>{sub}</Text>
  </View>
);

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ applicationStatus: 'Pending', payments: 'Up to date', lastEntry: 'N/A' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.name}>{user?.name || 'Student'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.idCard}>
          <View style={styles.idHeader}>
            <Text style={styles.idName}>{user?.name}</Text>
            <ShieldAlert size={18} color="#FFF" opacity={0.8} />
          </View>
          <Text style={styles.idRoll}>{user?.email}</Text>
          <View style={styles.idFooter}>
             <View style={styles.idBadge}>
               <Text style={styles.idBadgeText}>ACTIVE RESIDENT</Text>
             </View>
             <Text style={styles.idWing}>MALE WING</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <DashboardCard 
            title="Application" 
            value={stats.applicationStatus} 
            color={Colors.roles.student} 
            icon={CheckCircle}
            sub="Hostel Registration"
          />
          <DashboardCard 
            title="Finance" 
            value="Rs. 0" 
            color={Colors.primary} 
            icon={Calendar}
            sub="Current Balance"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Notices</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Bell size={20} color={Colors.accent} />
          </View>
          <View style={styles.noticeBody}>
            <Text style={styles.noticeTitle}>Emergency Maintenance</Text>
            <Text style={styles.noticeTime}>2 hours ago • Warden Office</Text>
          </View>
          <ArrowRight size={18} color={Colors.border} />
        </TouchableOpacity>

        <View style={styles.quickEntrySection}>
          <Text style={styles.sectionTitle}>Movement Summary</Text>
          <View style={styles.entryCard}>
             <MapPin size={24} color={Colors.roles.student} />
             <View style={styles.entryInfo}>
               <Text style={styles.entryStatus}>Currently: INSIDE HOSTEL</Text>
               <Text style={styles.entryTime}>Last update: Today, 08:30 AM</Text>
             </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingBottom: 0 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: Colors.text },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.roles.student + '15', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.roles.student },
  profileBtn: { padding: 4 },
  idCard: { backgroundColor: Colors.roles.student, borderRadius: 24, padding: 20, elevation: 8, shadowColor: Colors.roles.student, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
  idHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idName: { fontSize: 18, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' },
  idRoll: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  idBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  idBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  idWing: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  content: { padding: 24 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  card: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  cardValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  cardSub: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  viewAll: { fontSize: 12, fontWeight: '700', color: Colors.roles.student },
  noticeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 20, elevation: 1 },
  noticeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, marginLeft: 16 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  noticeTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  quickEntrySection: { marginTop: 32 },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 20, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: Colors.border },
  entryInfo: { flex: 1 },
  entryStatus: { fontSize: 14, fontWeight: '800', color: Colors.text },
  entryTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
});
