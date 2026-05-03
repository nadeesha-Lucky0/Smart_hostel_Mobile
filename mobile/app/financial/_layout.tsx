import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { 
  LayoutDashboard, 
  History, 
  Settings,
  LogOut,
  ChevronRight,
  Wallet,
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
          <View style={styles.avatarContainer}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initialsContainer]}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'F'}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Financial'}</Text>
            <Text style={styles.profileRole}>Financial Manager</Text>
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

export default function FinancialLayout() {
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
          fontSize: 18,
          color: Colors.text,
        },
        headerTintColor: Colors.roles.financial,
        drawerActiveBackgroundColor: Colors.roles.financial + '10',
        drawerActiveTintColor: Colors.roles.financial,
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
          title: 'Financial Hub',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="paymentrecords"
        options={{
          drawerLabel: 'Records',
          title: 'Payment Audit',
          drawerIcon: ({ color, size }) => <History size={size} color={color} />,
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
              <ArrowLeft size={24} color={Colors.roles.financial} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={{ marginRight: 16 }}>
              <Menu size={24} color={Colors.roles.financial} />
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
  avatarContainer: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.roles.financial + '30',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.roles.financial + '15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsContainer: {
    backgroundColor: Colors.roles.financial + '15',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.roles.financial,
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
    color: Colors.roles.financial,
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
