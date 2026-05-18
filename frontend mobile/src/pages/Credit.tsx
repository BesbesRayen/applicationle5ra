import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import {
  checkoutArticlePurchase,
  CreditBalanceResult,
  CreditSimulationResult,
  getDashboard,
  getCreditBalance,
  PurchaseOrderResult,
  PurchasePaymentType,
  requestCredit,
  simulateCredit,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const toDt = (value: number) => `${Math.round(value)} DT`;

const Credit = () => {
  const { user, creditSyncVersion } = useAuth();
  const { navigate, params } = useAppNavigation();
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(3);
  const [confirmed, setConfirmed] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [lastOrder, setLastOrder] = useState<PurchaseOrderResult | null>(null);
  const [paymentMode, setPaymentMode] = useState<PurchasePaymentType>("CREDIT");
  const [simulation, setSimulation] = useState<CreditSimulationResult | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [blockingStep, setBlockingStep] = useState<"ADD_CARD" | "COMPLETE_FINANCIAL_PROFILE" | null>(null);

  const articleId = Number(params?.articleId ?? 0);
  const isArticleCheckout = articleId > 0;
  const prefillAmount = Number(params?.prefillAmount ?? 0);
  const selectedProductName = String(params?.productName ?? "");
  const selectedBoutiqueName = String(params?.boutiqueName ?? "");
  const selectedProductImage = String(params?.productImageUrl ?? "");

  const requestedDownPayment = useMemo(() => Math.round(amount * 0.2), [amount]);
  const downPayment = paymentMode === "CASH" ? amount : (simulation?.downPayment ?? requestedDownPayment);
  const monthlyPayment = simulation?.monthlyAmount ?? 0;
  const totalCost = paymentMode === "CASH" ? amount : (simulation?.totalPayable ?? 0);
  const effectiveMonths = paymentMode === "CASH" ? 1 : months;
  const effectiveDownPayment = downPayment;
  const effectiveMonthly = paymentMode === "CASH" ? amount : monthlyPayment;
  const financedAmount = paymentMode === "CASH" ? 0 : (simulation?.financedAmount ?? Math.max(0, amount - requestedDownPayment));
  const needsCreditChecks = !isArticleCheckout || paymentMode === "CREDIT";
  const interestRates: Record<number, string> = { 3: "0%", 6: "3%", 9: "6%", 12: "12%" };
  const monthOptions = [3, 6, 9, 12];

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [balanceData, dashboard] = await Promise.all([
            getCreditBalance(user.userId),
            getDashboard(user.userId),
          ]);
          setCreditLimit(balanceData.availableCredit);
          setCreditBalance(balanceData);
          if (needsCreditChecks && (dashboard.nextStep === "ADD_CARD" || dashboard.nextStep === "COMPLETE_FINANCIAL_PROFILE")) {
            setBlockingStep(dashboard.nextStep);
          } else {
            setBlockingStep(null);
          }
        } catch {
          setCreditLimit(0);
        }
      }
    };

    loadData();
  }, [user, creditSyncVersion, needsCreditChecks]);

  useEffect(() => {
    if (prefillAmount > 0) {
      setAmount(Math.round(prefillAmount));
    }
  }, [prefillAmount]);

  useEffect(() => {
    const loadSimulation = async () => {
      if (paymentMode === "CASH") {
        setSimulation(null);
        setSimulationLoading(false);
        return;
      }

      setSimulationLoading(true);
      try {
        const result = await simulateCredit({
          totalAmount: amount,
          downPayment: requestedDownPayment,
          numberOfInstallments: months,
        });
        setSimulation(result);
      } catch {
        setSimulation(null);
      } finally {
        setSimulationLoading(false);
      }
    };

    loadSimulation();
  }, [amount, requestedDownPayment, months, paymentMode]);

  const handleConfirmRequest = async () => {
    if (!user) {
      navigate("Login");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      if (isArticleCheckout) {
        const order = await checkoutArticlePurchase(user.userId, {
          articleId,
          paymentType: paymentMode,
          installmentMonths: paymentMode === "CREDIT" ? months : undefined,
          productName: selectedProductName || undefined,
          description: selectedProductName ? `Mobile catalog purchase: ${selectedProductName}` : undefined,
          price: amount,
          imageUrl: selectedProductImage || undefined,
          boutiqueName: selectedBoutiqueName || undefined,
          category: "PARTNER_CATALOG",
        });
        setLastOrder(order);
        setRequestId(order.id);
        setConfirmed(true);
        return;
      }

      const result = await requestCredit(user.userId, {
        totalAmount: amount,
        downPayment,
        numberOfInstallments: months,
        productName: selectedProductName || undefined,
      });
      setRequestId(result.id);
      setLastOrder(null);
      setConfirmed(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Demande de credit echouee.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.confirmedWrap}>
          <Text style={styles.confirmedTitle}>Session requise</Text>
          <Text style={styles.confirmedSub}>Connectez-vous pour faire une demande de credit.</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Aller a la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  if (confirmed) {
    const confirmationTitle = lastOrder
      ? (lastOrder.paymentType === "CASH" ? "Paiement comptant confirme" : "Achat credit confirme")
      : "Demande Confirmee";

    return (
      <MobileLayout>
        <View style={styles.confirmedWrap}>
          <View style={styles.confirmedIcon}><Text style={styles.confirmedIconText}>✓</Text></View>
          <View>
            <Text style={styles.confirmedTitle}>{confirmationTitle}</Text>
            <Text style={styles.confirmedSub}>
              {toDt(amount)} {lastOrder ? `- ${lastOrder.articleName}` : `en ${months} mensualites`}
            </Text>
            {requestId !== null && <Text style={styles.confirmedSub}>{`Reference #${requestId}`}</Text>}
            {!!lastOrder?.transactionId && (
              <Text style={styles.confirmedSub}>{`Transaction ${lastOrder.transactionId}`}</Text>
            )}
            {!!lastOrder?.invoiceId && (
              <Text style={styles.confirmedSub}>{`Facture admin #${lastOrder.invoiceId} generee`}</Text>
            )}
          </View>
          <Pressable onPress={() => setConfirmed(false)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{lastOrder ? "Nouvel achat" : "Nouvelle Demande"}</Text>
          </Pressable>
        </View>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Demande de Credit</Text>
        <Text style={styles.subtitle}>Simulez votre plan de paiement</Text>

        {creditBalance !== null && (
          <View style={styles.limitCard}>
            {/* Header row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={styles.limitLabel}>Mon Credit</Text>
              {creditBalance.totalLimit > 0 && (
                <Text style={{ fontSize: 11, color: colors.gray500 }}>
                  {Math.round((creditBalance.usedCredit / creditBalance.totalLimit) * 100)}% utilise
                </Text>
              )}
            </View>
            {/* Three stats */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={styles.creditStat}>
                <Text style={styles.creditStatLabel}>Total</Text>
                <Text style={[styles.creditStatValue, { color: colors.primary }]}>{toDt(creditBalance.totalLimit)}</Text>
              </View>
              <View style={styles.creditStat}>
                <Text style={styles.creditStatLabel}>Utilise</Text>
                <Text style={[styles.creditStatValue, { color: colors.warning }]}>{toDt(creditBalance.usedCredit)}</Text>
              </View>
              <View style={styles.creditStat}>
                <Text style={styles.creditStatLabel}>Disponible</Text>
                <Text style={[styles.creditStatValue, { color: colors.success }]}>{toDt(creditBalance.availableCredit)}</Text>
              </View>
            </View>
            {/* Progress bar */}
            {creditBalance.totalLimit > 0 && (
              <View style={styles.creditBar}>
                <View
                  style={[
                    styles.creditBarFill,
                    {
                      width: `${Math.min(100, Math.round((creditBalance.usedCredit / creditBalance.totalLimit) * 100))}%`,
                      backgroundColor:
                        creditBalance.usedCredit / creditBalance.totalLimit >= 0.8
                          ? colors.error
                          : creditBalance.usedCredit / creditBalance.totalLimit >= 0.5
                          ? colors.warning
                          : colors.success,
                    },
                  ]}
                />
              </View>
            )}
            {needsCreditChecks && creditBalance.availableCredit <= 0 && (
              <Text style={styles.limitWarning}>Aucun credit disponible. Verifiez votre KYC et profil financier.</Text>
            )}
          </View>
        )}

        {!!selectedProductName && (
          <View style={styles.prefillCard}>
            <Text style={styles.prefillTitle}>Achat Creadi</Text>
            <Text style={styles.prefillText}>{selectedProductName}</Text>
            <Text style={styles.prefillHint}>
              {isArticleCheckout
                ? "Choisissez paiement comptant ou credit (3/6/9/12 mois)."
                : "Montant pre-rempli depuis le produit selectionne."}
            </Text>
          </View>
        )}

        {isArticleCheckout && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Mode de paiement</Text>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeChip, paymentMode === "CASH" && styles.modeChipActive]}
                onPress={() => setPaymentMode("CASH")}
              >
                <Text style={[styles.modeChipText, paymentMode === "CASH" && styles.modeChipTextActive]}>Comptant</Text>
              </Pressable>
              <Pressable
                style={[styles.modeChip, paymentMode === "CREDIT" && styles.modeChipActive]}
                onPress={() => setPaymentMode("CREDIT")}
              >
                <Text style={[styles.modeChipText, paymentMode === "CREDIT" && styles.modeChipTextActive]}>Credit</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Montant</Text>
          <Text style={styles.amount}>{toDt(amount)}</Text>
          <View style={styles.rangeRow}>
            {[100, 500, 1000, 2500, 5000].map((a) => (
              <Pressable
                key={a}
                style={[styles.amountChip, amount === a && styles.amountChipActive]}
                disabled={isArticleCheckout}
                onPress={() => setAmount(a)}
              >
                <Text style={[styles.amountChipText, amount === a && styles.amountChipTextActive]}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {(!isArticleCheckout || paymentMode === "CREDIT") && (
        <View>
          <Text style={styles.cardLabel}>Mensualites</Text>
          <View style={styles.monthRow}>
            {monthOptions.map((m) => (
              <Pressable key={m} style={[styles.monthChip, months === m && styles.monthChipActive]} onPress={() => setMonths(m)}>
                <Text style={[styles.monthChipText, months === m && styles.monthChipTextActive]}>{m} mois</Text>
                <Text style={[styles.monthChipInterest, months === m && { color: "rgba(255,255,255,0.75)" }]}>{interestRates[m]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resume</Text>
          {paymentMode === "CREDIT" && simulationLoading && (
            <View style={styles.summaryRow}><Text style={styles.summaryKey}>Simulation</Text><Text style={styles.summaryValue}>Calcul...</Text></View>
          )}
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Mensualite</Text><Text style={styles.summaryValue}>{paymentMode === "CASH" || simulation ? toDt(effectiveMonthly) : "..."}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Apport</Text><Text style={styles.summaryValue}>{toDt(effectiveDownPayment)}</Text></View>
          {paymentMode === "CREDIT" && simulation && (
            <>
              <View style={styles.summaryRow}><Text style={styles.summaryKey}>Montant finance</Text><Text style={styles.summaryValue}>{toDt(simulation.financedAmount)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryKey}>Interet</Text><Text style={styles.summaryValue}>{`${(simulation.interestRate * 100).toFixed(0)}% - ${toDt(simulation.interestAmount)}`}</Text></View>
            </>
          )}
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Total a payer</Text><Text style={styles.summaryValue}>{paymentMode === "CASH" || simulation ? toDt(totalCost) : "..."}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Duree</Text><Text style={styles.summaryValue}>{effectiveMonths} mois</Text></View>
        </View>

        {paymentMode === "CREDIT" && simulation && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Echeancier Klarna-style</Text>
            {Array.from({ length: months }).map((_, index) => {
              const dueDate = new Date();
              dueDate.setMonth(dueDate.getMonth() + index + 1);
              const dueLabel = dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <View key={index} style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Mois {index + 1} - {dueLabel}</Text>
                  <Text style={styles.summaryValue}>{toDt(monthlyPayment)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {needsCreditChecks && creditLimit !== null && financedAmount > creditLimit && (
          <View style={styles.overLimitCard}>
            <Text style={styles.overLimitText}>Le montant finance ({toDt(financedAmount)}) depasse votre limite de credit ({toDt(creditLimit)}).</Text>
          </View>
        )}

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Pressable
          onPress={handleConfirmRequest}
          style={[
            styles.primaryButton,
            (loading || simulationLoading || (paymentMode === "CREDIT" && !simulation) || (needsCreditChecks && creditLimit !== null && financedAmount > creditLimit) || (needsCreditChecks && creditLimit !== null && creditLimit <= 0)) && styles.primaryButtonDisabled,
          ]}
          disabled={loading || simulationLoading || (paymentMode === "CREDIT" && !simulation) || (needsCreditChecks && creditLimit !== null && financedAmount > creditLimit) || (needsCreditChecks && creditLimit !== null && creditLimit <= 0)}
        >
          <Text style={styles.primaryButtonText}>
            {loading
              ? "Envoi en cours..."
              : isArticleCheckout
                ? (paymentMode === "CASH" ? "Payer comptant" : "Acheter avec credit")
                : "Confirmer la demande"}
          </Text>
        </Pressable>
      </ScrollView>
      <BottomNav />

      {/* Blocking onboarding modal */}
      <Modal visible={!!blockingStep} transparent animationType="fade">
        <View style={styles.blockingOverlay}>
          <View style={styles.blockingCard}>
            <Text style={styles.blockingTitle}>
              {blockingStep === "ADD_CARD" ? "Payment card required" : "Financial profile required"}
            </Text>
            <Text style={styles.blockingDesc}>
              {blockingStep === "ADD_CARD"
                ? "You need to add a payment card before requesting credit."
                : "You need to complete your financial profile to access BNPL credit."}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => { setBlockingStep(null); navigate(blockingStep === "ADD_CARD" ? "Cards" : "FinancialProfile"); }}
            >
              <Text style={styles.primaryButtonText}>
                {blockingStep === "ADD_CARD" ? "Add a Card" : "Complete Profile"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.gray500 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 14 },
  cardLabel: { fontSize: 12, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  amount: { marginTop: 10, fontSize: 30, fontWeight: "700", color: colors.gray900 },
  rangeRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amountChip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  amountChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  amountChipText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  amountChipTextActive: { color: colors.white },
  monthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  modeRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    paddingVertical: 11,
    alignItems: "center",
  },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipText: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  modeChipTextActive: { color: colors.white },
  monthChip: { width: "23%", minWidth: 70, alignItems: "center", paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  monthChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthChipText: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  monthChipTextActive: { color: colors.white },
  monthChipInterest: { fontSize: 10, color: colors.gray500, fontWeight: "600" },
  summaryCard: { borderRadius: radii.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, gap: 8 },
  summaryTitle: { color: colors.gray400, fontSize: 12, textTransform: "uppercase", fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { color: colors.gray400, fontSize: 13 },
  summaryValue: { color: colors.gray900, fontSize: 13, fontWeight: "700" },
  prefillCard: { borderWidth: 1, borderColor: colors.primaryLight, backgroundColor: colors.primaryBg, borderRadius: radii.lg, padding: 12, gap: 4 },
  prefillTitle: { fontSize: 11, color: colors.primary, fontWeight: "800", textTransform: "uppercase" },
  prefillText: { fontSize: 14, color: colors.gray900, fontWeight: "700" },
  prefillHint: { fontSize: 12, color: colors.gray500 },
  primaryButton: { marginTop: 4, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 15, alignItems: "center", shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  limitCard: { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary + "30", borderRadius: radii.lg, padding: 14, gap: 4 },
  limitLabel: { fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  limitValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  limitWarning: { fontSize: 12, color: colors.error, marginTop: 4 },
  creditStat: { flex: 1, backgroundColor: colors.card, borderRadius: radii.md, padding: 10, alignItems: "center", gap: 2 },
  creditStatLabel: { fontSize: 10, color: colors.gray500, fontWeight: "600", textTransform: "uppercase" },
  creditStatValue: { fontSize: 14, fontWeight: "800" },
  creditBar: { height: 6, backgroundColor: colors.gray200, borderRadius: 3, overflow: "hidden", marginTop: 10 },
  creditBarFill: { height: 6, borderRadius: 3 },
  overLimitCard: { backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: radii.lg, padding: 12 },
  overLimitText: { fontSize: 12, color: colors.error, fontWeight: "600" },
  confirmedWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  confirmedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentLight, alignItems: "center", justifyContent: "center" },
  confirmedIconText: { fontSize: 40, color: colors.success },
  confirmedTitle: { textAlign: "center", fontSize: 22, fontWeight: "700", color: colors.gray900 },
  confirmedSub: { marginTop: 6, textAlign: "center", color: colors.gray500 },
  errorText: { marginTop: 2, color: colors.error, fontSize: 12 },
  blockingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 24 },
  blockingCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: 24, gap: 12, width: "100%" },
  blockingTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  blockingDesc: { fontSize: 14, color: colors.gray500, lineHeight: 20 },
});

export default Credit;
