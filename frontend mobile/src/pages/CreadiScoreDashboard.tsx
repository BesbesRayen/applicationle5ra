import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import { useAuth } from "@/lib/auth";
import {
  calculateCreadiScore,
  getCreadiScoreLatest,
  CreadiScoreResult,
  ScoreLevel,
} from "@/lib/api";
import { colors, radii } from "@/lib/theme";

// ── Color mapping ───────────────────────────────────────────
const LEVEL_COLORS: Record<ScoreLevel, string> = {
  EXCELLENT: "#16a34a",
  GOOD: "#eab308",
  MEDIUM: "#f97316",
  HIGH_RISK: "#dc2626",
};

const LEVEL_LABELS: Record<ScoreLevel, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  MEDIUM: "Medium",
  HIGH_RISK: "High Risk",
};

const LEVEL_ICONS: Record<ScoreLevel, string> = {
  EXCELLENT: "shield-check",
  GOOD: "shield-half-full",
  MEDIUM: "shield-alert-outline",
  HIGH_RISK: "shield-off-outline",
};

const BADGE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  GOLD: { bg: "#fef3c7", text: "#92400e", icon: "trophy" },
  SILVER: { bg: "#f1f5f9", text: "#475569", icon: "trophy-variant" },
  BRONZE: { bg: "#fed7aa", text: "#9a3412", icon: "trophy-outline" },
};

const MAX_SCORE = 1000;
const RING_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Score Ring Component ────────────────────────────────────
const ScoreRing = ({ score, level }: { score: number; level: ScoreLevel }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const color = LEVEL_COLORS[level];

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: score / MAX_SCORE,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={s.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={colors.gray200}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={s.ringCenter}>
        <Text style={[s.scoreNumber, { color }]}>{score}</Text>
        <Text style={s.scoreMax}>/ {MAX_SCORE}</Text>
      </View>
    </View>
  );
};

// ── Breakdown Bar ───────────────────────────────────────────
const BreakdownBar = ({
  label,
  value,
  max,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  icon: string;
}) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#eab308" : "#dc2626";

  return (
    <View style={s.breakdownRow}>
      <View style={s.breakdownLabelRow}>
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={16}
          color={colors.gray500}
        />
        <Text style={s.breakdownLabel}>{label}</Text>
        <Text style={s.breakdownValue}>
          {value}/{max}
        </Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
};

