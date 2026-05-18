import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppRoute, useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const tabs = [
  { route: "Home" as AppRoute, icon: "home-outline", label: "Accueil" },
  { route: "Shops" as AppRoute, icon: "storefront-outline", label: "Boutiques" },
  { route: "Credit" as AppRoute, icon: "cash-fast", label: "Crédit" },
  { route: "Installments" as AppRoute, icon: "cash-clock", label: "Paiements" },
  { route: "Profile" as AppRoute, icon: "account-outline", label: "Profil" },
];

const BottomNav = () => {
  const { route, navigate } = useAppNavigation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = route === tab.route;

          return (
            <Pressable
              key={tab.route}
              onPress={() => navigate(tab.route)}
              style={styles.tabButton}
            >
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <MaterialCommunityIcons name={tab.icon as never} size={18} style={[styles.icon, isActive && styles.iconActive]} />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xxl,
    paddingVertical: 8,
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 4,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: colors.primary,
  },
  icon: {
    color: colors.gray500,
  },
  iconActive: {
    color: colors.white,
  },
  label: {
    marginTop: 2,
    fontSize: 10,
    color: colors.gray500,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
  },

});

export default BottomNav;
