import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardHeaderProps {
  title: string;
  onMenuPress: () => void;
  onLogout?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export default function DashboardHeader({ title, onMenuPress, onLogout, showBack, onBack }: DashboardHeaderProps) {
  return (
    <LinearGradient 
      colors={['#1A3263', '#2D4A8A']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.leftRow}>
            {showBack ? (
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
                <Ionicons name="menu" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>

          {onLogout && (
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
  safe: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    height: 70,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,101,132,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
