import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import ShopListItem from "@/components/shops/ShopListItem";
import { getShopCatalogShops, invalidateShopCatalogCache, ShopCatalogShop } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const Shops = () => {
  const { navigate } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<ShopCatalogShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStores = async (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateShopCatalogCache();
    }
    setErrorMessage("");
    try {
      const catalogShops = await getShopCatalogShops();
      setShops(catalogShops);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les boutiques.");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadStores().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores(true);
    setRefreshing(false);
  };

  const filtered = useMemo(() => shops.filter((s) => {
    const term = search.toLowerCase();
    return s.name.toLowerCase().includes(term);
  }), [search, shops]);

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Boutiques</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholder="Rechercher une boutique..."
          placeholderTextColor="#6b6b80"
        />

        <View style={styles.list}>
          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          {loading && <Text style={styles.infoText}>Chargement des boutiques...</Text>}

          {filtered.map((store) => (
            <ShopListItem
              key={store.id}
              shop={store}
              onPress={() => navigate("ShopProducts", { merchantId: store.id, merchantName: store.name })}
            />
          ))}

          {!loading && filtered.length === 0 && (
            <Text style={styles.emptyText}>Aucune boutique trouvee.</Text>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  searchInput: { marginTop: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.gray900 },
  list: { marginTop: 2, gap: 10 },
  infoText: { paddingTop: 12, fontSize: 12, color: colors.gray500 },
  errorText: { paddingTop: 12, fontSize: 12, color: colors.error },
  emptyText: { paddingVertical: 12, fontSize: 12, color: colors.gray500 },
});

export default Shops;
