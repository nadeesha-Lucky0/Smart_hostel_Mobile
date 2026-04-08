import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  Animated, Dimensions, SafeAreaView, ScrollView, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color?: string;
}

interface ProfileSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  user: any;
  items: MenuItem[];
  activeId: string;
  onItemPress: (id: string) => void;
  onLogout: () => void;
}

export default function ProfileSidebar({
  isVisible,
  onClose,
  user,
  items,
  activeId,
  onItemPress,
  onLogout
}: ProfileSidebarProps) {
  const [slideAnim] = React.useState(new Animated.Value(-SIDEBAR_WIDTH));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.backdrop} 
          onPress={onClose} 
        />
        
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <LinearGradient colors={['#1A3263', '#2D4A8A']} style={styles.header}>
            <SafeAreaView>
              <View style={styles.headerContent}>
                <View style={styles.profilePicContainer}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={styles.profilePic} />
                  ) : (
                    <View style={styles.placeholderPic}>
                      <Text style={styles.placeholderPicText}>
                        {(user?.name || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
                  <Text style={styles.userRole} numberOfLines={1}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.menuSection}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activeId === item.id && styles.menuItemActive
                  ]}
                  onPress={() => onItemPress(item.id)}
                >
                  <View style={[
                    styles.iconBg, 
                    { backgroundColor: activeId === item.id ? Colors.primary + '15' : 'transparent' }
                  ]}>
                    <Ionicons 
                      name={activeId === item.id ? (item.icon as any) : (`${item.icon}-outline` as any)} 
                      size={22} 
                      color={activeId === item.id ? Colors.primary : Colors.textMuted} 
                    />
                  </View>
                  <Text style={[
                    styles.menuItemText,
                    activeId === item.id && styles.menuItemTextActive
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(255,101,132,0.1)' }]}>
                <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>SLIIT Hostel v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { position: 'absolute', width: width, height: height, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: Colors.bg,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomRightRadius: Radius.xl * 1.5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  profilePicContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  profilePic: { width: '100%', height: '100%' },
  placeholderPic: { 
    width: 60, height: 60, 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  placeholderPicText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.lg, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  userRole: { fontSize: 10, color: '#FAB95B', fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  
  menuContainer: { flex: 1, padding: Spacing.md },
  menuSection: { marginTop: Spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  menuItemActive: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textMuted },
  menuItemTextActive: { color: Colors.primary, fontWeight: '900' },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg, marginHorizontal: Spacing.md },
  
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  logoutText: { fontSize: Typography.base, fontWeight: '800', color: Colors.danger },
  
  footer: { padding: Spacing.xl, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },
});
