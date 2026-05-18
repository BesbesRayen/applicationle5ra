import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import { getTransactions, Transaction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; prefix: string }> = {
  PAYMENT: { icon: "cash-minus", color: "#f87171", bg: "#3b1111", prefix: "-" },
  CREDIT:  { icon: "cash-plus",  color: "#34d399", bg: "#0d3320", prefix: "+" },
  REFUND:  { icon: "cash-refund", color: "#60a5fa", bg: "#0d1e3b", prefix: "+" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: "Reussi",  color: "#34d399" },
  FAILED:  { label: "Echoue", color: "#f87171" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const PaymentHistory = () => {
  const { navigate } = useAppNavigation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getTransactions(user.userId)
      .then(setTransactions)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [user]);

  const totalPaid = transactions
    .filter((t) => t.type === "PAYMENT" && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Profile")} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray900} />
          </Pressable>
          <Text style={styles.title}>Historique</Text>
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total paye</Text>
            <Text style={styles.summaryValue}>{totalPaid.toFixed(2)} TND</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Reussies</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {transactions.filter((t) => t.status === "SUCCESS").length}
            </Text>
          </View>
        </View>

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        )}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && transactions.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
            <Text style={styles.emptySubtext}>Vos paiements apparaitront ici.</Text>
          </View>
        )}

        {/* Transaction list */}
        {transactions.map((tx) => {
          const typeConf = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.PAYMENT;
          const statusConf = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.SUCCESS;
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: typeConf.bg }]}>
                <MaterialCommunityIcons name={typeConf.icon as never} size={20} color={typeConf.color} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
                <Text style={styles.txRef} numberOfLines={1}>{tx.reference}</Text>
                <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: typeConf.color }]}>
                  {typeConf.prefix}{tx.amount.toFixed(2)} TND
                </Text>
                <View style={[styles.txStatusBadge, { backgroundColor: statusConf.color + "22" }]}>
                  <Text style={[styles.txStatusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  backBtn: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.cardBorder },
  summaryLabel: { fontSize: 10, color: colors.gray500, fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "700", color: colors.gray700 },
  emptySubtext: { fontSize: 13, color: colors.gray500 },
  errorText: { color: colors.error, fontSize: 13, textAlign: "center" },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    padding: 14,
  },
  txIcon: { width: 44, height: 44, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  txRef: { fontSize: 10, color: colors.gray400, fontFamily: "monospace" },
  txDate: { fontSize: 11, color: colors.gray500 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontWeight: "800" },
  txStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm },
  txStatusText: { fontSize: 10, fontWeight: "700" },
});

export default PaymentHistory;
