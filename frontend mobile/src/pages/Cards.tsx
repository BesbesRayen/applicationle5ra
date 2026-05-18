import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import {
  addCard,
  blockCard,
  Card,
  CreateCardPayload,
  CardType,
  getCards,
  setDefaultCard,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

// â”€â”€â”€ Live card preview (shown while typing in add-card modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LiveCardPreview = ({
  cardDigits,
  expiryDigits,
  name,
  cardType,
}: {
  cardDigits: string;
  expiryDigits: string;
  name: string;
  cardType: CardType;
}) => {
  const formatPreviewNumber = () => {
    if (cardDigits.length === 0) return "**** **** **** ****";
    const padded = cardDigits.padEnd(16, "*");
    const groups = padded.match(/.{1,4}/g) ?? [];
    // Mask all but last group once enough digits entered
    if (cardDigits.length >= 13) {
      return groups.map((g, i) => (i < groups.length - 1 ? "****" : g.replace(/\*/g, "0"))).join(" ");
    }
    return groups.join(" ");
  };

  const formatExpiry = () => {
    if (expiryDigits.length === 0) return "MM/YY";
    if (expiryDigits.length <= 2) return expiryDigits.padEnd(2, "M") + "/YY";
    const yy = expiryDigits.slice(2).padEnd(2, "Y");
    return `${expiryDigits.slice(0, 2)}/${yy}`;
  };

  const isVisa = cardType === "VISA";

  return (
    <View style={previewStyles.card}>
      <View style={previewStyles.circle1} />
      <View style={previewStyles.circle2} />
      <View style={previewStyles.topRow}>
        <MaterialCommunityIcons name="chip" size={28} color="#ffd700" />
        <View style={previewStyles.contactless}>
          <MaterialCommunityIcons name="wifi" size={18} color="rgba(255,255,255,0.7)" />
        </View>
      </View>
      <Text style={previewStyles.cardNumber}>{formatPreviewNumber()}</Text>
      <View style={previewStyles.bottomRow}>
        <View>
          <Text style={previewStyles.fieldLabel}>CARD HOLDER</Text>
          <Text style={previewStyles.fieldValue}>{name.trim().toUpperCase() || "YOUR NAME"}</Text>
          <Text style={[previewStyles.fieldLabel, { marginTop: 6 }]}>EXPIRES</Text>
          <Text style={previewStyles.fieldValue}>{formatExpiry()}</Text>
        </View>
        <View style={previewStyles.brandArea}>
          {isVisa ? (
            <Text style={previewStyles.visaText}>VISA</Text>
          ) : (
            <View style={previewStyles.mastercardCircles}>
              <View style={[previewStyles.mcCircle, { backgroundColor: "#eb001b" }]} />
              <View style={[previewStyles.mcCircle, { backgroundColor: "#f79e1b", marginLeft: -12 }]} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// â”€â”€â”€ Animated card widget (card list view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AnimatedCardWidget = ({ card }: { card: Card }) => {
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shine, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [shine]);

  const shimX = shine.interpolate({ inputRange: [0, 1], outputRange: [-200, 400] });
  const isVisa = card.type === "VISA";
  const isBlocked = card.status === "BLOCKED";
  const displayNumber = card.maskedNumber ?? `**** **** **** ${card.last4 ?? "****"}`;

  return (
    <View style={[styles.cardWidget, card.defaultCard && styles.cardWidgetDefault, isBlocked && styles.cardWidgetBlocked]}>
      <View style={styles.cardCircle1} />
      <View style={styles.cardCircle2} />
      <Animated.View style={[styles.cardShine, { transform: [{ translateX: shimX }] }]} />

      <View style={styles.cardTopRow}>
        <MaterialCommunityIcons name="chip" size={26} color="#ffd700" />
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <MaterialCommunityIcons name="wifi" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      </View>

      <Text style={styles.cardNumber}>{displayNumber}</Text>

      <View style={styles.cardBottom}>
        <View>
          {!!card.cardholderName && (
            <>
              <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
              <Text style={styles.cardFieldValue}>{card.cardholderName.toUpperCase()}</Text>
            </>
          )}
          <Text style={[styles.cardFieldLabel, { marginTop: card.cardholderName ? 6 : 0 }]}>EXPIRES</Text>
          <Text style={styles.cardFieldValue}>{card.expiryDate}</Text>
        </View>
        <View style={styles.cardBrandRow}>
          {isBlocked && (
            <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>BLOCKED</Text></View>
          )}
          {card.defaultCard && !isBlocked && (
            <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>
          )}
          {isVisa ? (
            <Text style={styles.visaBrand}>VISA</Text>
          ) : (
            <View style={styles.mastercardBrand}>
              <View style={[styles.mcDot, { backgroundColor: "#eb001b" }]} />
              <View style={[styles.mcDot, { backgroundColor: "#f79e1b", marginLeft: -8 }]} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Cards = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [cardDigits, setCardDigits] = useState("");
  const [expiryDigits, setExpiryDigits] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardType, setCardType] = useState<CardType>("VISA");
  const [makeDefault, setMakeDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const expiryRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const loadCards = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getCards(user.userId);
      setCards(data);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not load cards");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const validateExpiry = (digits: string): string | null => {
    if (digits.length < 4) return "Expiry must be complete (MM/YY)";
    const mm = parseInt(digits.slice(0, 2), 10);
    const yy = parseInt(digits.slice(2, 4), 10);
    const currentYY = new Date().getFullYear() % 100;
    if (mm < 1 || mm > 12) return "Invalid month â€” must be 01 to 12";
    if (yy < currentYY) return `Card expired â€” year must be ${currentYY} or later`;
    return null;
  };

  const handleAddCard = async () => {
    if (!user) return;
    if (!/^\d{13,19}$/.test(cardDigits)) {
      setErrorMessage("Invalid card number (13â€“19 digits required)");
      return;
    }
    const expiryError = validateExpiry(expiryDigits);
    if (expiryError) { setErrorMessage(expiryError); return; }
    if (!/^\d{3,4}$/.test(cvv)) {
      setErrorMessage("CVV must be 3 or 4 digits");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      const payload: CreateCardPayload = {
        cardNumber: cardDigits,
        expiryDate: `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`,
        cardholderName: cardholderName.trim() || undefined,
        type: cardType,
        cvv,
        defaultCard: makeDefault || cards.length === 0,
      };
      await addCard(user.userId, payload);
      setSuccessMessage("âœ“ Card added â€” wallet of 2,000 TND activated");
      setShowAddModal(false);
      resetForm();
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to add card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (cardId: number) => {
    if (!user) return;
    setErrorMessage(""); setSuccessMessage("");
    try {
      await setDefaultCard(user.userId, cardId);
      setSuccessMessage("Default card updated");
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update default");
    }
  };

  const handleBlock = async (cardId: number) => {
    if (!user) return;
    setErrorMessage(""); setSuccessMessage("");
    try {
      await blockCard(user.userId, cardId);
      setSuccessMessage("Card blocked");
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to block card");
    }
  };

  const resetForm = () => {
    setCardDigits(""); setExpiryDigits(""); setCvv("");
    setCardholderName(""); setCardType("VISA"); setMakeDefault(false); setErrorMessage("");
  };

  const cardDisplay = cardDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
  // Slash is added only when 3+ digits are present (not at exactly 2).
  // This avoids the "stuck" state where backspace removes the auto-slash
  // but raw digit count stays the same, causing stale deletion detection.
  const expiryDisplay = expiryDigits.length > 2
    ? `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`
    : expiryDigits;

  const handleCardChange = (text: string) => {
    const raw = text.replace(/\D/g, "").slice(0, 16);
    setCardDigits(raw);
    if (raw.length === 16) expiryRef.current?.focus();
  };

  const handleExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, "").slice(0, 4);
    setExpiryDigits(raw);
    if (raw.length === 4) nameRef.current?.focus();
  };

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Session required</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Payment Methods</Text>
        <Text style={styles.subtitle}>Manage your linked cards</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}

        {cards.map((card) => (
          <View key={card.id}>
            <AnimatedCardWidget card={card} />
            <View style={styles.cardActions}>
              {card.status === "ACTIVE" && !card.defaultCard && (
                <Pressable style={styles.actionBtn} onPress={() => handleSetDefault(card.id)}>
                  <MaterialCommunityIcons name="star-outline" size={14} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Set default</Text>
                </Pressable>
              )}
              {card.status === "ACTIVE" && (
                <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleBlock(card.id)}>
                  <MaterialCommunityIcons name="lock-outline" size={14} color={colors.error} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Block</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {!loading && cards.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="credit-card-plus-outline" size={40} color={colors.gray400} />
            <Text style={styles.emptyCardTitle}>No cards yet</Text>
            <Text style={styles.emptyCardSub}>
              Add a card to access credit and payments.{"\n"}Your wallet starts at 2,000 TND.
            </Text>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={() => { resetForm(); setShowAddModal(true); }}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Add new card</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />

      {/* â”€â”€ Add Card Modal â”€â”€ */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowAddModal(false); resetForm(); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Pressable style={styles.modalOverlay} onPress={() => {}} accessible={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Card</Text>
                <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.gray500} />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {/* Live card preview */}
                <LiveCardPreview cardDigits={cardDigits} expiryDigits={expiryDigits} name={cardholderName} cardType={cardType} />

                {/* Card Number */}
                <View>
                  <Text style={styles.fieldLabel}>CARD NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.gray500}
                    keyboardType="number-pad"
                    value={cardDisplay}
                    onChangeText={handleCardChange}
                    maxLength={19}
                    returnKeyType="next"
                    onSubmitEditing={() => expiryRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Expiry + CVV */}
                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>EXPIRY</Text>
                    <TextInput
                      ref={expiryRef}
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.gray500}
                      keyboardType="number-pad"
                      value={expiryDisplay}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                      returnKeyType="next"
                      onSubmitEditing={() => nameRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CVV</Text>
                    <TextInput
                      ref={cvvRef}
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={colors.gray500}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cvv}
                      onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      returnKeyType="next"
                      onSubmitEditing={() => nameRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>
                </View>

                {/* Cardholder Name */}
                <View>
                  <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
                  <TextInput
                    ref={nameRef}
                    style={styles.input}
                    placeholder="e.g. Rayen Besbes"
                    placeholderTextColor={colors.gray500}
                    autoCapitalize="words"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    returnKeyType="next"
                    onSubmitEditing={() => cvvRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Card Type */}
                <View>
                  <Text style={styles.fieldLabel}>CARD TYPE</Text>
                  <View style={styles.typeRow}>
                    {(["VISA", "MASTERCARD"] as CardType[]).map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setCardType(t)}
                        style={[styles.typeBtn, cardType === t && styles.typeBtnActive]}
                      >
                        <MaterialCommunityIcons
                          name={t === "VISA" ? "credit-card-outline" : "credit-card-multiple-outline"}
                          size={18}
                          color={cardType === t ? colors.white : colors.gray500}
                        />
                        <Text style={[styles.typeBtnText, cardType === t && { color: colors.white }]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Default toggle */}
                <Pressable style={styles.checkRow} onPress={() => setMakeDefault(!makeDefault)}>
                  <View style={[styles.checkbox, makeDefault && styles.checkboxActive]}>
                    {makeDefault && <MaterialCommunityIcons name="check" size={12} color={colors.white} />}
                  </View>
                  <Text style={styles.checkLabel}>Set as default card</Text>
                </Pressable>

                {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                <Text style={styles.securityNote}>
                  ðŸ”’ CVV never stored Â· Card number encrypted Â· Wallet: 2,000 TND
                </Text>

                <Pressable
                  style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
                  onPress={handleAddCard}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.primaryButtonText}>Add Card</Text>
                  }
                </Pressable>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </MobileLayout>
  );
};

// â”€â”€â”€ Live preview styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const previewStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    padding: 22,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    minHeight: 180,
    position: "relative",
  },
  circle1: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
  },
  circle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -30,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  contactless: { transform: [{ rotate: "90deg" }] },
  cardNumber: {
    fontSize: 19, fontWeight: "700", color: "#fff",
    letterSpacing: 3, marginTop: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  bottomRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end", marginTop: 20,
  },
  fieldLabel: { fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 1, textTransform: "uppercase" },
  fieldValue: { fontSize: 13, color: "#fff", fontWeight: "700", marginTop: 2, letterSpacing: 0.5 },
  brandArea: { justifyContent: "flex-end" },
  visaText: { fontSize: 22, fontWeight: "900", color: "#fff", fontStyle: "italic", letterSpacing: 1 },
  mastercardCircles: { flexDirection: "row", alignItems: "center" },
  mcCircle: { width: 26, height: 26, borderRadius: 13, opacity: 0.9 },
});

// â”€â”€â”€ Main styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: 14, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "600" },
  successText: { fontSize: 12, color: colors.success, fontWeight: "600" },

  cardWidget: {
    borderRadius: 20, backgroundColor: "#6C63FF", padding: 20,
    overflow: "hidden", shadowColor: "#6C63FF", shadowOpacity: 0.5,
    shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 10, minHeight: 170, position: "relative",
  },
  cardWidgetDefault: { borderWidth: 2, borderColor: "#a5b4fc" },
  cardWidgetBlocked: { opacity: 0.55 },
  cardCircle1: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
  },
  cardCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -30,
  },
  cardShine: {
    position: "absolute", top: 0, bottom: 0, width: 80,
    backgroundColor: "rgba(255,255,255,0.08)", transform: [{ skewX: "-15deg" }],
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardNumber: {
    fontSize: 18, fontWeight: "700", color: colors.white,
    letterSpacing: 2.5, marginTop: 24,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 },
  cardFieldLabel: { fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 1 },
  cardFieldValue: { fontSize: 13, color: colors.white, fontWeight: "700", marginTop: 2 },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  visaBrand: { fontSize: 20, fontWeight: "900", color: colors.white, fontStyle: "italic" },
  mastercardBrand: { flexDirection: "row", alignItems: "center" },
  mcDot: { width: 22, height: 22, borderRadius: 11, opacity: 0.9 },
  defaultBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9, color: colors.white, fontWeight: "800" },
  blockedBadge: {
    backgroundColor: colors.error, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  blockedBadgeText: { fontSize: 9, color: colors.white, fontWeight: "800" },

  cardActions: { flexDirection: "row", gap: 8, paddingTop: 4 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  actionBtnDanger: { borderColor: colors.errorBorder, backgroundColor: colors.errorLight },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: colors.primary },

  emptyCard: {
    backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 28, alignItems: "center", gap: 10,
  },
  emptyCardTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyCardSub: { fontSize: 13, color: colors.gray500, textAlign: "center", lineHeight: 20 },

  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14,
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 24, maxHeight: "92%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },

  fieldLabel: {
    marginBottom: 6, fontSize: 10, letterSpacing: 1.2,
    fontWeight: "800", color: colors.gray600, textTransform: "uppercase",
  },
  input: {
    borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.surface,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.gray900,
  },
  rowFields: { flexDirection: "row", gap: 10 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: radii.lg, borderWidth: 1.5,
    borderColor: colors.gray200, backgroundColor: colors.surface,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: colors.gray500 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    borderColor: colors.gray300, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { fontSize: 13, color: colors.gray700, fontWeight: "600" },
  securityNote: { fontSize: 11, color: colors.gray500, textAlign: "center" },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },
});

export default Cards;
