import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { AppRoute, useAppNavigation } from "@/lib/app-navigation";
import {
  getCreadiScoreLatest,
  getCreditBalance,
  getKycStatus,
  getMyInstallments,
  getMyPayments,
  getProfile,
  getUnreadNotificationCount,
  getPopularArticles,
  CreditBalanceResult,
  Installment,
  KycStatusResult,
  PartnerArticle,
  Payment,
  RiskLevel,
  UserProfile,
  API_BASE_URL,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const promos = [
  { title: "0% interet", subtitle: "Chez Mytek jusqu'au 30 Oct" },
  { title: "Offre speciale", subtitle: "2x points fidelite Aziza" },
  { title: "Nouveau partenaire", subtitle: "IKEA maintenant disponible" },
];

const quickActions: Array<{ label: string; route: AppRoute; icon: string; color: string }> = [
  { label: "Creadi Score", route: "CreadiScore", icon: "speedometer", color: "#16a34a" },
  { label: "Boutique", route: "Shops", icon: "storefront-outline", color: "#6C63FF" },
  { label: "Mes Credits", route: "Credit", icon: "cash-fast", color: "#F59E0B" },
];

const toMoney = (value?: number) => `${Math.round(value ?? 0)} DT`;

const toPrettyDate = (dateIso?: string) => {
  if (!dateIso) {
    return "-";
  }
  const date = new Date(dateIso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const getInstallmentPriority = (status: Installment["status"]) => {
  if (status === "OVERDUE") {
    return 0;
  }
  if (status === "PENDING") {
    return 1;
  }
  return 2;
};

const Home = () => {
  const { navigate } = useAppNavigation();
  const { user, creditSyncVersion } = useAuth();
  const [promoIndex, setPromoIndex] = useState(0);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceResult | null>(null);
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [popularArticles, setPopularArticles] = useState<PartnerArticle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setPromoIndex((i) => (i + 1) % promos.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [installmentData, paymentData, scoreData, unreadData, kycData, profileData, balanceData, popularData] = await Promise.all([
          getMyInstallments(user.userId),
          getMyPayments(user.userId),
          getCreadiScoreLatest(user.userId).catch(() => null),
          getUnreadNotificationCount(user.userId),
          getKycStatus(user.userId).catch(() => null),
          getProfile(user.userId).catch(() => null),
          getCreditBalance(user.userId).catch(() => null),
          getPopularArticles(3).catch(() => [] as PartnerArticle[]),
        ]);

        setInstallments(installmentData);
        setPayments(paymentData);
        setScore(scoreData?.score ?? null);
        setCreditBalance(balanceData);
        setRiskLevel(scoreData?.risk ?? null);
        setKycStatus(kycData?.status ?? null);
        setUnreadCount(unreadData);
        setProfile(profileData);
        setPopularArticles(popularData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le tableau de bord.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, creditSyncVersion]);

  const nextInstallment = useMemo(() => {
    const dueItems = installments
      .filter((item) => item.status === "PENDING" || item.status === "OVERDUE")
      .sort((a, b) => {
        const statusDelta = getInstallmentPriority(a.status) - getInstallmentPriority(b.status);
        if (statusDelta !== 0) {
          return statusDelta;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

    return dueItems[0] ?? null;
  }, [installments]);

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
        .slice(0, 3),
    [payments],
  );

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Session expiree</Text>
          <Text style={styles.emptySubtitle}>Connectez-vous pour charger vos donnees.</Text>
          <Pressable style={styles.primarySmall} onPress={() => navigate("Login")}>
            <Text style={styles.primarySmallText}>Aller a la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {profile?.profilePhotoUrl ? (
              <Image source={{ uri: `${API_BASE_URL}${profile.profilePhotoUrl}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{`${user.firstName[0] ?? "U"}${user.lastName[0] ?? "S"}`}</Text></View>
            )}
            <View>
              <Text style={styles.hello}>Bonjour</Text>
              <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
            </View>
          </View>
          <Pressable style={styles.bell} onPress={() => navigate("Notifications")}>
            <MaterialCommunityIcons
              name={unreadCount > 0 ? "bell-badge" : "bell-outline"}
              size={18}
              color={unreadCount > 0 ? colors.primary : colors.gray500}
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {loading && <Text style={styles.infoText}>Chargement des donnees...</Text>}

        {/* ── CARD 1: Your Credit ── */}
        {(() => {
          const limit = creditBalance?.totalLimit ?? 0;
          const used = creditBalance?.usedCredit ?? 0;
          const available = creditBalance?.availableCredit ?? (limit - used);
          const usedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
          const barColor = usedPct >= 80 ? colors.error : usedPct >= 50 ? colors.warning : colors.success;
          return (
            <View style={styles.creditMainCard}>
              <View style={styles.creditMainHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creditMainLabel}>Votre Crédit</Text>
                  <Text style={styles.creditMainLimit}>{toMoney(limit)}</Text>
                  <Text style={styles.creditMainSublabel}>Limite totale</Text>
                </View>
                <View style={styles.creditMainRight}>
                  <Text style={styles.creditUsedLabel}>Utilisé</Text>
                  <Text style={styles.creditUsedValue}>{toMoney(used)}</Text>
                </View>
              </View>
              <View style={styles.creditBarTrack}>
                <View style={[styles.creditBarFill, { width: `${usedPct}%`, backgroundColor: barColor }]} />
              </View>
              <View style={styles.creditBarRow}>
                <Text style={styles.creditBarPct}>{usedPct}% utilisé</Text>
                <Text style={styles.creditAvailText}>
                  <Text style={styles.creditAvailAmount}>{toMoney(available)}</Text>
                  {" disponible"}
                </Text>
              </View>
              {nextInstallment && (
                <View style={styles.creditNextRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.creditNextText}>
                    Prochain paiement : <Text style={{ fontWeight: "800" }}>{toMoney(nextInstallment.amount)}</Text>
                    {" le "}<Text style={{ fontWeight: "800" }}>{toPrettyDate(nextInstallment.dueDate)}</Text>
                  </Text>
                  <Pressable style={styles.creditPayBtn} onPress={() => navigate("Installments")}>
                    <Text style={styles.creditPayBtnText}>Payer</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })()}

        {/* ── CARD 2: Credit Health ── */}
        {(() => {
          const isGood = riskLevel === "LOW" || (score !== null && score >= 700);
          const isMed  = riskLevel === "MODERATE" || (score !== null && score >= 500 && score < 700);
          const isRisk = riskLevel === "HIGH" || riskLevel === "CRITICAL" || (score !== null && score < 500);
          const label  = isGood ? "Bonne santé" : isMed ? "Moyen" : isRisk ? "À risque" : "En évaluation";
          const icon   = isGood ? "shield-check" : isMed ? "shield-alert" : isRisk ? "shield-off" : "shield-outline";
          const bg     = isGood ? "#0d2818" : isMed ? "#2d1f00" : isRisk ? "#2d0a0a" : colors.surface;
          const fg     = isGood ? colors.success : isMed ? colors.warning : isRisk ? colors.error : colors.gray500;
          return (
            <View style={[styles.healthCard, { backgroundColor: bg, borderColor: fg + "44" }]}>
              <MaterialCommunityIcons name={icon as never} size={28} color={fg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.healthTitle}>Santé du Crédit</Text>
                <Text style={[styles.healthLabel, { color: fg }]}>{label}</Text>
              </View>
              {score !== null && (
                <Pressable onPress={() => navigate("CreadiScore")}>
                  <Text style={[styles.healthScore, { color: fg }]}>{score}/1000</Text>
                  <Text style={styles.healthScoreSub}>Score</Text>
                </Pressable>
              )}
            </View>
          );
        })()}

        {kycStatus === "APPROVED" ? (
          <View style={styles.kycApprovedCard}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
            <Text style={styles.kycApprovedText}>Identité vérifiée</Text>
          </View>
        ) : (
          <Pressable style={styles.kycCard} onPress={() => navigate("Kyc")}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.primary} />
            <Text style={styles.kycPendingText}>Verifier votre identite</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.gray400} style={{ marginLeft: "auto" }} />
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Acces rapide</Text>
        <View style={styles.actionRow}>
          {quickActions.map((action) => (
            <Pressable key={action.label} style={styles.actionCard} onPress={() => navigate(action.route)}>
              <View style={[styles.actionIconWrap, { backgroundColor: action.color }]}>
                <MaterialCommunityIcons name={action.icon as never} size={18} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.ctaButton} onPress={() => navigate("Credit")}>
          <MaterialCommunityIcons name="cash-fast" size={18} color="#fff" />
          <Text style={styles.ctaText}>Demander un credit maintenant</Text>
        </Pressable>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>{promos[promoIndex].title}</Text>
          <Text style={styles.promoSub}>{promos[promoIndex].subtitle}</Text>
        </View>

        {/* ── Popular Products ── */}
        {popularArticles.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Produits Populaires</Text>
              <Pressable onPress={() => navigate("Shops")}><Text style={styles.link}>Voir plus</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {popularArticles.map((article) => (
                <Pressable
                  key={article.id}
                  style={styles.popularCard}
                  onPress={() => navigate("Credit", { prefillAmount: article.price, productName: article.productName })}
                >
                  {article.imageUrl ? (
                    <Image source={{ uri: article.imageUrl }} style={styles.popularImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.popularImage, { backgroundColor: colors.gray300, alignItems: "center", justifyContent: "center" }]}>
                      <MaterialCommunityIcons name="image-off-outline" size={24} color={colors.gray500} />
                    </View>
                  )}
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularName} numberOfLines={2}>{article.productName}</Text>
                    <Text style={styles.popularShop} numberOfLines={1}>{article.boutiqueName}</Text>
                    <Text style={styles.popularPrice}>{article.price.toLocaleString("fr-TN")} TND</Text>
                    <Pressable
                      style={styles.popularBuy}
                      onPress={() => navigate("Credit", { prefillAmount: article.price, productName: article.productName })}
                    >
                      <Text style={styles.popularBuyText}>Acheter</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.sectionTitle}>Recent</Text>
        <View style={styles.listCard}>
          {recentPayments.map((txn) => (
            <View key={txn.id} style={styles.listRow}>
              <View>
                <Text style={styles.txnLabel}>{`Paiement #${txn.installmentId}`}</Text>
                <Text style={styles.txnDate}>{toPrettyDate(txn.paidAt)}</Text>
              </View>
              <Text style={styles.txnAmount}>{`-${toMoney(txn.amount)}`}</Text>
            </View>
          ))}
          {recentPayments.length === 0 && <Text style={styles.emptyListText}>Aucun paiement recent.</Text>}
        </View>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: radii.xl, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 48, height: 48, borderRadius: radii.xl },
  avatarText: { color: colors.white, fontWeight: "700" },
  hello: { fontSize: 12, color: colors.gray500 },
  name: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  bell: { width: 40, height: 40, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -4, right: -4, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  // ── Credit main card ──
  creditMainCard: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: 20, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  creditMainHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  creditMainLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  creditMainLimit: { color: "#ffffff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  creditMainSublabel: { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 },
  creditMainRight: { alignItems: "flex-end" },
  creditUsedLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  creditUsedValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  creditBarTrack: { height: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 6 },
  creditBarFill: { height: "100%", borderRadius: 6 },
  creditBarRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  creditBarPct: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700" },
  creditAvailText: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  creditAvailAmount: { color: "#ffffff", fontWeight: "800" },
  creditNextRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", flexDirection: "row", alignItems: "center", gap: 6 },
  creditNextText: { flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 12 },
  creditPayBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.md },
  creditPayBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  // ── Credit health card ──
  healthCard: { borderRadius: radii.xl, borderWidth: 1.5, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  healthTitle: { fontSize: 11, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  healthLabel: { fontSize: 17, fontWeight: "800", marginTop: 3 },
  healthScore: { fontSize: 20, fontWeight: "800", textAlign: "right" },
  healthScoreSub: { fontSize: 10, color: colors.gray500, textAlign: "right", fontWeight: "700", textTransform: "uppercase" },

  // ── Legacy kept for other parts of the layout ──
  balanceCard: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: 18 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  balanceValue: { color: "#ffffff", fontSize: 30, fontWeight: "700", marginTop: 6 },
  creditStatsRow: { flexDirection: "row", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  creditStat: { flex: 1, alignItems: "center" },
  creditStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  creditStatValue: { color: "#ffffff", fontSize: 14, fontWeight: "700", marginTop: 2 },
  creditStatDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  riskRow: { marginTop: 8 },
  riskBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full, backgroundColor: "rgba(255,255,255,0.2)" },
  riskLow: { backgroundColor: "rgba(16,185,129,0.3)" },
  riskModerate: { backgroundColor: "rgba(245,158,11,0.3)" },
  riskHigh: { backgroundColor: "rgba(239,68,68,0.3)" },
  riskCritical: { backgroundColor: "rgba(239,68,68,0.5)" },
  riskBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  balanceBottom: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceHint: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  balanceDate: { color: "#ffffff", fontSize: 12, marginTop: 2 },
  primarySmall: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.md },
  primarySmallText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  scoreCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.lg, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  scoreSub: { fontSize: 13, color: colors.primary, fontWeight: "800" },
  kycCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary + "30", borderRadius: radii.lg, padding: 12 },
  kycPendingText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  kycApprovedCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0d2818", borderWidth: 1, borderColor: colors.success + "30", borderRadius: radii.lg, padding: 12 },
  kycApprovedText: { fontSize: 12, fontWeight: "700", color: colors.success },
  sectionTitle: { fontSize: 12, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 12, minHeight: 92, justifyContent: "center", alignItems: "center", gap: 8 },
  actionIconWrap: { width: 34, height: 34, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 11, textAlign: "center", fontWeight: "700", color: colors.gray900 },
  ctaButton: { marginTop: 2, backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { color: colors.white, fontWeight: "700" },
  promoCard: { backgroundColor: colors.primary, borderRadius: radii.xl, padding: 14 },
  promoTitle: { color: colors.white, fontWeight: "700", fontSize: 14 },
  promoSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  link: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  listCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, overflow: "hidden" },
  listRow: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  txnLabel: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  txnDate: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  txnAmount: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  emptyListText: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 12, color: colors.gray500 },
  infoText: { fontSize: 12, color: colors.gray500, marginBottom: 6 },
  errorText: { fontSize: 12, color: colors.error, marginBottom: 6 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  emptySubtitle: { fontSize: 13, color: colors.gray500, textAlign: "center" },

  // ── Popular Products ──
  popularCard: { width: 148, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  popularImage: { width: 148, height: 110 },
  popularInfo: { padding: 10, gap: 4 },
  popularName: { fontSize: 12, fontWeight: "700", color: colors.gray900, lineHeight: 16 },
  popularShop: { fontSize: 10, color: colors.gray500 },
  popularPrice: { fontSize: 13, fontWeight: "800", color: colors.primary },
  popularBuy: { marginTop: 6, backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 7, alignItems: "center" },
  popularBuyText: { color: colors.white, fontSize: 11, fontWeight: "800" },
});

export default Home;
