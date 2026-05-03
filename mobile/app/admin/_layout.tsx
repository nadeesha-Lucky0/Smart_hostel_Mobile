import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  Menu
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore();
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
                <Text style={styles.initialsText}>{user?.name?.charAt(0) || 'A'}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
            <Text style={styles.profileRole}>System Admin</Text>
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

export default function AdminLayout() {
  const adminColor = Colors.roles.warden;

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
          fontWeight: '900',
          fontSize: 20,
          color: adminColor,
        },
        headerTitleAlign: 'center',
        headerTintColor: adminColor,
        drawerActiveBackgroundColor: adminColor + '10',
        drawerActiveTintColor: adminColor,
        drawerInactiveTintColor: Colors.textMuted,
        drawerLabelStyle: {
          marginLeft: 8,
          fontSize: 14,
          fontWeight: '700',
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
          title: 'Admin Control',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={({ navigation }) => ({
          drawerLabel: 'Settings',
          title: 'Account Settings',
          drawerIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => (navigation as any).navigate('dashboard')} style={{ marginLeft: 16 }}>
              <ArrowLeft size={24} color={Colors.roles.warden} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={{ marginRight: 16 }}>
              <Menu size={24} color={Colors.roles.warden} />
            </TouchableOpacity>
          ),
        })}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    backgroundColor: Colors.surface,
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 12,
    backgroundColor: Colors.roles.warden + '05',
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
