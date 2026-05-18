import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppNavigation } from "@/lib/app-navigation";
import { resendVerification, verifyEmail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const EmailVerification = () => {
  const { navigate, params } = useAppNavigation();
  const { setUser } = useAuth();

  const email = (params?.email as string) ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Tick-down cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const code = digits.join("");

  const handleDigitChange = (value: string, index: number) => {
    // Allow paste of full 6-digit code
    if (value.length === CODE_LENGTH && /^\d{6}$/.test(value)) {
      const arr = value.split("");
      setDigits(arr);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (code.length < CODE_LENGTH) {
      setError("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await verifyEmail(email, code);
      if (res.token) {
        setUser({
          userId: res.userId,
          email: res.email,
          firstName: res.firstName,
          lastName: res.lastName,
        }, res.token);
        navigate("Home");
      } else {
        setError(res.message ?? "Vérification échouée.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setError("");
    setSuccessMsg("");
    try {
      await resendVerification(email);
      setSuccessMsg("Un nouveau code vous a été envoyé.");
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible de renvoyer le code.";
      setError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>✉️</Text>
          </View>
          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un code à 6 chiffres à{"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          {/* OTP inputs */}
          <View style={styles.codeRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                style={[styles.codeInput, d ? styles.codeInputFilled : null]}
                value={d}
                onChangeText={(v) => handleDigitChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH} // allow paste
                selectTextOnFocus
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            ))}
          </View>

          {/* Error / success messages */}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Vérifier</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Vous n'avez pas reçu le code ? </Text>
            <Pressable onPress={handleResend} disabled={cooldown > 0}>
              <Text style={[styles.resendLink, cooldown > 0 && styles.resendDisabled]}>
                {cooldown > 0 ? `Renvoyer (${cooldown}s)` : "Renvoyer"}
              </Text>
            </Pressable>
          </View>

          {/* Back to login */}
          <Pressable onPress={() => navigate("Login")} style={styles.backRow}>
            <Text style={styles.backText}>← Retour à la connexion</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5ff" },
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: { fontSize: 34 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F1F3D",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: { color: colors.primary, fontWeight: "600" },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#1F1F3D",
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: "#EDE9FE",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    maxWidth: 300,
  },
  success: {
    color: "#16a34a",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  resendLabel: { color: "#6b7280", fontSize: 13 },
  resendLink: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  resendDisabled: { color: "#9ca3af" },
  backRow: { marginTop: 4 },
  backText: { color: "#6b7280", fontSize: 13 },
});

export default EmailVerification;
