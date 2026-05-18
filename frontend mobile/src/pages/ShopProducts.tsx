import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import ArticleCard from "@/components/shops/ArticleCard";
import { useAppNavigation } from "@/lib/app-navigation";
import { getShopCatalogArticles, getShopCatalogShop, getShopCatalogShops, ShopCatalogArticle } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const ShopProducts = () => {
  const { navigate, params } = useAppNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const rawMerchantId = Number(params?.merchantId ?? 0);
  const rawMerchantName = String(params?.merchantName ?? "Boutique");
  const fromQR = Boolean(params?.fromQR);

  const [resolvedMerchantId, setResolvedMerchantId] = useState(rawMerchantId);
  const [resolvedMerchantName, setResolvedMerchantName] = useState(rawMerchantName);
  const [storeUrl, setStoreUrl] = useState("");
  const [articles, setArticles] = useState<ShopCatalogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        let shopId = rawMerchantId;

        // QR code flow: merchantId is 0, resolve by name
        if (fromQR && rawMerchantId === 0 && rawMerchantName) {
          const allShops = await getShopCatalogShops();
          const match = allShops.find(
            (s) => s.name.toLowerCase() === rawMerchantName.toLowerCase(),
          );
          if (match) {
            shopId = match.id;
            setResolvedMerchantId(match.id);
            setResolvedMerchantName(match.name);
          }
        }

        const [shop, result] = await Promise.all([
          getShopCatalogShop(shopId),
          getShopCatalogArticles(shopId),
        ]);
        setStoreUrl(shop?.storeUrl ?? "");
        if (shop?.name) setResolvedMerchantName(shop.name);
        setArticles(result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les articles.");
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawMerchantId, rawMerchantName]);

  const columnCount = screenWidth >= 860 ? 3 : 2;
  const itemWidth = useMemo(() => {
    const totalGap = (columnCount - 1) * 10;
    const available = screenWidth - 40 - totalGap;
    return available / columnCount;
  }, [columnCount, screenWidth]);

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Shops")} style={styles.backButton}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>{resolvedMerchantName}</Text>
        </View>

        {loading && <Text style={styles.infoText}>Chargement des articles...</Text>}
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.grid}>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              width={itemWidth}
              onOpen={() =>
                navigate("ProductDetail", {
                  merchantId: resolvedMerchantId,
                  merchantName: resolvedMerchantName,
                  articleId: article.id,
                  articleName: article.name,
                })
              }
              onVisitStore={() => {
                const url = article.sourceUrl || storeUrl;
                if (url) Linking.openURL(url);
              }}
            />
          ))}
        </View>

        {!loading && articles.length === 0 && <Text style={styles.empty}>Aucun article disponible pour cette boutique.</Text>}
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  backText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, flex: 1 },
  infoText: { fontSize: 12, color: colors.gray500, marginTop: 6 },
  errorText: { fontSize: 12, color: colors.error, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  empty: { fontSize: 12, color: colors.gray500, marginTop: 12 },
});

export default ShopProducts;
