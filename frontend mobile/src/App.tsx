import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Linking, StyleSheet, View } from "react-native";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import EmailVerification from "./pages/EmailVerification";
import Home from "./pages/Home";
import Shops from "./pages/Shops";
import ShopProducts from "./pages/ShopProducts";
import ProductDetail from "./pages/ProductDetail";
import Credit from "./pages/Credit";
import CreadiScoreDashboard from "./pages/CreadiScoreDashboard";
import Installments from "./pages/Installments";
import Profile from "./pages/Profile";
import PersonalInformation from "./pages/PersonalInformation";
import EditProfileField from "./pages/EditProfileField";
import Support from "./pages/Support";
import KycVerification from "./pages/KycVerification";
import Cards from "./pages/Cards";
import FinancialProfilePage from "./pages/FinancialProfile";
import PaymentHistory from "./pages/PaymentHistory";
import Notifications from "./pages/Notifications";
import QRScanner from "./pages/QRScanner";
import NotFound from "./pages/NotFound";
import { AppNavigationProvider, AppRoute } from "@/lib/app-navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
const queryClient = new QueryClient();

const routeRank: Record<AppRoute, number> = {
  Login: 0,
  ForgotPassword: 1,
  Register: 1,
  EmailVerification: 1,
  Home: 2,
  Shops: 3,
  ShopProducts: 4,
  ProductDetail: 5,
  Credit: 3,
  CreadiScore: 3,
  Installments: 3,
  Profile: 3,
  PersonalInformation: 4,
  EditProfileField: 4,
  Support: 3,
  Kyc: 4,
  Cards: 3,
  FinancialProfile: 4,
  PaymentHistory: 4,
  Notifications: 3,
  QRScanner: 3,
  NotFound: 99,
};

// Parse creditn:// deep links and return nav state
function resolveDeepLink(url: string): { route: AppRoute; params?: Record<string, unknown> } | null {
  if (!url.startsWith("creditn://")) return null;
  try {
    const rest = url.slice("creditn://".length);
    const [pathPart, queryPart] = rest.split("?");
    const segments = pathPart.split("/").filter(Boolean);
    const params: Record<string, string> = {};
    if (queryPart) {
      queryPart.split("&").forEach((kv) => {
        const [k, v] = kv.split("=");
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
      });
    }
    const [resource, id] = segments;
    if (resource === "product" && params.articleId) {
      return {
        route: "ProductDetail",
        params: {
          articleId: Number(params.articleId),
          merchantId: Number(params.shop ?? 0),
          merchantName: params.shopName ?? "",
          fromQR: true,
        },
      };
    }
    if (resource === "shop") {
      return {
        route: "ShopProducts",
        params: { merchantId: 0, merchantName: params.name ?? "", fromQR: true },
      };
    }
    if (resource === "open") {
      return { route: "Home" };
    }
  } catch {/* ignore */}
  return null;
}

const AppShell = () => {
  const { user, isLoadingAuth } = useAuth();
  const [navState, setNavState] = useState<{ route: AppRoute; params?: Record<string, unknown> }>({ route: "Login" });
  const transition = useRef(new Animated.Value(1)).current;
  const previousRoute = useRef<AppRoute>("Login");
  const direction = useRef(1);

  // Once auth loads, auto-navigate to Home if session was restored
  useEffect(() => {
    if (!isLoadingAuth && user) {
      setNavState({ route: "Home" });
    }
  }, [isLoadingAuth, user]);

  // Handle deep links (cold start + foreground)
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const nav = resolveDeepLink(url);
      if (nav) setNavState({ route: nav.route, params: nav.params });
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const prevRank = routeRank[previousRoute.current] ?? 0;
    const nextRank = routeRank[navState.route] ?? 0;
    direction.current = nextRank >= prevRank ? 1 : -1;

    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    previousRoute.current = navState.route;
  }, [navState.route, transition]);

  const screen = useMemo(() => {
    switch (navState.route) {
      case "Login":
        return <Login />;
      case "ForgotPassword":
        return <ForgotPassword />;
      case "Register":
        return <Register />;
      case "EmailVerification":
        return <EmailVerification />;
      case "Home":
        return <Home />;
      case "Shops":
        return <Shops />;
      case "ShopProducts":
        return <ShopProducts />;
      case "ProductDetail":
        return <ProductDetail />;
      case "Credit":
        return <Credit />;
      case "CreadiScore":
        return <CreadiScoreDashboard />;
      case "Installments":
        return <Installments />;
      case "Profile":
        return <Profile />;
      case "PersonalInformation":
        return <PersonalInformation />;
      case "EditProfileField":
        return <EditProfileField />;
      case "Support":
        return <Support />;
      case "Kyc":
        return <KycVerification />;
      case "Cards":
        return <Cards />;
      case "FinancialProfile":
        return <FinancialProfilePage />;
      case "PaymentHistory":
        return <PaymentHistory />;
      case "Notifications":
        return <Notifications />;
      case "QRScanner":
        return <QRScanner />;
      default:
        return <NotFound />;
    }
  }, [navState.route]);

  // Show splash while restoring saved session
  if (isLoadingAuth) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <AppNavigationProvider
      value={{
        route: navState.route,
        params: navState.params,
        navigate: (route, params) => setNavState({ route, params }),
      }}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: transition,
            transform: [
              {
                translateX: transition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [direction.current * 20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {screen}
      </Animated.View>
    </AppNavigationProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
  },
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f1a",
  },
});

export default App;
