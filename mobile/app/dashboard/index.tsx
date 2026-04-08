import { useState, useEffect, useCallback } from "react";
import {
  View, StyleSheet, RefreshControl,
  ActivityIndicator, SafeAreaView, ScrollView
} from "react-native";
import { statsAPI } from "../../services/api";
import { useAuth } from "../../store/AuthContext";
import { Colors } from "../../constants/Colors";

// Professional Dashboard Components
import StudentMain from "../../components/dashboards/student/StudentMain";
import WardenMain from "../../components/dashboards/warden/WardenMain";
import FinancialMain from "../../components/dashboards/financial/FinancialMain";
import SecurityMain from "../../components/dashboards/security/SecurityMain";
import AdminMain from "../../components/dashboards/admin/AdminMain";

export default function DashboardScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = user?.role?.toLowerCase() || 'student';

  const fetchData = useCallback(async () => {
    try {
      if (role === 'student') {
        const res = await statsAPI.getStudentStats();
        setData(res.data.data);
      } else {
        const res = await statsAPI.getOverview();
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderProfile = () => {
    if (!user) return null;

    switch (role) {
      case 'warden':
        return <WardenMain user={user} stats={data} onLogout={logout} />;
      case 'financial':
        return <FinancialMain user={user} stats={data} onLogout={logout} />;
      case 'security':
        return <SecurityMain user={user} stats={data} onLogout={logout} />;
      case 'admin':
        return <AdminMain user={user} stats={data} onLogout={logout} />;
      case 'student':
      default:
        return <StudentMain user={user} studentData={data} onLogout={logout} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {renderProfile()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
