import { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import {
  API_BASE_URL,
  AccountStatus,
  deleteAccount,
  getAccountStatus,
  getAutopayStatus,
  getCards,
  getFinancialProfile,
  getKycStatus,
  getProfile,
  getWalletBalance,
  KycStatusResult,
  setAuthToken,
  setAutopay,
  uploadProfilePhoto,
  UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const KYC_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  APPROVED:      { label: "Verifie",    bg: "#0d3320", text: "#34d399", icon: "check-decagram" },
  PENDING:       { label: "En attente", bg: "#3b2e00", text: "#fbbf24", icon: "clock-outline" },
  REJECTED:      { label: "Refuse",     bg: "#3b1111", text: "#f87171", icon: "close-circle-outline" },
  NOT_SUBMITTED: { label: "Non soumis", bg: "#1a1a2e", text: "#6b6b80", icon: "alert-circle-outline" },
};

const Profile = () => {
  const { navigate } = useAppNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [kyc, setKyc]                   = useState<KycStatusResult | null>(null);
  const [hasCard, setHasCard]           = useState<boolean | null>(null);
  const [hasFinancialProfile, setHasFinancialProfile] = useState<boolean | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [profileData, kycData, cardsData, finProfileData, accountStatusData, autopayData, walletData] =
          await Promise.all([
            getProfile(user.userId),
            getKycStatus(user.userId),
            getCards(user.userId).catch(() => []),
            getFinancialProfile(user.userId).catch(() => null),
            getAccountStatus(user.userId).catch(() => null),
            getAutopayStatus(user.userId).catch(() => ({ enabled: false })),
            getWalletBalance(user.userId).catch(() => null),
          ]);
        setProfile(profileData);
        setKyc(kycData);
        setHasCard(cardsData.length > 0);
        setHasFinancialProfile(finProfileData !== null);
        setAccountStatus(accountStatusData);
        setAutopayEnabled(autopayData?.enabled ?? false);
        setWalletBalance(walletData?.balance ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger votre profil.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Session requise</Text>
          <Text style={styles.sectionSub}>Connectez-vous pour voir votre profil.</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Aller a la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  const firstName       = profile?.firstName ?? user.firstName;
  const lastName        = profile?.lastName  ?? user.lastName;
  const email           = profile?.email     ?? user.email;
  const initials        = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const profilePhotoUrl = profile?.profilePhotoUrl;
  const kycLabel        = kyc?.status ?? profile?.kycStatus ?? "NOT_SUBMITTED";
  const kycConfig       = KYC_STATUS_CONFIG[kycLabel] ?? KYC_STATUS_CONFIG.NOT_SUBMITTED;

  const isGoodPayer  = kycLabel === "APPROVED" && !!hasCard && !!hasFinancialProfile;
  const badgeLabel   = isGoodPayer ? "Bon payeur" : "Profil incomplet";
  const badgeColor   = isGoodPayer ? colors.success : colors.warning;
  const badgeBg      = isGoodPayer ? colors.successLight : colors.warningLight;
  const badgeIcon    = isGoodPayer ? "shield-check" : "shield-alert-outline";

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      try {
        const updatedProfile = await uploadProfilePhoto(user.userId, {
          uri: asset.uri,
          fileName: asset.fileName ?? "profile.jpg",
          mimeType: asset.mimeType ?? "image/jpeg",
        });
        setProfile(updatedProfile);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Echec de l'upload.");
      } finally {
        setUploading(false);
      }
    } catch {
      setErrorMessage("Impossible d'ouvrir la galerie.");
    }
  };

  const handleToggleAutopay = async (value: boolean) => {
    setAutopayEnabled(value);
    try {
      await setAutopay(user.userId, value);
    } catch {
      setAutopayEnabled(!value);
    }
  };

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {/* ── User card ── */}
        <View style={styles.userCard}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
            {profilePhotoUrl ? (
              <Image source={{ uri: `${API_BASE_URL}${profilePhotoUrl}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={12} color={colors.white} />
            </View>
            {uploading && <View style={styles.avatarOverlay}><Text style={styles.avatarOverlayText}>...</Text></View>}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{`${firstName} ${lastName}`}</Text>
            <Text style={styles.userMail}>{email}</Text>
            <View style={[styles.payerBadge, { backgroundColor: badgeBg }]}>
              <MaterialCommunityIcons name={badgeIcon as never} size={12} color={badgeColor} />
              <Text style={[styles.payerBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>
          <View style={[styles.kycBadge, { backgroundColor: kycConfig.bg }]}>
            <MaterialCommunityIcons name={kycConfig.icon as never} size={12} color={kycConfig.text} />
            <Text style={[styles.kycBadgeText, { color: kycConfig.text }]}>{kycConfig.label}</Text>
          </View>
        </View>

        {/* ── Account Status (replaces balance — balance is secret) ── */}
        <View style={styles.statusCard}>
          {/* Payer status row */}
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <MaterialCommunityIcons
                name={accountStatus?.payerStatus === "BON_PAYEUR" ? "shield-check" : accountStatus?.payerStatus === "RISQUE" ? "shield-alert" : "shield-outline"}
                size={22}
                color={accountStatus?.payerStatus === "BON_PAYEUR" ? colors.success : accountStatus?.payerStatus === "RISQUE" ? colors.error : colors.gray400}
              />
              <View>
                <Text style={styles.statusLabel}>Statut du compte</Text>
                <Text style={[
                  styles.statusValue,
                  accountStatus?.payerStatus === "BON_PAYEUR" && { color: colors.success },
                  accountStatus?.payerStatus === "RISQUE"     && { color: colors.error },
                ]}>
                  {accountStatus?.payerStatus === "BON_PAYEUR" ? "Bon payeur 🟢"
                    : accountStatus?.payerStatus === "RISQUE"   ? "Risque 🔴"
                    : "Neutre ⚪"}
                </Text>
              </View>
            </View>
            {accountStatus && accountStatus.totalCount > 0 && (
              <Text style={styles.statusPct}>
                {accountStatus.paidCount}/{accountStatus.totalCount} payées
              </Text>
            )}
          </View>

          {/* Next installment row */}
          {accountStatus?.nextInstallmentDate && (
            <View style={[styles.nextRow, accountStatus.overdueCount > 0 && styles.nextRowOverdue]}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color={accountStatus.overdueCount > 0 ? colors.error : colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>
                  {accountStatus.overdueCount > 0 ? "Échéance en retard ⚠" : "Prochaine échéance"}
                </Text>
                <Text style={styles.nextDate}>
                  {new Date(accountStatus.nextInstallmentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
                </Text>
              </View>
              <Text style={[styles.nextAmount, accountStatus.overdueCount > 0 && { color: colors.error }]}>
                {Math.round(accountStatus.nextInstallmentAmount ?? 0)} DT
              </Text>
            </View>
          )}

          <Pressable style={styles.statusHistBtn} onPress={() => navigate("PaymentHistory")}>
            <Text style={styles.statusHistBtnText}>Voir l'historique</Text>
          </Pressable>

          {/* Wallet balance row */}
          {walletBalance !== null && (
            <View style={styles.walletRow}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={colors.primary} />
              <Text style={styles.walletLabel}>Solde simulé</Text>
              <Text style={styles.walletAmount}>{Math.round(walletBalance)} DT</Text>
            </View>
          )}
        </View>

        {/* ── Advantages ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Avantages</Text>
          <Pressable style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#3b2300" }]}>
                <MaterialCommunityIcons name="percent-outline" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.menuText}>Cashback</Text>
                <Text style={styles.menuSub}>Gagnez jusqu'a 2% sur vos achats</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>
        </View>

        {/* ── Payment Settings ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Paiement</Text>

          <Pressable style={styles.menuRow} onPress={() => navigate("Cards")}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#1a1a3e" }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.menuText}>Moyens de paiement</Text>
                <Text style={styles.menuSub}>Cartes Visa / Mastercard</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>

          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#0d2e23" }]}>
                <MaterialCommunityIcons name="autorenew" size={18} color={colors.success} />
              </View>
              <View>
                <Text style={styles.menuText}>Paiement automatique</Text>
                <Text style={styles.menuSub}>{autopayEnabled ? "Actif — echeances auto-payees" : "Inactif — paiement manuel"}</Text>
              </View>
            </View>
            <Switch
              value={autopayEnabled}
              onValueChange={handleToggleAutopay}
              thumbColor={autopayEnabled ? colors.success : colors.gray400}
              trackColor={{ false: colors.surface, true: colors.successLight }}
            />
          </View>

          <Pressable style={styles.menuRow} onPress={() => navigate("PaymentHistory")}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#1a2e3b" }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#60a5fa" />
              </View>
              <View>
                <Text style={styles.menuText}>Historique des paiements</Text>
                <Text style={styles.menuSub}>Toutes vos transactions</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>
        </View>

        {/* ── Account Setup (only shown when incomplete) ── */}
        {(!hasCard || !hasFinancialProfile || kycLabel !== "APPROVED") && (
          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>Configuration du compte</Text>
            {([
              { label: "Verification KYC",  done: kycLabel === "APPROVED", route: "Kyc" as const },
              { label: "Carte de paiement", done: !!hasCard,               route: "Cards" as const },
              { label: "Profil financier",  done: !!hasFinancialProfile,   route: "FinancialProfile" as const },
            ] as { label: string; done: boolean; route: "Kyc" | "Cards" | "FinancialProfile" }[]).map((step) => (
              <Pressable key={step.label} style={styles.setupRow} onPress={() => !step.done && navigate(step.route)}>
                <View style={[styles.setupDot, step.done && styles.setupDotDone]}>
                  {step.done
                    ? <MaterialCommunityIcons name="check" size={12} color={colors.white} />
                    : <MaterialCommunityIcons name="alert-outline" size={12} color={colors.gray400} />
                  }
                </View>
                <Text style={[styles.setupLabel, step.done && styles.setupLabelDone]}>{step.label}</Text>
                <View style={[styles.setupBadge, step.done ? styles.setupBadgeDone : styles.setupBadgeMissing]}>
                  <Text style={[styles.setupBadgeText, step.done ? { color: colors.success } : { color: colors.warning }]}>
                    {step.done ? "DONE" : "MISSING"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Settings ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Parametres</Text>

          <Pressable style={styles.menuRow} onPress={() => navigate("PersonalInformation")}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="account-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Informations personnelles</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => navigate("CreadiScore")}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="speedometer" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Score de credit</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => navigate("Installments")}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Mes echeances</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => navigate("Support")}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <MaterialCommunityIcons name="lifebuoy" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Aide & Support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray400} />
          </Pressable>
        </View>

        {/* ── Logout ── */}
        <Pressable
          onPress={() => {
            setAuthToken(null);
            logout();
            navigate("Login");
          }}
          style={styles.logoutButton}
        >
          <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </Pressable>

        {/* ── Delete Account ── */}
        <Pressable
          onPress={() => { setDeleteConfirmInput(""); setShowDeleteModal(true); }}
          style={styles.deleteButton}
          disabled={deletingAccount}
        >
          <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
          <Text style={styles.deleteText}>{deletingAccount ? "Suppression…" : "Supprimer le compte"}</Text>
        </Pressable>

        {/* ── Delete Confirmation Modal ── */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Supprimer le compte</Text>
              <Text style={styles.modalBody}>
                Cette action est {"\n"}
                <Text style={{ fontWeight: "900", color: colors.error }}>irréversible</Text>.
                {"\n\n"}Toutes vos données seront supprimées.{"\n"}Pour confirmer, tapez :{" "}
                <Text style={{ fontWeight: "800", color: colors.error }}>supprimer</Text>
              </Text>
              <TextInput
                style={[styles.modalInput, deleteConfirmInput === "supprimer" && styles.modalInputOk]}
                value={deleteConfirmInput}
                onChangeText={setDeleteConfirmInput}
                placeholder="supprimer"
                placeholderTextColor={colors.gray500}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowDeleteModal(false); setDeleteConfirmInput(""); }}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalDeleteBtn, deleteConfirmInput !== "supprimer" && styles.modalDeleteBtnOff]}
                  disabled={deleteConfirmInput !== "supprimer" || deletingAccount}
                  onPress={async () => {
                    setDeletingAccount(true);
                    setShowDeleteModal(false);
                    try {
                      await deleteAccount(user.userId);
                      setAuthToken(null);
                      logout();
                      navigate("Login");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
                      const hasInstallments = msg.includes("échéance") || msg.includes("installment") || msg.includes("pending");
                      Alert.alert(
                        "Suppression impossible",
                        hasInstallments
                          ? "Vous avez des échéances en cours. Réglez-les d'abord avant de supprimer votre compte."
                          : msg,
                        hasInstallments
                          ? [
                              { text: "Fermer", style: "cancel" },
                              { text: "Voir mes échéances", onPress: () => navigate("Installments") },
                            ]
                          : [{ text: "OK" }]
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  }}
                >
                  <Text style={styles.modalDeleteText}>
                    {deletingAccount ? "Suppression…" : "Confirmer la suppression"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },

  userCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 16, flexDirection: "row", gap: 12, alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: "700" },
  cameraIcon: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.card },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  avatarOverlayText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  userName: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  userMail: { marginTop: 2, fontSize: 12, color: colors.gray500 },
  payerBadge: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm, alignSelf: "flex-start" },
  payerBadgeText: { fontSize: 10, fontWeight: "700" },
  kycBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm },
  kycBadgeText: { fontSize: 10, fontWeight: "700" },

  walletCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletLabel: { fontSize: 11, color: colors.gray500, fontWeight: "600" },
  walletAmount: { fontSize: 20, fontWeight: "800", color: colors.gray900, marginTop: 2 },
  walletBtn: { backgroundColor: colors.primary + "22", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md },
  walletBtnText: { color: colors.primary, fontSize: 12, fontWeight: "700" },

  // Account status card
  statusCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 16, gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusLabel: { fontSize: 10, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  statusValue: { fontSize: 15, fontWeight: "800", color: colors.gray900, marginTop: 2 },
  statusPct: { fontSize: 12, color: colors.gray500, fontWeight: "700" },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.md, padding: 10 },
  nextRowOverdue: { backgroundColor: colors.errorLight },
  nextLabel: { fontSize: 11, color: colors.gray500, fontWeight: "600" },
  nextDate: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginTop: 1 },
  nextAmount: { fontSize: 16, fontWeight: "800", color: colors.primary },
  statusHistBtn: { backgroundColor: colors.primary + "18", borderRadius: radii.md, paddingVertical: 9, alignItems: "center" },
  statusHistBtnText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  walletRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  walletLabel: { flex: 1, fontSize: 13, color: colors.gray400 },
  walletAmount: { fontSize: 15, fontWeight: "800", color: colors.primary },

  sectionCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, overflow: "hidden", paddingTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 14 },
  sectionSub: { fontSize: 12, color: colors.gray500, lineHeight: 18 },

  menuRow: { paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.cardBorder, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 },
  menuIconBox: { width: 34, height: 34, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  menuText: { fontSize: 14, color: colors.gray900, fontWeight: "600" },
  menuSub: { fontSize: 11, color: colors.gray500, marginTop: 1 },

  setupCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 16, gap: 10 },
  setupRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  setupDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.gray300, alignItems: "center", justifyContent: "center" },
  setupDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  setupLabel: { flex: 1, fontSize: 13, color: colors.gray600, fontWeight: "600" },
  setupLabelDone: { color: colors.gray900 },
  setupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm },
  setupBadgeDone: { backgroundColor: "#0d2818" },
  setupBadgeMissing: { backgroundColor: colors.warningLight },
  setupBadgeText: { fontSize: 10, fontWeight: "800" },

  logoutButton: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.errorBorder, paddingVertical: 14, alignItems: "center", backgroundColor: colors.card, flexDirection: "row", justifyContent: "center", gap: 8 },
  logoutText: { color: colors.error, fontSize: 14, fontWeight: "700" },
  deleteButton: { borderRadius: radii.lg, borderWidth: 1, borderColor: colors.errorBorder, paddingVertical: 14, alignItems: "center", backgroundColor: "#2d1515", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 },
  deleteText: { color: colors.error, fontSize: 14, fontWeight: "700" },
  errorText: { fontSize: 12, color: colors.error },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },

  // ── Delete confirmation modal ──
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 14, borderWidth: 1, borderColor: colors.errorBorder },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.error, textAlign: "center" },
  modalBody: { fontSize: 14, color: colors.gray700, textAlign: "center", lineHeight: 22 },
  modalInput: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.gray300, paddingHorizontal: 14, fontSize: 16, color: colors.gray900, backgroundColor: colors.gray100, textAlign: "center" },
  modalInputOk: { borderColor: colors.error },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: colors.gray300, paddingVertical: 12, alignItems: "center" },
  modalCancelText: { color: colors.gray700, fontWeight: "700", fontSize: 14 },
  modalDeleteBtn: { flex: 1, backgroundColor: colors.error, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalDeleteBtnOff: { opacity: 0.4 },
  modalDeleteText: { color: colors.white, fontWeight: "800", fontSize: 14 },
});

export default Profile;
