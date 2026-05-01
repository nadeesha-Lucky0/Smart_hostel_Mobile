import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import DashboardHeader from '../../navigation/DashboardHeader';
import ProfileSidebar from '../../navigation/ProfileSidebar';
import WardenHome from './WardenHome';
import { WardenView } from '../../../app/dashboard/in-out';

interface WardenMainProps {
  user: any;
  stats?: any;
  onRefresh?: () => void;
  onLogout?: () => void;
}

export default function WardenMain({ user, stats, onLogout }: WardenMainProps) {
  const router = useRouter();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const menuItems = [
    { id: 'home', title: 'Home', icon: 'home' },
    { id: 'room-management', title: 'Room Management', icon: 'business' },
    { id: 'allocations', title: 'Student Allocations', icon: 'people' },
    { id: 'profiles', title: 'Student Profiles', icon: 'person-circle' },
    { id: 'records', title: 'Records/Stats', icon: 'stats-chart' },
    { id: 'complaints', title: 'Complaints', icon: 'chatbubbles' },
    { id: 'notices', title: 'Broadcast Notices', icon: 'notifications' },
    { id: 'gatepass', title: 'In & Out Status', icon: 'swap-horizontal' },
    { id: 'resources', title: 'Hostel Resources', icon: 'cube' },
  ];

  const getActiveTitle = () => {
    return menuItems.find(item => item.id === activeTab)?.title || 'Warden';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <WardenHome user={user} stats={stats} onActionPress={setActiveTab} />;
      case 'gatepass':
        return <WardenView onBack={() => setActiveTab('home')} />;
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>{getActiveTitle()} Module Coming Soon</Text>
            <Text style={styles.placeholderSub}>Your group members will add this .tsx file in /dashboards/warden/tabs/</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader 
        title={getActiveTitle()} 
        onMenuPress={() => setIsSidebarVisible(true)} 
        onLogout={onLogout}
      />

      <View style={styles.content}>
        {renderContent()}
      </View>

      <ProfileSidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        user={user}
        items={menuItems}
        activeId={activeTab}
        onItemPress={(id) => {
          setIsSidebarVisible(false);
          if (id === 'gatepass') {
            router.push('/dashboard/in-out');
          } else {
            setActiveTab(id);
          }
        }}
        onLogout={onLogout!}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1 },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  placeholderText: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  placeholderSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 10, fontWeight: '600' },
});
