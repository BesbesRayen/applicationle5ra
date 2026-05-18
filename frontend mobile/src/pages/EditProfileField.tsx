import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import { getProfile, updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

interface EditableProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
}

const EditProfileField = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [form, setForm] = useState<EditableProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profession: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const profile = await getProfile(user.userId);
        setForm({
          firstName: profile.firstName ?? user.firstName ?? "",
          lastName: profile.lastName ?? user.lastName ?? "",
          email: profile.email ?? user.email ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          profession: profile.profession ?? "",
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const setField = (field: keyof EditableProfile, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const save = async () => {
    if (!user) {
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      await updateProfile(user.userId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        profession: form.profession.trim(),
      });
      navigate("PersonalInformation");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigate("PersonalInformation")} style={styles.backButton}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>Modifier le profil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <Text style={styles.label}>Prenom</Text>
          <TextInput value={form.firstName} onChangeText={(value) => setField("firstName", value)} style={styles.input} autoCapitalize="words" />

          <Text style={styles.label}>Nom</Text>
          <TextInput value={form.lastName} onChangeText={(value) => setField("lastName", value)} style={styles.input} autoCapitalize="words" />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => setField("email", value)}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Telephone</Text>
          <TextInput value={form.phone} onChangeText={(value) => setField("phone", value)} style={styles.input} keyboardType="phone-pad" />

          <Text style={styles.label}>Adresse</Text>
          <TextInput value={form.address} onChangeText={(value) => setField("address", value)} style={styles.input} />

          <Text style={styles.label}>Profession</Text>
          <TextInput value={form.profession} onChangeText={(value) => setField("profession", value)} style={styles.input} />

          <Pressable style={[styles.primaryButton, (saving || loading) && styles.disabled]} onPress={save} disabled={saving || loading}>
            <Text style={styles.primaryText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
          </Pressable>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 22, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  backText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  title: { fontSize: 21, fontWeight: "800", color: colors.gray900, flex: 1 },
  card: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, backgroundColor: colors.card, padding: 12, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.gray900, marginBottom: 2 },
  label: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  input: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.gray50, color: colors.gray900 },
  primaryButton: { marginTop: 4, backgroundColor: colors.primary, borderRadius: radii.md, alignItems: "center", paddingVertical: 11 },
  primaryText: { color: colors.white, fontWeight: "700" },
  disabled: { opacity: 0.7 },
  errorText: { fontSize: 12, color: colors.error },
});

export default EditProfileField;
