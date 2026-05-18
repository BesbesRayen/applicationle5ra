import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import MobileLayout from "@/components/MobileLayout";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

// Parse creditn:// deep links
function parseDeepLink(url: string): { route: string; params: Record<string, string> } | null {
  try {
    if (!url.startsWith("creditn://")) return null;
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
    return { route: segments.join("/"), params };
  } catch {
    return null;
  }
}

export default function QRScanner() {
  const { navigate } = useAppNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState("");
  const cooldown = useRef(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (cooldown.current || scanned) return;
    cooldown.current = true;
    setScanned(true);

    const parsed = parseDeepLink(data);
    if (!parsed) {
      setError("QR code non reconnu. Utilisez un QR code CreditTN.");
      cooldown.current = false;
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    const [resource] = parsed.route.split("/");

    if (resource === "product" && parsed.params.articleId) {
      navigate("ProductDetail", {
        articleId: Number(parsed.params.articleId),
        merchantId: Number(parsed.params.shop ?? 0),
        merchantName: parsed.params.shopName ?? "",
        fromQR: true,
      });
    } else if (resource === "shop") {
      // name-based: creditn://shop?name=MyTek
      navigate("ShopProducts", {
        merchantId: 0, // ShopProducts will use name to find real ID
        merchantName: parsed.params.name ?? "",
        fromQR: true,
      });
    } else {
      navigate("Shops");
    }
  };;

  const reset = () => {
    setScanned(false);
    setError("");
    cooldown.current = false;
  };

  if (!permission) {
    return (
      <MobileLayout>
        <View style={styles.center}>
          <Text style={styles.infoText}>Demande d&apos;accès caméra…</Text>
        </View>
      </MobileLayout>
    );
  }

  if (!permission.granted) {
    return (
      <MobileLayout>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Accès caméra refusé.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={[styles.retryButton, { marginTop: 12 }]}>
            <Text style={styles.retryText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate("Home")} style={styles.backButton}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scanner un QR Code</Text>
        </View>

        {/* Camera */}
        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </View>

        {/* Bottom area */}
        <View style={styles.bottom}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={reset} style={styles.retryButton}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </>
          ) : scanned ? (
            <View style={styles.successRow}>
              <Text style={styles.successText}>✓ QR détecté — ouverture en cours…</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Pointez la caméra vers un QR Code CreditTN
            </Text>
          )}
        </View>
      </View>
    </MobileLayout>
  );
}

const FRAME = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1c" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#0a0f1c",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backButton: { marginBottom: 6 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cameraWrapper: { flex: 1, position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radii.sm },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radii.sm },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radii.sm },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radii.sm },
  bottom: {
    padding: 24,
    backgroundColor: "#0a0f1c",
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  hint: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center" },
  successRow: { alignItems: "center" },
  successText: { color: "#4ade80", fontSize: 15, fontWeight: "600" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  infoText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
});
