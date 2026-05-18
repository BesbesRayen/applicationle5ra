/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext } from "react";

export type AppRoute =
  | "Login"
  | "ForgotPassword"
  | "Register"
  | "EmailVerification"
  | "Home"
  | "Shops"
  | "ShopProducts"
  | "ProductDetail"
  | "Credit"
  | "CreadiScore"
  | "Installments"
  | "Profile"
  | "PersonalInformation"
  | "EditProfileField"
  | "Support"
  | "Kyc"
  | "Cards"
  | "FinancialProfile"
  | "PaymentHistory"
  | "Notifications"
  | "QRScanner"
  | "NotFound";

interface AppNavigationValue {
  route: AppRoute;
  params?: Record<string, unknown>;
  navigate: (route: AppRoute, params?: Record<string, unknown>) => void;
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null);

interface AppNavigationProviderProps {
  value: AppNavigationValue;
  children: ReactNode;
}

export const AppNavigationProvider = ({ value, children }: AppNavigationProviderProps) => {
  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
};

export const useAppNavigation = () => {
  const context = useContext(AppNavigationContext);

  if (!context) {
    throw new Error("useAppNavigation must be used inside AppNavigationProvider");
  }

  return context;
};
