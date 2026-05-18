import { useCallback, useEffect, useState } from "react";
import {
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
  EmploymentStatus,
  FinancialProfile,
  FinancialProfilePayload,
  getFinancialProfile,
  saveFinancialProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string; icon: string }[] = [
  { value: "FULL_TIME", label: "Full Time", icon: "briefcase-outline" },
  { value: "PART_TIME", label: "Part Time", icon: "briefcase-clock-outline" },
  { value: "SELF_EMPLOYED", label: "Self-Employed", icon: "storefront-outline" },
  { value: "STUDENT", label: "Student", icon: "school-outline" },
  { value: "UNEMPLOYED", label: "Unemployed", icon: "account-search-outline" },
  { value: "OTHER", label: "Other", icon: "dots-horizontal" },
];

const SALARY_DAYS = [1, 5, 10, 15, 20, 25, 28, 30];

const FinancialProfilePage = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [salary, setSalary] = useState("");
  const [salaryDay, setSalaryDay] = useState<number>(25);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("FULL_TIME");

  const loadProfile = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getFinancialProfile(user.userId);
      if (data) {
        setProfile(data);
        setSalary(data.monthlySalary.toString());
        setSalaryDay(data.salaryDay);
        setEmploymentStatus(data.employmentStatus as EmploymentStatus);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    if (!user) return;

    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setErrorMessage("Monthly salary must be a positive number");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const payload: FinancialProfilePayload = {
        monthlySalary: salaryNum,
        salaryDay,
        employmentStatus,
      };
      const saved = await saveFinancialProfile(user.userId, payload);
      setProfile(saved);
      setSuccessMessage("Financial profile saved! Your credit limit will update.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const dueDate = `${salaryDay + 2 > 28 ? 28 : salaryDay + 2}th of each month`;

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
        <Text style={styles.title}>Financial Profile</Text>
        <Text style={styles.subtitle}>
          Required to calculate your credit limit and schedule installments
        </Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        {loading && <Text style={styles.loadingText}>Loading...</Text>}

        {profile && (
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Profile completed</Text>
              <Text style={styles.summaryDetail}>Salary: {profile.monthlySalary} DT / Payday: {profile.salaryDay}th</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Monthly Salary (DT)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.gray500}
            keyboardType="decimal-pad"
            value={salary}
            onChangeText={setSalary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Salary Day</Text>
          <Text style={styles.fieldHint}>Day of month you receive your salary</Text>
          <View style={styles.dayGrid}>
            {SALARY_DAYS.map((day) => (
              <Pressable
                key={day}
                onPress={() => setSalaryDay(day)}
                style={[styles.dayChip, salaryDay === day && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, salaryDay === day && { color: colors.white }]}>
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.dueDateHint}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.primary} />
            <Text style={styles.dueDateText}>Installments due: {dueDate}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Employment Status</Text>
          <View style={styles.employmentGrid}>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setEmploymentStatus(opt.value)}
                style={[styles.empBtn, employmentStatus === opt.value && styles.empBtnActive]}
              >
                <MaterialCommunityIcons
                  name={opt.icon as never}
                  size={18}
                  color={employmentStatus === opt.value ? colors.white : colors.gray500}
                />
                <Text style={[styles.empBtnText, employmentStatus === opt.value && { color: colors.white }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Save Profile"}
          </Text>
        </Pressable>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: 13, color: colors.gray500, lineHeight: 20 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "600" },
  successText: {
    fontSize: 13, color: colors.success, fontWeight: "600", textAlign: "center",
    paddingVertical: 8, backgroundColor: "#0d2818", borderRadius: radii.md, paddingHorizontal: 12,
  },
  summaryCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#0d2818", borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.successBorder, padding: 12,
  },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: colors.success },
  summaryDetail: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.cardBorder, padding: 14, gap: 8,
  },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: colors.gray700, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldHint: { fontSize: 11, color: colors.gray500, marginTop: -4 },
  input: {
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.gray900,
  },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 13, fontWeight: "700", color: colors.gray700 },
  dueDateHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primaryBg, borderRadius: radii.sm, padding: 8,
    borderWidth: 1, borderColor: colors.primaryLight,
  },
  dueDateText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  employmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface,
  },
  empBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  empBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray500 },
  primaryButton: {
    backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },
});

export default FinancialProfilePage;
