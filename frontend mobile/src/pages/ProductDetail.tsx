import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import ProductGridCard from "@/components/shops/ProductGridCard";
import { useAppNavigation } from "@/lib/app-navigation";
import { getShopCatalogArticle, getShopCatalogArticleProducts, ShopCatalogProduct } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const ProductDetail = () => {
  const { navigate, params } = useAppNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const merchantId = Number(params?.merchantId ?? 0);
  const merchantName = String(params?.merchantName ?? "Boutique");
  const articleId = Number(params?.articleId ?? 0);
  const articleNameFromParams = String(params?.articleName ?? "Article");

  const [articleName, setArticleName] = useState(articleNameFromParams);
  const [products, setProducts] = useState<ShopCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const columnCount = screenWidth >= 860 ? 3 : 2;
  const itemWidth = (() => {
    const totalGap = (columnCount - 1) * 10;
    const available = screenWidth - 40 - totalGap;
    return available / columnCount;
  })();

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [article, result] = await Promise.all([
          getShopCatalogArticle(merchantId, articleId),
          getShopCatalogArticleProducts(merchantId, articleId),
        ]);
        if (article?.name) {
          setArticleName(article.name);
        }
        setProducts(result.slice(0, 3));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les produits.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [merchantId, articleId]);

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("ShopProducts", { merchantId, merchantName })} style={styles.backButton}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>{merchantName}</Text>
        </View>

        <Text style={styles.articleTitle}>{articleName}</Text>

        {loading && <Text style={styles.infoText}>Chargement des produits...</Text>}
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.grid}>
          {products.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              width={itemWidth}
              onBuy={() =>
                navigate("Credit", {
                  merchantId,
                  articleId: product.articleId,
                  prefillAmount: product.priceTnd,
                  productName: product.name,
                  boutiqueName: merchantName,
                  productImageUrl: product.imageUrl,
                })
              }
            />
          ))}
        </View>

        {!loading && products.length === 0 && !errorMessage && (
          <Text style={styles.infoText}>Aucun produit disponible pour cet article.</Text>
        )}
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
  articleTitle: { fontSize: 16, fontWeight: "700", color: colors.gray700, marginBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error },
});

export default ProductDetail;
