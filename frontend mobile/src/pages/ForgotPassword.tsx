import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { confirmForgotPassword, requestForgotPassword } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

const ForgotPassword = () => {
  const { navigate } = useAppNavigation();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setSecondsLeft(OTP_EXPIRY_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const sendCode = async () => {
    if (!identifier.trim()) {
      setErrorMessage("Entrez votre adresse email.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");
    try {
      await requestForgotPassword(identifier.trim());
      setCodeSent(true);
      startTimer();
      setInfoMessage("Un code de vérification a été envoyé à votre email.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (secondsLeft > 0) return;
    setCode("");
    setErrorMessage("");
    await sendCode();
  };

  const resetPassword = async () => {
    if (!identifier.trim() || !code.trim() || !newPassword.trim()) {
      setErrorMessage("Remplissez tous les champs.");
      return;
    }
    if (code.trim().length !== 6) {
      setErrorMessage("Le code doit contenir 6 chiffres.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await confirmForgotPassword(identifier.trim(), code.trim(), newPassword);
      setResetDone(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => navigate("Login"), 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Échec de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (resetDone) {
    return (
      <MobileLayout>
        <View style={styles.successWrap}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          <Text style={styles.successTitle}>Mot de passe mis à jour !</Text>
          <Text style={styles.successSub}>Vous allez être redirigé vers la connexion…</Text>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Pressable onPress={() => navigate("Login")} style={styles.backRow}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
          <Text style={styles.backText}>Connexion</Text>
        </Pressable>

        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          {codeSent
            ? "Saisissez le code reçu par email et choisissez un nouveau mot de passe."
            : "Entrez votre email pour recevoir un code de vérification."}
        </Text>

        <View style={styles.card}>
          {/* Step 1 — Email input */}
          <Text style={styles.label}>ADRESSE EMAIL</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            style={[styles.input, codeSent && styles.inputDisabled]}
            placeholder="vous@exemple.com"
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!codeSent}
          />

          {!codeSent && (
            <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={sendCode} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? "Envoi en cours…" : "Envoyer le code"}</Text>
            </Pressable>
          )}

          {/* Step 2 — OTP + new password */}
          {codeSent && (
            <>
              {/* Timer row */}
              <View style={styles.timerRow}>
                <MaterialCommunityIcons
                  name={secondsLeft > 0 ? "clock-outline" : "clock-alert-outline"}
                  size={14}
                  color={secondsLeft > 0 ? colors.success : colors.error}
                />
                {secondsLeft > 0 ? (
                  <Text style={styles.timerText}>Code valide encore {formatCountdown(secondsLeft)}</Text>
                ) : (
                  <Text style={[styles.timerText, { color: colors.error }]}>Code expiré</Text>
                )}
              </View>

              <Text style={styles.label}>CODE DE VÉRIFICATION</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                style={styles.input}
                placeholder="6 chiffres"
                keyboardType="number-pad"
                maxLength={6}
              />

              <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.passwordInput}
                  placeholder="Minimum 6 caractères"
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={18} color={colors.gray400} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.primaryButton, (loading || secondsLeft === 0) && styles.disabled]}
                onPress={resetPassword}
                disabled={loading || secondsLeft === 0}
              >
                <Text style={styles.primaryText}>{loading ? "Validation…" : "Réinitialiser le mot de passe"}</Text>
              </Pressable>

              {/* Resend link */}
              <Pressable
                onPress={resendCode}
                style={[styles.resendBtn, secondsLeft > 0 && styles.disabled]}
                disabled={loading || secondsLeft > 0}
              >
                <Text style={styles.resendText}>
                  {secondsLeft > 0 ? `Renvoyer le code (${formatCountdown(secondsLeft)})` : "Renvoyer un nouveau code"}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {!!infoMessage && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} />
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        )}
        {!!errorMessage && (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 28, gap: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  title: { fontSize: 26, fontWeight: "800", color: colors.gray900 },
  subtitle: { fontSize: 13, color: colors.gray500, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 10,
  },
  label: { fontSize: 11, color: colors.gray500, fontWeight: "700", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: colors.gray50,
    color: colors.gray900,
    fontSize: 15,
  },
  inputDisabled: { opacity: 0.6 },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    alignItems: "center",
    paddingVertical: 14,
  },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  timerText: { fontSize: 12, color: colors.success, fontWeight: "600" },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.lg,
    backgroundColor: colors.gray50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.gray900,
    fontSize: 15,
  },
  eyeBtn: { padding: 10 },
  resendBtn: { alignSelf: "center", paddingVertical: 4 },
  resendText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  infoText: { flex: 1, fontSize: 12, color: colors.primary },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  errorText: { flex: 1, fontSize: 12, color: colors.error },
  // Success screen
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  successTitle: { fontSize: 22, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  successSub: { fontSize: 14, color: colors.gray500, textAlign: "center" },
});

export default ForgotPassword;