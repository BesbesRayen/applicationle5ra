import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

interface MobileLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

const MobileLayout = ({ children, noPadding = false }: MobileLayoutProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, !noPadding && styles.withPadding]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  withPadding: {
    paddingHorizontal: 20,
  },
});

export default MobileLayout;
