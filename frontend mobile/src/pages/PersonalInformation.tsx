import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import { getProfile, UserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

type KycUiStatus = "PENDING" | "APPROVED" | "REJECTED";

const normalizeKycStatus = (value?: string | null): KycUiStatus => {
  const status = (value ?? "").toUpperCase();
  if (status === "APPROVED") {
    return "APPROVED";
  }
  if (status === "REJECTED") {
    return "REJECTED";
  }
  return "PENDING";
};

const PersonalInformation = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) {
        navigate("Login");
        return;
      }

      setLoading(true);
      setErrorMessage("");
      try {
        const data = await getProfile(user.userId);
        setProfile(data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les informations.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const rows = useMemo(() => {
    const firstName = profile?.firstName ?? user?.firstName ?? "";
    const lastName = profile?.lastName ?? user?.lastName ?? "";

    return [
      { label: "Nom", value: `${firstName} ${lastName}`.trim() || "Non renseigne" },
      { label: "Email", value: profile?.email ?? user?.email ?? "Non renseigne" },
      { label: "Telephone", value: profile?.phone || "Non renseigne" },
      { label: "Adresse", value: profile?.address || "Non renseignee" },
      { label: "Profession", value: profile?.profession || "Non renseignee" },
      { label: "Statut KYC", value: profile?.kycStatus || "PENDING" },
    ];
  }, [profile, user]);

  const kycStatus = normalizeKycStatus(profile?.kycStatus);

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Profile")} style={styles.backButton}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>Informations personnelles</Text>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {loading && <Text style={styles.loadingText}>Chargement...</Text>}

        <View style={styles.card}>
          {rows.map((row) => {
            if (row.label === "Statut KYC") {
              return (
                <View key={row.label} style={styles.row}>
                  <Text style={styles.label}>{row.label}</Text>
                  <View
                    style={[
                      styles.statusChip,
                      kycStatus === "APPROVED" && styles.statusChipApproved,
                      kycStatus === "REJECTED" && styles.statusChipRejected,
                      kycStatus === "PENDING" && styles.statusChipPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        kycStatus === "APPROVED" && styles.statusChipTextApproved,
                        kycStatus === "REJECTED" && styles.statusChipTextRejected,
                        kycStatus === "PENDING" && styles.statusChipTextPending,
                      ]}
                    >
                      {kycStatus}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={row.label} style={styles.row}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            );
          })}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigate("EditProfileField")}>
          <Text style={styles.primaryText}>Modifier</Text>
        </Pressable>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 22, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  backText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  title: { fontSize: 21, fontWeight: "800", color: colors.gray900, flex: 1 },
  card: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, backgroundColor: colors.card, overflow: "hidden" },
  row: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  label: { fontSize: 11, color: colors.gray500, fontWeight: "700" },
  value: { marginTop: 2, fontSize: 14, color: colors.gray900, fontWeight: "600" },
  statusChip: { marginTop: 6, alignSelf: "flex-start", borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusChipPending: { backgroundColor: colors.warningLight, borderColor: colors.warningBorder },
  statusChipApproved: { backgroundColor: colors.successLight, borderColor: colors.successBorder },
  statusChipRejected: { backgroundColor: colors.errorLight, borderColor: colors.errorBorder },
  statusChipText: { fontSize: 11, fontWeight: "800" },
  statusChipTextPending: { color: "#fbbf24" },
  statusChipTextApproved: { color: "#34d399" },
  statusChipTextRejected: { color: "#f87171" },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.lg, alignItems: "center", paddingVertical: 12 },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error },
});

export default PersonalInformation;
