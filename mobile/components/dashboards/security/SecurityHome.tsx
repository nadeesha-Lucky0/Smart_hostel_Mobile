import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from "react-native";
import { Colors } from "../../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { fetchLateStudents, fetchOutsideStudents, fetchSecurityPin } from "../../../services/qr";
import QRCode from "react-native-qrcode-svg";

interface SecurityHomeProps {
  user: any;
  stats?: any;
  onLogout?: () => void;
  onActionPress?: (action: string) => void;
}

export default function SecurityHome({ user }: SecurityHomeProps) {
  const [loading, setLoading] = useState(true);
  const [outsideCount, setOutsideCount] = useState(0);
  const [wentHomeCount, setWentHomeCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [pin, setPin] = useState("----");

  const loadSecuritySnapshot = useCallback(async () => {
    try {
      setLoading(true);
      const [outsideRes, lateRes, pinRes] = await Promise.all([
        fetchOutsideStudents(),
        fetchLateStudents(),
        fetchSecurityPin(),
      ]);

      const outside = outsideRes?.outside || [];
      setOutsideCount(outsideRes?.outsideCount || 0);
      setWentHomeCount(outside.filter((s: any) => Boolean(s?.goingHome)).length);
      setLateCount(lateRes?.lateCount || 0);
      setPin(pinRes?.pin || "----");
    } catch (error: any) {
      console.warn("Security dashboard snapshot warning:", error?.response?.status || error?.message);
      setOutsideCount(0);
      setWentHomeCount(0);
      setLateCount(0);
      setPin("----");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecuritySnapshot();
    const timer = setInterval(loadSecuritySnapshot, 30000);
    return () => clearInterval(timer);
  }, [loadSecuritySnapshot]);

  const secStats = [
    { label: "Students Outside", value: String(outsideCount), icon: "people", color: "#ef4444" },
    { label: "Went Home", value: String(wentHomeCount), icon: "home", color: "#10b981" },
    { label: "Late Students", value: String(lateCount), icon: "time", color: "#f59e0b" },
    { label: "Gate PIN", value: pin, icon: "key", color: "#6366f1" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.h2}>Security Portal</Text>
        <Text style={styles.baseMuted}>Gate Control | {user?.name || "Security Officer"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20, marginBottom: 20 }} />
      ) : null}

      <View style={styles.grid}>
        {secStats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: stat.color + "20" }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.smallMuted}>{stat.label}</Text>
            <Text style={styles.cardValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Gate QR Code</Text>
        <Text style={styles.qrSub}>Students scan this code at entry/exit</Text>
        <View style={styles.qrBox}>
          <QRCode value={pin || "SHMS_GATE"} size={180} backgroundColor="white" color="black" />
        </View>
        <Text style={styles.pinText}>PIN: {pin}</Text>
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
    fontWeight: "bold",
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
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  qrCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  qrSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  pinText: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
});
