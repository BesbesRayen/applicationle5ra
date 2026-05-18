import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppNavigation } from "@/lib/app-navigation";
import { login, setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const Login = () => {
  const { navigate } = useAppNavigation();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Veuillez saisir votre email et mot de passe.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await login({
        email: email.trim(),
        password,
      });
      setAuthToken(auth.token as string);
      setUser({
        userId: auth.userId,
        email: auth.email,
        firstName: auth.firstName,
        lastName: auth.lastName,
      }, auth.token as string);
      navigate("Home");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Echec de connexion.";
      // Backend prefixes unverified-email errors with EMAIL_NOT_VERIFIED:
      if (msg.includes("EMAIL_NOT_VERIFIED")) {
        navigate("EmailVerification", { email: email.trim() });
        return;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerBlock}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>🛡</Text>
            </View>

            <Text style={styles.title}>
              Bienvenue sur{"\n"}
              <Text style={styles.brand}>CreadiTN</Text>
            </Text>

            <Text style={styles.subtitle}>Votre plateforme de micro-credit intelligent</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                style={styles.input}
                placeholder="vous@exemple.com"
                placeholderTextColor="#6b6b80"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6b6b80"
                  secureTextEntry={!showPassword}
                />

                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.passwordToggleText}>{showPassword ? "🙈" : "👁"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.forgotRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigate("ForgotPassword")}>
                <Text style={styles.forgotText}>Mot de passe oublie ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.loginButtonText}>
                {isSubmitting ? "Connexion..." : "Se connecter ->"}
              </Text>
            </TouchableOpacity>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.85}
            onPress={() => navigate("Home")}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Pas encore de compte ?{" "}
            <Text style={styles.footerAction} onPress={() => navigate("Register")}>
              Creer un compte
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  flexOne: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  headerBlock: {
    marginBottom: 40,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xxl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    color: colors.white,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.gray900,
  },
  brand: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray500,
  },
  form: {
    gap: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    color: colors.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.gray900,
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
    borderRadius: radii.lg,
    paddingLeft: 14,
    paddingRight: 46,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.gray900,
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordToggleText: {
    fontSize: 16,
  },
  forgotRow: {
    alignItems: "flex-end",
  },
  forgotText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  loginButton: {
    marginTop: 4,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 4,
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
  },
  separatorRow: {
    marginVertical: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  separatorText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.gray400,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.googleRed,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray900,
  },
  footerText: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 14,
    color: colors.gray500,
  },
  footerAction: {
    fontWeight: "700",
    color: colors.primary,
  },
});

export default Login;
