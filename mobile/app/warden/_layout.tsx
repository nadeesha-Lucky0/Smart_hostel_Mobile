import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { 
  LayoutDashboard, 
  Layers, 
  UserCheck, 
  Users, 
  Database, 
  ClipboardList, 
  Package, 
  MessageSquare, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.profilePicContainer}>
            {user?.profilePicture ? (
              <Image 
                source={{ uri: user.profilePicture }} 
                style={styles.profilePic} 
              />
            ) : (
              <View style={[styles.profilePic, styles.initialsContainer]}>
                <Text style={styles.initialsText}>{user?.name?.charAt(0) || 'W'}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Warden'}</Text>
            <Text style={styles.profileRole}>Hostel Warden</Text>
          </View>
        </View>
      </View>

      <View style={styles.navSection}>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function WardenLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: Colors.text,
        },
        headerTitleAlign: 'center',
        headerTintColor: Colors.roles.warden,
        drawerActiveBackgroundColor: Colors.roles.warden + '10', // 10% opacity
        drawerActiveTintColor: Colors.roles.warden,
        drawerInactiveTintColor: Colors.textMuted,
        drawerLabelStyle: {
          marginLeft: 8,
          fontSize: 14,
          fontWeight: '600',
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 4,
        },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: 'Dashboard',
          title: 'Warden Dashboard',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="rooms"
        options={{
          drawerLabel: 'Floor & Room',
          title: 'Room Management',
          drawerIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="allocations"
        options={{
          drawerLabel: 'Allocations',
          title: 'Student Allocations',
          drawerIcon: ({ color, size }) => <UserCheck size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profiles"
        options={{
          drawerLabel: 'Profiles',
          title: 'Manage Profiles',
          drawerIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="records"
        options={{
          drawerLabel: 'Records',
          title: 'Hostel Records',
          drawerIcon: ({ color, size }) => <Database size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="logs"
        options={{
          drawerLabel: 'In/Out Logs',
          title: 'Movement History',
          drawerIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="resources"
        options={{
          drawerLabel: 'Resources',
          title: 'Hostel Resources',
          drawerIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="complaints"
        options={{
          drawerLabel: 'Complaints',
          title: 'Grievance Chat',
          drawerIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="notices"
        options={{
          drawerLabel: 'Notices',
          title: 'Broadcasts',
          drawerIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Account Settings',
          drawerIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* Hide redundant tab-based screens from Drawer */}
      <Drawer.Screen name="payment" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: () => null }} />
      <Drawer.Screen name="Clearance" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: () => null }} />
      <Drawer.Screen name="LeftStudents" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: () => null }} />
      <Drawer.Screen name="ProfileActivation" options={{ drawerItemStyle: { display: 'none' }, drawerLabel: () => null }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: Colors.surface,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePicContainer: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.roles.warden + '30',
  },
  profilePic: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.background,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.roles.warden + '15',
  },
  initialsText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.roles.warden,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  profileRole: {
    fontSize: 12,
    color: Colors.roles.warden,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  navSection: {
    paddingVertical: 8,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
});
