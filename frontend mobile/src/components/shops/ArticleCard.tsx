import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ShopCatalogArticle } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

interface ArticleCardProps {
  article: ShopCatalogArticle;
  width: number;
  onOpen: () => void;
  onVisitStore: () => void;
}

const ArticleCard = ({ article, width, onOpen, onVisitStore }: ArticleCardProps) => {
  return (
    <View style={[styles.card, { width }]}>
      <Image source={{ uri: article.imageUrl }} style={styles.image} />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>{article.name}</Text>
        <Text style={styles.subtitle}>Voir les produits</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.visitButton} onPress={onVisitStore}>
            <Text style={styles.visitButtonText}>Visit Store</Text>
          </Pressable>
          <Pressable style={styles.buyButton} onPress={onOpen}>
            <Text style={styles.buyButtonText}>Open Article</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 132,
    backgroundColor: colors.surface,
  },
  body: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 7,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.gray900,
    minHeight: 36,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.accent,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  visitButton: { flex: 1, borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingVertical: 9, backgroundColor: colors.surface },
  visitButtonText: { color: colors.gray700, fontWeight: "700", fontSize: 11 },
  buyButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingVertical: 9 },
  buyButtonText: { color: colors.white, fontWeight: "700", fontSize: 11 },
});

export default ArticleCard;