// ── Main Page ───────────────────────────────────────────────
const CreadiScoreDashboard = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  const { navigate } = useAppNavigation();
  const [data, setData] = useState<CreadiScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCreadiScoreLatest(userId);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const handleCalculate = async () => {
    if (!userId) return;
    setCalculating(true);
    setError(null);
    try {
      const result = await calculateCreadiScore(userId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to calculate score");
    } finally {
      setCalculating(false);
    }
  };

  const levelColor = data ? LEVEL_COLORS[data.level] : colors.gray400;

  return (
    <MobileLayout>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────── */}
        <View style={s.header}>
          <Pressable onPress={() => navigate("Home")} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray700} />
          </Pressable>
          <Text style={s.headerTitle}>Creadi Score</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={s.centered}>
            <MaterialCommunityIcons name="loading" size={36} color={colors.primary} />
            <Text style={s.loadingText}>Loading your score...</Text>
          </View>
        ) : (
          <>
            {/* ── Score Ring ────────────────────────── */}
            <View style={s.ringCard}>
              {data ? (
                <>
                  <ScoreRing score={data.score} level={data.level} />
                  <View style={[s.levelBadge, { backgroundColor: levelColor + "18" }]}>
                    <MaterialCommunityIcons
                      name={
                        LEVEL_ICONS[data.level] as keyof typeof MaterialCommunityIcons.glyphMap
                      }
                      size={18}
                      color={levelColor}
                    />
                    <Text style={[s.levelText, { color: levelColor }]}>
                      {LEVEL_LABELS[data.level]}
                    </Text>
                  </View>
                  <Text style={s.reason}>{data.reason}</Text>

                  {/* Badge */}
                  {data.badge && BADGE_COLORS[data.badge] && (
                    <View
                      style={[
                        s.badgeChip,
                        { backgroundColor: BADGE_COLORS[data.badge].bg },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          BADGE_COLORS[data.badge].icon as keyof typeof MaterialCommunityIcons.glyphMap
                        }
                        size={16}
                        color={BADGE_COLORS[data.badge].text}
                      />
                      <Text
                        style={[
                          s.badgeText,
                          { color: BADGE_COLORS[data.badge].text },
                        ]}
                      >
                        {data.badge} Member
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={s.emptyState}>
                  <MaterialCommunityIcons
                    name="speedometer"
                    size={64}
                    color={colors.gray300}
                  />
                  <Text style={s.emptyTitle}>No Score Yet</Text>
                  <Text style={s.emptySubtitle}>
                    Calculate your Creadi Score to see your financial health
                  </Text>
                </View>
              )}

              {/* Calculate / Recalculate button */}
              <Pressable
                style={[s.calcButton, calculating && s.calcButtonDisabled]}
                onPress={handleCalculate}
                disabled={calculating}
              >
                <MaterialCommunityIcons
                  name={calculating ? "loading" : "calculator-variant-outline"}
                  size={18}
                  color={colors.white}
                />
                <Text style={s.calcButtonText}>
                  {calculating
                    ? "Calculating..."
                    : data
                      ? "Recalculate Score"
                      : "Calculate My Score"}
                </Text>
              </Pressable>

              {error && <Text style={s.errorText}>{error}</Text>}
            </View>

            {data && (
              <>
                {/* ── Credit Limit ──────────────────── */}
                <View style={s.limitCard}>
                  <View style={s.limitRow}>
                    <View>
                      <Text style={s.limitLabel}>Max Credit Limit</Text>
                      <Text style={s.limitValue}>
                        {data.maxCreditLimit > 0
                          ? `${data.maxCreditLimit.toLocaleString()} TND`
                          : "Not eligible"}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.bnplStatus,
                        {
                          backgroundColor:
                            data.score >= 800
                              ? "#0d2e23"
                              : data.score >= 600
                                ? "#2d2410"
                                : "#2d1515",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.bnplStatusText,
                          {
                            color:
                              data.score >= 800
                                ? "#34d399"
                                : data.score >= 600
                                  ? "#fbbf24"
                                  : "#f87171",
                          },
                        ]}
                      >
                        {data.score >= 800
                          ? "Full BNPL"
                          : data.score >= 600
                            ? "Limited BNPL"
                            : "Not Eligible"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── Score Breakdown ───────────────── */}
                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Score Breakdown</Text>
                  <BreakdownBar
                    label="KYC Verification"
                    value={data.kycScore}
                    max={300}
                    icon="card-account-details-outline"
                  />
                  <BreakdownBar
                    label="Monthly Salary"
                    value={data.salaryScore}
                    max={300}
                    icon="cash"
                  />
                  <BreakdownBar
                    label="Marital Status"
                    value={data.maritalScore}
                    max={100}
                    icon="account-heart"
                  />
                  <BreakdownBar
                    label="Dependents"
                    value={data.childrenScore}
                    max={100}
                    icon="account-group"
                  />
                  <BreakdownBar
                    label="Behavior"
                    value={data.behaviorScore}
                    max={200}
                    icon="chart-timeline-variant"
                  />
                </View>

                {/* ── Improvement Tips ─────────────── */}
                {data.improvementTips.length > 0 && (
                  <View style={s.sectionCard}>
                    <Text style={s.sectionTitle}>Improve Your Score</Text>
                    {data.improvementTips.map((tip, i) => (
                      <View key={i} style={s.tipRow}>
                        <MaterialCommunityIcons
                          name="lightbulb-on-outline"
                          size={16}
                          color={colors.warning}
                        />
                        <Text style={s.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── History ──────────────────────── */}
                {data.history.length > 1 && (
                  <View style={s.sectionCard}>
                    <Text style={s.sectionTitle}>Score History</Text>
                    {data.history.slice(0, 5).map((h, i) => (
                      <View key={i} style={s.historyRow}>
                        <View
                          style={[
                            s.historyDot,
                            { backgroundColor: LEVEL_COLORS[h.level] },
                          ]}
                        />
                        <Text style={s.historyScore}>{h.score}</Text>
                        <Text style={s.historyLevel}>
                          {LEVEL_LABELS[h.level]}
                        </Text>
                        <Text style={s.historyDate}>
                          {new Date(h.date).toLocaleDateString("fr-TN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── Quick Actions ────────────────── */}
                <View style={s.actionsRow}>
                  <Pressable
                    style={s.actionCard}
                    onPress={() => navigate("Kyc")}
                  >
                    <MaterialCommunityIcons
                      name="card-account-details-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={s.actionLabel}>Complete KYC</Text>
                  </Pressable>
                  <Pressable
                    style={s.actionCard}
                    onPress={() => navigate("Credit")}
                  >
                    <MaterialCommunityIcons
                      name="credit-card-outline"
                      size={22}
                      color={colors.accent}
                    />
                    <Text style={s.actionLabel}>Request Credit</Text>
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

// ── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray900,
  },

  centered: { alignItems: "center", marginTop: 80 },
  loadingText: { marginTop: 12, color: colors.gray500, fontSize: 14 },

  // Ring card
  ringCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: "600",
    marginTop: -2,
  },

  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginTop: 14,
  },
  levelText: { fontWeight: "700", fontSize: 14 },

  reason: {
    marginTop: 12,
    fontSize: 13,
    color: colors.gray600,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginTop: 10,
  },
  badgeText: { fontWeight: "700", fontSize: 12 },

  calcButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: 18,
    width: "100%",
  },
  calcButtonDisabled: { opacity: 0.6 },
  calcButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },

  emptyState: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.gray700,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 19,
  },

  // Credit limit card
  limitCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  limitLabel: { fontSize: 12, color: colors.gray500, fontWeight: "600" },
  limitValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.gray900,
    marginTop: 2,
  },
  bnplStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  bnplStatusText: { fontSize: 12, fontWeight: "700" },

  // Section cards
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: 14,
  },

  // Breakdown bars
  breakdownRow: { marginBottom: 14 },
  breakdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  breakdownLabel: { flex: 1, fontSize: 13, color: colors.gray700, fontWeight: "500" },
  breakdownValue: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  barTrack: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: radii.full },

  // Tips
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  tipText: { flex: 1, fontSize: 13, color: colors.gray700, lineHeight: 19 },

  // History
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyScore: { fontSize: 16, fontWeight: "700", color: colors.gray900, width: 50 },
  historyLevel: { flex: 1, fontSize: 13, color: colors.gray600 },
  historyDate: { fontSize: 12, color: colors.gray400 },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray700,
    textAlign: "center",
  },
});

export default CreadiScoreDashboard;
