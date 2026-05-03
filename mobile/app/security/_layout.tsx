import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { 
  Scan, 
  Settings,
  LogOut,
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
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Security'}</Text>
            <Text style={styles.profileRole}>Security Officer</Text>
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

export default function SecurityLayout() {
  const router = useRouter();
  const roleColor = Colors.roles.security;

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
        headerTintColor: roleColor,
        drawerActiveBackgroundColor: roleColor + '10',
        drawerActiveTintColor: roleColor,
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
        name="qr-scanner"
        options={{
          drawerLabel: 'Scanner',
          title: 'QR Entrance',
          drawerIcon: ({ color, size }) => <Scan size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={({ navigation }) => ({
          drawerLabel: 'Settings',
          title: 'Account Settings',
          drawerIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => (navigation as any).navigate('qr-scanner')} style={{ marginLeft: 16 }}>
              <ArrowLeft size={24} color={roleColor} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={{ marginRight: 16 }}>
              <Menu size={24} color={roleColor} />
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
    paddingTop: 50,
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
    borderColor: Colors.roles.security + '30',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.roles.security + '15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initialsContainer: {
    backgroundColor: Colors.roles.security + '15',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.roles.security,
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
    color: Colors.roles.security,
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
    marginBottom: 20,
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
