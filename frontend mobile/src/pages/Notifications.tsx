import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import { useAuth } from "@/lib/auth";
import { AppNotification, getNotifications, markNotificationAsRead } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  CREDIT_APPROVED: { icon: "check-circle-outline", color: "#22C55E" },
  CREDIT_REJECTED: { icon: "close-circle-outline", color: "#EF4444" },
  PAYMENT_CONFIRMED: { icon: "cash-check", color: "#22C55E" },
  PAYMENT_FAILED: { icon: "cash-remove", color: "#EF4444" },
  KYC_APPROVED: { icon: "shield-check-outline", color: "#22C55E" },
  KYC_REJECTED: { icon: "shield-off-outline", color: "#EF4444" },
  KYC_SUBMITTED: { icon: "shield-account-outline", color: "#F59E0B" },
  INSTALLMENT_DUE: { icon: "clock-alert-outline", color: "#F59E0B" },
  INSTALLMENT_OVERDUE: { icon: "clock-remove-outline", color: "#EF4444" },
  SCORE_UPDATE: { icon: "speedometer", color: "#6C63FF" },
  DEFAULT: { icon: "bell-outline", color: "#6b6b80" },
};

const getIconData = (type: string) => TYPE_ICON[type] ?? TYPE_ICON.DEFAULT;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const Notifications = () => {
  const { navigate } = useAppNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.userId);
      // Sort newest first
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      // keep old data
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRead = async (n: AppNotification) => {
    if (n.read) return;
    try {
      await markNotificationAsRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Home")} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.gray500} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {loading && (
          <Text style={styles.infoText}>Chargement...</Text>
        )}

        {!loading && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.gray500} />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        )}

        {notifications.map((n) => {
          const { icon, color } = getIconData(n.type);
          return (
            <Pressable
              key={n.id}
              onPress={() => handleRead(n)}
              style={[styles.notifCard, !n.read && styles.notifCardUnread]}
            >
              <View style={[styles.iconBox, { backgroundColor: color + "22" }]}>
                <MaterialCommunityIcons name={icon as never} size={20} color={color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTopRow}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{n.message}</Text>
                <Text style={styles.notifDate}>{formatDate(n.createdAt)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { padding: 8, backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder },
  headerText: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900 },
  badge: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  infoText: { fontSize: 13, color: colors.gray500, textAlign: "center", paddingTop: 24 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.gray500 },
  notifCard: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder },
  notifCardUnread: { borderColor: colors.primary + "40", backgroundColor: colors.primaryLight },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifBody: { flex: 1, gap: 4 },
  notifTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifMessage: { fontSize: 12, color: colors.gray600, lineHeight: 18 },
  notifDate: { fontSize: 11, color: colors.gray500 },
});

export default Notifications;
