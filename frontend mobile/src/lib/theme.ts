import { StyleSheet } from "react-native";

export const colors = {
  primary: "#6C63FF",
  primaryLight: "#1e1e3a",
  primaryBg: "#1a1a2e",

  accent: "#22C55E",
  accentLight: "#0d3320",

  success: "#10B981",
  successLight: "#0d2e23",
  successBorder: "#065f46",

  error: "#EF4444",
  errorLight: "#3b1111",
  errorBorder: "#7f1d1d",

  warning: "#F59E0B",
  warningLight: "#3b2e00",
  warningBorder: "#92400e",

  white: "#ffffff",

  gray50: "#1a1a2e",
  gray100: "#1e1e3a",
  gray200: "#2a2a4a",
  gray300: "#3a3a5a",
  gray400: "#6b6b80",
  gray500: "#8b8ba0",
  gray600: "#a0a0b8",
  gray700: "#c0c0d0",
  gray800: "#e0e0e8",
  gray900: "#f0f0f5",

  pageBg: "#0f0f1a",

  card: "#16162a",
  cardBorder: "#2a2a4a",
  surface: "#1e1e3a",
  surfaceLight: "#1a1a2e",

  googleRed: "#ea4335",
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  full: 999,
} as const;

export const commonStyles = StyleSheet.create({
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
  label: {
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    color: colors.gray700,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700" as const,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center" as const,
  },
  secondaryButtonText: {
    color: colors.gray700,
    fontWeight: "600" as const,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
  disabled: {
    opacity: 0.7,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.gray700,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray500,
  },
});
