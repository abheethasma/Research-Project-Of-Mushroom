import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { pingBackend } from "../services/api";

export default function HomeScreen() {
  const navigation = useNavigation();

  const [loadingPing, setLoadingPing] = useState(false);
  const [serverOk, setServerOk] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [error, setError] = useState("");

  const statusLabel = useMemo(() => {
    if (loadingPing) return "Checking backend";
    if (serverOk) return "Backend connected";
    if (error) return "Backend offline";
    return "Status unknown";
  }, [loadingPing, serverOk, error]);

  const handlePing = async () => {
    try {
      setLoadingPing(true);
      setError("");
      setServerMsg("");

      const data = await pingBackend();
      setServerOk(true);
      setServerMsg(data?.message || "Server is running");
    } catch (_e) {
      setServerOk(false);
      setError("Unable to reach backend");
    } finally {
      setLoadingPing(false);
    }
  };

  useEffect(() => {
    handlePing();
  }, []);

  const openTab = (name) => navigation.navigate(name);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.badge}>
              <Ionicons name="flask-outline" size={14} color="#166534" />
              <Text style={styles.badgeText}>Research Project</Text>
            </View>

            <Pressable
              onPress={handlePing}
              disabled={loadingPing}
              style={({ pressed }) => [
                styles.refreshBtn,
                loadingPing && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              {loadingPing ? (
                <ActivityIndicator size="small" color="#166534" />
              ) : (
                <Ionicons name="refresh" size={16} color="#166534" />
              )}
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>Mushroom Smart Farming</Text>
          <Text style={styles.heroSub}>
            Environmental monitoring and AI-based mushroom analysis in one
            mobile platform.
          </Text>

          <View style={styles.statusCard}>
            <View
              style={[
                styles.dot,
                loadingPing
                  ? styles.dotWarn
                  : serverOk
                  ? styles.dotOk
                  : error
                  ? styles.dotBad
                  : styles.dotMuted,
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>{statusLabel}</Text>
              {serverOk && !!serverMsg ? (
                <Text style={styles.statusSub}>{serverMsg}</Text>
              ) : null}
              {!serverOk && !!error ? (
                <Text style={styles.statusErr}>{error}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Main modules</Text>

        <View style={styles.grid}>
          <ModuleTile
            title="Environment"
            subtitle="Monitoring, forecast, solutions, variety"
            icon={<Ionicons name="thermometer-outline" size={22} color="#166534" />}
            onPress={() => openTab("Environmental Monitoring")}
          />

          <ModuleTile
            title="Disease"
            subtitle="Detection, solution, tracking"
            icon={<Ionicons name="medkit-outline" size={22} color="#b45309" />}
            onPress={() => openTab("Disease")}
          />

          <ModuleTile
            title="Type"
            subtitle="Mushroom type detection"
            icon={
              <MaterialCommunityIcons
                name="mushroom-outline"
                size={22}
                color="#7c3aed"
              />
            }
            onPress={() => openTab("Type")}
          />

          <ModuleTile
            title="Growth"
            subtitle="Growth stage detection"
            icon={<Ionicons name="leaf-outline" size={22} color="#15803d" />}
            onPress={() => openTab("Growth")}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Project focus</Text>
          <View style={styles.chipRow}>
            <InfoChip text="Forecast" />
            <InfoChip text="Recommendations" />
            <InfoChip text="Disease tracking" />
            <InfoChip text="Treatments" />
            <InfoChip text="Type detection" />
            <InfoChip text="Growth tracking" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModuleTile({ title, subtitle, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.moduleCard, pressed && styles.cardPressed]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleSub}>{subtitle}</Text>
    </Pressable>
  );
}

function InfoChip({ text }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    padding: 16,
    paddingBottom: 24,
  },

  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  heroSub: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginTop: 6,
  },

  statusCard: {
    marginTop: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  dotOk: { backgroundColor: "#22c55e" },
  dotBad: { backgroundColor: "#ef4444" },
  dotWarn: { backgroundColor: "#f59e0b" },
  dotMuted: { backgroundColor: "#94a3b8" },

  statusText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },

  statusSub: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },

  statusErr: {
    fontSize: 12,
    color: "#b91c1c",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  moduleCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 130,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },

  moduleSub: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    marginTop: 4,
  },

  infoCard: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnPressed: {
    opacity: 0.9,
  },

  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});