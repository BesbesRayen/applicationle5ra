import { useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { checkoutArticlePurchase, API_BASE_URL, CreditSimulationResult, simulateCredit } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const INSTALLMENT_PLANS = [
  { months: 0,  label: "Paiement comptant", interest: 0 },
  { months: 3,  label: "3 mois",            interest: 0 },
  { months: 6,  label: "6 mois",            interest: 3 },
  { months: 9,  label: "9 mois",            interest: 6 },
  { months: 12, label: "12 mois",           interest: 12 },
];

const resolveImageUrl = (url: string) => {
  if (!url) return "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

const Cart = () => {
  const { navigate } = useAppNavigation();
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [loading, setLoading] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulation, setSimulation] = useState<CreditSimulationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const downPayment = simulation?.downPayment ?? 0;
  const financedAmount = simulation?.financedAmount ?? 0;
  const interestRate = simulation?.interestRate ?? 0;
  const interestPercent = interestRate * 100;
  const interestAmount = simulation?.interestAmount ?? 0;
  const totalPayable = selectedPlan > 0 ? simulation?.totalPayable : totalPrice;
  const monthlyAmount = simulation?.monthlyAmount ?? 0;

  useEffect(() => {
    let cancelled = false;

    if (selectedPlan === 0 || totalPrice <= 0) {
      setSimulation(null);
      setSimulationLoading(false);
      return;
    }

    setSimulationLoading(true);
    simulateCredit({
      totalAmount: totalPrice,
      downPayment: totalPrice * 0.2,
      numberOfInstallments: selectedPlan,
    })
      .then((result) => {
        if (!cancelled) setSimulation(result);
      })
      .catch(() => {
        if (!cancelled) setSimulation(null);
      })
      .finally(() => {
        if (!cancelled) setSimulationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPlan, totalPrice]);

  const handleCheckout = async () => {
    if (!user) {
      navigate("Login");
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    setErrorMsg("");
    try {
      // Check out each item individually
      for (const item of items) {
        await checkoutArticlePurchase(user.userId, {
          articleId: item.articleId,
          paymentType: selectedPlan === 0 ? "CASH" : "CREDIT",
          installmentMonths: selectedPlan > 0 ? selectedPlan : undefined,
          productName: item.name,
          boutiqueName: item.boutiqueName,
          price: item.priceTnd,
          imageUrl: item.imageUrl,
        });
      }
      clearCart();
      Alert.alert(
        "Commande confirmee",
        selectedPlan === 0
          ? "Paiement comptant effectue avec succes."
          : `Credit approuve. ${selectedPlan} mensualites de ${monthlyAmount.toFixed(2)} TND.`,
        [{ text: "OK", onPress: () => navigate("Installments") }]
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur lors du paiement.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCart = () => {
    Alert.alert("Vider le panier", "Etes-vous sur de vouloir vider le panier ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Vider", style: "destructive", onPress: clearCart },
    ]);
  };

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Shops")} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.gray500} />
          </Pressable>
          <Text style={styles.title}>Mon panier</Text>
          {items.length > 0 && (
            <Pressable onPress={handleCancelCart}>
              <Text style={styles.clearText}>Vider</Text>
            </Pressable>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={56} color={colors.gray500} />
            <Text style={styles.emptyText}>Votre panier est vide</Text>
            <Pressable style={styles.shopBtn} onPress={() => navigate("Shops")}>
              <Text style={styles.shopBtnText}>Parcourir les boutiques</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.itemsContainer}>
              {items.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image
                    source={{ uri: resolveImageUrl(item.imageUrl) }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemShop}>{item.boutiqueName}</Text>
                    <Text style={styles.itemPrice}>{item.priceTnd.toFixed(2)} TND</Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      style={styles.qtyBtn}
                    >
                      <MaterialCommunityIcons name="minus" size={14} color={colors.gray900} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={styles.qtyBtn}
                    >
                      <MaterialCommunityIcons name="plus" size={14} color={colors.gray900} />
                    </Pressable>
                    <Pressable onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                      <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Payment Plan Selector */}
            <Text style={styles.sectionTitle}>Mode de paiement</Text>
            <View style={styles.plansGrid}>
              {INSTALLMENT_PLANS.map((plan) => {
                const active = selectedPlan === plan.months;
                return (
                  <Pressable
                    key={plan.months}
                    onPress={() => setSelectedPlan(plan.months)}
                    style={[styles.planCard, active && styles.planCardActive]}
                  >
                    <Text style={[styles.planLabel, active && styles.planLabelActive]}>
                      {plan.label}
                    </Text>
                    {plan.interest > 0 && (
                      <Text style={[styles.planInterest, active && styles.planInterestActive]}>
                        +{plan.interest}%
                      </Text>
                    )}
                    {plan.interest === 0 && plan.months > 0 && (
                      <Text style={[styles.planFree, active && styles.planFreeActive]}>
                        0%
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{totalPrice.toFixed(2)} TND</Text>
              </View>
              {selectedPlan > 0 && simulationLoading && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Simulation</Text>
                  <Text style={styles.summaryValue}>Calcul...</Text>
                </View>
              )}
              {selectedPlan > 0 && simulation && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Apport</Text>
                  <Text style={styles.summaryValue}>{downPayment.toFixed(2)} TND</Text>
                </View>
              )}
              {selectedPlan > 0 && simulation && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Montant finance</Text>
                  <Text style={styles.summaryValue}>{financedAmount.toFixed(2)} TND</Text>
                </View>
              )}
              {selectedPlan > 0 && simulation && interestRate > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Interet ({interestPercent.toFixed(0)}%)</Text>
                  <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
                    +{interestAmount.toFixed(2)} TND
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{totalPayable !== undefined ? totalPayable.toFixed(2) : "..." } TND</Text>
              </View>
              {selectedPlan > 0 && simulation && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mensualite</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {monthlyAmount.toFixed(2)} TND / mois
                  </Text>
                </View>
              )}
            </View>

            {!!errorMsg && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            {/* Checkout Button */}
            <Pressable
              style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
              onPress={handleCheckout}
              disabled={loading || (selectedPlan > 0 && (!simulation || simulationLoading))}
            >
              <MaterialCommunityIcons
                name={selectedPlan === 0 ? "cash" : "credit-card-outline"}
                size={18}
                color="#fff"
              />
              <Text style={styles.checkoutText}>
                {loading
                  ? "Traitement..."
                  : selectedPlan === 0
                  ? "Payer comptant"
                  : `Payer en ${selectedPlan} mensualites`}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 8, backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder },
  title: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.gray900 },
  clearText: { fontSize: 13, color: colors.error, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 16 },
  emptyText: { fontSize: 16, color: colors.gray500 },
  shopBtn: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 24, paddingVertical: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  itemsContainer: { gap: 12 },
  cartItem: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  itemImage: { width: 68, height: 68, borderRadius: radii.md, backgroundColor: "#1e1e2e" },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  itemShop: { fontSize: 11, color: colors.gray500 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 4 },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.cardBorder, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 13, fontWeight: "700", color: colors.gray900, minWidth: 18, textAlign: "center" },
  removeBtn: { padding: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  plansGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", minWidth: 90 },
  planCardActive: { backgroundColor: colors.primary + "22", borderColor: colors.primary },
  planLabel: { fontSize: 12, fontWeight: "600", color: colors.gray500 },
  planLabelActive: { color: colors.primary },
  planInterest: { fontSize: 10, color: "#F59E0B", marginTop: 2 },
  planInterestActive: { color: "#F59E0B" },
  planFree: { fontSize: 10, color: "#16a34a", marginTop: 2 },
  planFreeActive: { color: "#16a34a" },
  summaryCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, color: colors.gray500 },
  summaryValue: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  summaryTotal: { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  totalValue: { fontSize: 17, fontWeight: "700", color: colors.gray900 },
  errorText: { fontSize: 13, color: colors.error, textAlign: "center" },
  checkoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: 16 },
  checkoutText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default Cart;
