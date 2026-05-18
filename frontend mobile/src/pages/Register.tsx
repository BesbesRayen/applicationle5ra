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
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const Register = () => {
  const { navigate } = useAppNavigation();
  const { setUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const auth = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      // Don't set auth token yet — user must verify email first
      navigate("EmailVerification", { email: auth.email ?? email.trim() });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de creation du compte.");
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
              <Text style={styles.logoText}>+</Text>
            </View>

            <Text style={styles.title}>Creer votre compte</Text>
            <Text style={styles.subtitle}>Inscrivez-vous pour commencer avec CreadiTN</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>PRENOM</Text>
                <TextInput
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Prenom"
                  placeholderTextColor="#6b6b80"
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>NOM</Text>
                <TextInput
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Nom"
                  placeholderTextColor="#6b6b80"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearError();
                }}
                style={styles.input}
                placeholder="vous@exemple.com"
                placeholderTextColor="#6b6b80"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.label}>TELEPHONE (OPTIONNEL)</Text>
              <TextInput
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  clearError();
                }}
                style={styles.input}
                placeholder="+216 XX XXX XXX"
                placeholderTextColor="#6b6b80"
                keyboardType="phone-pad"
              />
            </View>

            <View>
            <View>
              <Text style={styles.label}>ADRESSE (OPTIONNEL)</Text>
              <TextInput
                value={address}
                onChangeText={(value) => {
                  setAddress(value);
                  clearError();
                }}
                style={styles.input}
                placeholder="Ville, quartier..."
                placeholderTextColor="#6b6b80"
              />
            </View>
              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
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

            <View>
              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearError();
                  }}
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6b6b80"
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.passwordToggleText}>{showConfirmPassword ? "🙈" : "👁"}</Text>
                </Pressable>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? "Creation..." : "Creer un compte"}
              </Text>
            </TouchableOpacity>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </View>

          <Text style={styles.footerText}>
            Vous avez deja un compte?{" "}
            <Text style={styles.footerAction} onPress={() => navigate("Login")}>
              Se connecter
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
    paddingVertical: 28,
  },
  headerBlock: {
    marginBottom: 30,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xxl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: {
    fontSize: 30,
    color: colors.white,
    fontWeight: "800",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.gray900,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray500,
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
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
  registerButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  footerText: {
    marginTop: 26,
    textAlign: "center",
    color: colors.gray500,
    fontSize: 14,
  },
  footerAction: {
    color: colors.primary,
    fontWeight: "700",
  },
});

export default Register;
