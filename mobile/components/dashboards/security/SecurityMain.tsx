import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../../constants/Colors';
import DashboardHeader from '../../navigation/DashboardHeader';
import ProfileSidebar from '../../navigation/ProfileSidebar';
import SecurityHome from './SecurityHome';
import { SecurityView } from '../../../app/dashboard/in-out';

export default function SecurityMain({ user, stats, onLogout }: { user: any, stats?: any, onLogout: () => void }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const menuItems = [
    { id: 'home', title: 'Dashboard', icon: 'home' },
    { id: 'gatepass', title: 'Gate Pass', icon: 'qr-code' },
    { id: 'logs', title: 'Visitor Logs', icon: 'swap-horizontal' },
    { id: 'incidents', title: 'Incidents', icon: 'alert-circle' },
  ];

  const getActiveTitle = () => menuItems.find(item => item.id === activeTab)?.title || 'Security';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <SecurityHome user={user} stats={stats} onActionPress={setActiveTab} />;
      case 'gatepass':
        return <SecurityView onBack={() => setActiveTab('home')} />;
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>{getActiveTitle()} Module Coming Soon</Text>
            <Text style={styles.placeholderSub}>Your group members will add this .tsx file in /dashboards/security/tabs/</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <DashboardHeader title={getActiveTitle()} onMenuPress={() => setIsSidebarVisible(true)} onLogout={onLogout} />
      <View style={styles.content}>
        {renderContent()}
      </View>
      <ProfileSidebar
        isVisible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        user={user}
        items={menuItems}
        activeId={activeTab}
        onItemPress={(id) => { setActiveTab(id); setIsSidebarVisible(false); }}
        onLogout={onLogout}
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
