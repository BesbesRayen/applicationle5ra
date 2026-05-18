import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors } from "@/lib/theme";

const NotFound = () => {
  const { navigate } = useAppNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>Oops! Page not found</Text>
      <Pressable onPress={() => navigate("Login")}>
        <Text style={styles.link}>Return to Home</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.pageBg, gap: 8 },
  code: { fontSize: 42, fontWeight: "700", color: colors.gray900 },
  message: { fontSize: 20, color: colors.gray500 },
  link: { fontSize: 14, color: colors.primary, textDecorationLine: "underline" },
});

export default NotFound;
