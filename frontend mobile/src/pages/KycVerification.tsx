import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAppNavigation } from "@/lib/app-navigation";
import { useAuth } from "@/lib/auth";
import {
  submitKycVerification,
  KycVerificationResult,
  UploadFileAsset,
  addCard,
  saveFinancialProfile,
  CardType,
  getKycStatus,
  getCards,
  checkHasFinancialProfile,
} from "@/lib/api";
import { colors } from "@/lib/theme";

const { width: SW, height: SH } = Dimensions.get("window");

const P = colors.primary;
const PL = colors.primaryLight;
const G1 = colors.gray100;
const G3 = colors.gray300;
const G4 = colors.gray400;
const G5 = colors.gray500;
const G7 = colors.gray700;
const G9 = colors.gray900;
const WH = colors.white;
const GR = colors.success;
const RE = colors.error;

// --- Types ---
interface KycData {
  cinNumber: string;
  cinFront: UploadFileAsset | null;
  cinBack: UploadFileAsset | null;
  selfie: UploadFileAsset | null;
}
const INITIAL: KycData = { cinNumber: "", cinFront: null, cinBack: null, selfie: null };

// --- Step Dots ---
const StepDots = ({ current, total }: { current: number; total: number }) => (
  <View style={sd.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[sd.dot, i + 1 === current && sd.dotActive, i + 1 < current && sd.dotDone]}
      />
    ))}
  </View>
);
const sd = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: G3 },
  dotActive: { width: 28, backgroundColor: P },
  dotDone: { backgroundColor: GR },
});

// --- Image Tile ---
const ImageTile = ({
  label,
  subtitle,
  image,
  icon,
  onPick,
}: {
  label: string;
  subtitle: string;
  image: UploadFileAsset | null;
  icon: string;
  onPick: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPick} style={it.tile}>
    {image ? (
      <>
        <Image source={{ uri: image.uri }} style={it.preview} />
        <View style={it.doneOverlay}>
          <View style={it.doneBadge}><Text style={it.doneIcon}>checkmark</Text></View>
        </View>
      </>
    ) : (
      <View style={it.placeholder}>
        <Text style={it.iconText}>{icon}</Text>
        <Text style={it.label}>{label}</Text>
        <Text style={it.subtitle}>{subtitle}</Text>
      </View>
    )}
  </TouchableOpacity>
);
const it = StyleSheet.create({
  tile: {
    flex: 1, height: 130, borderRadius: 16, overflow: "hidden",
    backgroundColor: G1, borderWidth: 1.5, borderColor: G3, borderStyle: "dashed",
  },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  iconText: { fontSize: 28 },
  label: { fontSize: 12, fontWeight: "700", color: G7, textAlign: "center" },
  subtitle: { fontSize: 10, color: G5, textAlign: "center", paddingHorizontal: 6 },
  doneOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(16,185,129,0.15)" },
  doneBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: GR, alignItems: "center", justifyContent: "center" },
  doneIcon: { color: WH, fontWeight: "900", fontSize: 16, display: "none" },
});

// --- Step 1: Identity ---
const Step1 = ({
  data,
  onChange,
  loading,
}: {
  data: KycData;
  onChange: (d: Partial<KycData>) => void;
  loading: boolean;
}) => {
  const pickImage = async (side: "cinFront" | "cinBack") => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission requise", "Autorisez l acces a la galerie."); return; }
      }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true });
      if (!res.canceled && res.assets[0]) {
        const a = res.assets[0];
        onChange({ [side]: { uri: a.uri, fileName: a.fileName ?? `${side}.jpg`, mimeType: a.mimeType ?? "image/jpeg" } });
      }
    } catch { Alert.alert("Erreur", "Impossible d ouvrir la galerie."); }
  };

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission requise", "Autorisez l acces a la camera."); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
      if (!res.canceled && res.assets[0]) {
        const a = res.assets[0];
        onChange({ selfie: { uri: a.uri, fileName: "selfie.jpg", mimeType: a.mimeType ?? "image/jpeg" } });
      }
    } catch { Alert.alert("Erreur", "Impossible d ouvrir la camera."); }
  };

  // Identity number is extracted ONLY by Didit — no manual input allowed.
  const done = !!data.cinFront && !!data.cinBack && !!data.selfie;

  return (
    <View style={s1.wrap}>
      <View style={s1.infoNote}>
        <Text style={s1.infoText}>
          Votre numero de CIN sera extrait automatiquement par Didit. Aucune saisie manuelle n est requise.
        </Text>
      </View>
      <View style={s1.section}>
        <Text style={s1.label}>Photo de la CIN</Text>
        <View style={s1.tileRow}>
          <ImageTile label="Recto" subtitle="Face avant" image={data.cinFront} icon="ID" onPick={() => pickImage("cinFront")} />
          <ImageTile label="Verso" subtitle="Face arriere" image={data.cinBack} icon="FLIP" onPick={() => pickImage("cinBack")} />
        </View>
      </View>
      <View style={s1.section}>
        <Text style={s1.label}>Selfie</Text>
        <Pressable onPress={takeSelfie} style={s1.selfieBtn} disabled={loading}>
          {data.selfie ? (
            <View style={s1.selfiePreviewWrap}>
              <Image source={{ uri: data.selfie.uri }} style={s1.selfiePreview} />
              <View style={s1.selfieEditBadge}><Text style={s1.selfieEditText}>Modifier</Text></View>
            </View>
          ) : (
            <View style={s1.selfiePlaceholder}>
              <Text style={s1.selfieEmoji}>CAM</Text>
              <Text style={s1.selfieHint}>Prendre un selfie</Text>
              <Text style={s1.selfieHintSub}>Centrez votre visage dans le cadre</Text>
            </View>
          )}
        </Pressable>
      </View>
      {loading ? (
        <View style={s1.statusBox}>
          <ActivityIndicator color={P} size="small" />
          <Text style={s1.statusText}>Verification Didit en cours...</Text>
        </View>
      ) : done ? (
        <View style={[s1.statusBox, s1.statusReady]}>
          <Text style={[s1.statusText, { color: GR }]}>Pret - soumission automatique</Text>
        </View>
      ) : (
        <View style={s1.checklist}>
          {[
            { ok: !!data.cinFront, label: "Recto de la CIN" },
            { ok: !!data.cinBack, label: "Verso de la CIN" },
            { ok: !!data.selfie, label: "Selfie" },
          ].map((item) => (
            <View key={item.label} style={s1.checkRow}>
              <Text style={[s1.checkDot, item.ok && s1.checkDotOk]}>{item.ok ? "v" : "o"}</Text>
              <Text style={[s1.checkLabel, item.ok && s1.checkLabelOk]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
const s1 = StyleSheet.create({
  wrap: { flex: 1, gap: 20 },
  infoNote: { backgroundColor: PL, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: P + "44" },
  infoText: { fontSize: 12, color: P, lineHeight: 18 },
  section: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", color: G7, letterSpacing: 0.5 },
  tileRow: { flexDirection: "row", gap: 12 },
  selfieBtn: { height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: G1, borderWidth: 1.5, borderColor: G3, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  selfiePreviewWrap: { width: "100%", height: "100%" },
  selfiePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  selfieEditBadge: { position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  selfieEditText: { color: WH, fontSize: 11, fontWeight: "700" },
  selfiePlaceholder: { alignItems: "center", gap: 6 },
  selfieEmoji: { fontSize: 14, fontWeight: "800", color: G5 },
  selfieHint: { fontSize: 14, fontWeight: "700", color: G7 },
  selfieHintSub: { fontSize: 11, color: G5, textAlign: "center" },
  statusBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: PL, borderRadius: 12, padding: 12 },
  statusReady: { backgroundColor: "#d1fae5" },
  statusText: { color: P, fontSize: 13, fontWeight: "600", flex: 1 },
  checklist: { gap: 6 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkDot: { fontSize: 13, color: G5, width: 16 },
  checkDotOk: { color: GR },
  checkLabel: { fontSize: 12, color: G5 },
  checkLabelOk: { color: G7 },
});

// --- Step 2: Card ---
const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
];

const Step2 = ({
  onSuccess,
  loading,
  setLoading,
  setError,
}: {
  onSuccess: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}) => {
  const { user } = useAuth();
  const [cardType, setCardType] = useState<CardType>("VISA");
  const [num, setNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [name, setName] = useState("");
  const [cvv, setCvv] = useState("");

  const fmtNum = (t: string) => t.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (t: string) => { const d = t.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
  const clean = num.replace(/\s/g, "");
  const valid = clean.length === 16 && expiry.length === 5 && name.trim().length > 1 && cvv.length >= 3;

  const displayNum = clean.length > 0
    ? (clean + "0000000000000000").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
    : "---- ---- ---- ----";

  const submit = async () => {
    if (!user || !valid) return;
    setLoading(true);
    setError(null);
    try {
      await addCard(user.userId, { cardNumber: clean, expiryDate: expiry, cardholderName: name.trim(), type: cardType, cvv, defaultCard: true });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d ajouter la carte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s2.wrap}>
      <View style={[s2.card, cardType === "MASTERCARD" && s2.cardMC]}>
        <View style={s2.cardTop}>
          <Text style={s2.cardNetwork}>{cardType}</Text>
          <View style={s2.chip} />
        </View>
        <Text style={s2.cardNum}>{displayNum}</Text>
        <View style={s2.cardBottom}>
          <View>
            <Text style={s2.cardFieldLabel}>TITULAIRE</Text>
            <Text style={s2.cardFieldValue}>{name.toUpperCase() || "VOTRE NOM"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s2.cardFieldLabel}>EXPIRATION</Text>
            <Text style={s2.cardFieldValue}>{expiry || "MM/AA"}</Text>
          </View>
        </View>
      </View>
      <View style={s2.typeRow}>
        {CARD_TYPES.map((ct) => (
          <Pressable key={ct.value} style={[s2.typeBtn, cardType === ct.value && s2.typeBtnActive]} onPress={() => setCardType(ct.value)}>
            <Text style={[s2.typeLabel, cardType === ct.value && s2.typeLabelActive]}>{ct.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s2.fields}>
        <View>
          <Text style={s2.fieldLabel}>Numero de carte</Text>
          <TextInput style={s2.input} value={num} onChangeText={(t) => setNum(fmtNum(t))} placeholder="1234 5678 9012 3456" placeholderTextColor={G4} keyboardType="numeric" maxLength={19} />
        </View>
        <View style={s2.row}>
          <View style={{ flex: 1 }}>
            <Text style={s2.fieldLabel}>Expiration</Text>
            <TextInput style={s2.input} value={expiry} onChangeText={(t) => setExpiry(fmtExp(t))} placeholder="MM/AA" placeholderTextColor={G4} keyboardType="numeric" maxLength={5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s2.fieldLabel}>CVV</Text>
            <TextInput style={s2.input} value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 3))} placeholder="..." placeholderTextColor={G4} keyboardType="numeric" maxLength={3} secureTextEntry />
          </View>
        </View>
        <View>
          <Text style={s2.fieldLabel}>Titulaire</Text>
          <TextInput style={s2.input} value={name} onChangeText={setName} placeholder="PRENOM NOM" placeholderTextColor={G4} autoCapitalize="characters" />
        </View>
      </View>
      <Pressable style={[s2.btn, (!valid || loading) && s2.btnOff]} onPress={submit} disabled={!valid || loading}>
        {loading ? <ActivityIndicator color={WH} size="small" /> : <Text style={s2.btnText}>Ajouter la carte</Text>}
      </Pressable>
    </View>
  );
};
const s2 = StyleSheet.create({
  wrap: { flex: 1, gap: 16 },
  card: { borderRadius: 20, padding: 22, gap: 16, backgroundColor: "#3730a3", shadowColor: P, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  cardMC: { backgroundColor: "#7c3aed" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardNetwork: { color: WH, fontWeight: "900", fontSize: 14, letterSpacing: 2, opacity: 0.9 },
  chip: { width: 32, height: 24, borderRadius: 5, backgroundColor: "#f59e0b" },
  cardNum: { color: WH, fontSize: 18, fontWeight: "600", letterSpacing: 3 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardFieldLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  cardFieldValue: { color: WH, fontSize: 13, fontWeight: "700", marginTop: 2 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 10, backgroundColor: G1, borderWidth: 2, borderColor: "transparent" },
  typeBtnActive: { borderColor: P, backgroundColor: PL },
  typeLabel: { fontSize: 13, fontWeight: "700", color: G7 },
  typeLabelActive: { color: P },
  fields: { gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: G7, marginBottom: 5, letterSpacing: 0.5 },
  input: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: G3, paddingHorizontal: 14, fontSize: 15, color: G9, backgroundColor: G1 },
  row: { flexDirection: "row", gap: 12 },
  btn: { backgroundColor: P, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", shadowColor: P, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  btnOff: { opacity: 0.45 },
  btnText: { color: WH, fontWeight: "800", fontSize: 15 },
});

// --- Step 3: Financial ---
const EMP_OPTIONS = [
  { value: "FULL_TIME", label: "Salarie temps plein" },
  { value: "PART_TIME", label: "Salarie temps partiel" },
  { value: "SELF_EMPLOYED", label: "Independant" },
  { value: "STUDENT", label: "Etudiant" },
  { value: "UNEMPLOYED", label: "Sans emploi" },
];
const SAL_DAYS = [1, 5, 10, 15, 20, 25, 28, 30];

const Step3 = ({
  onSuccess,
  loading,
  setLoading,
  setError,
}: {
  onSuccess: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}) => {
  const { user } = useAuth();
  const [salary, setSalary] = useState("");
  const [salaryDay, setSalaryDay] = useState(25);
  const [emp, setEmp] = useState("FULL_TIME");
  const valid = parseFloat(salary) > 0;

  const submit = async () => {
    if (!user || !valid) return;
    setLoading(true);
    setError(null);
    try {
      await saveFinancialProfile(user.userId, { monthlySalary: parseFloat(salary), salaryDay, employmentStatus: emp });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s3.wrap}>
      <View style={s3.section}>
        <Text style={s3.label}>Salaire mensuel net (DT)</Text>
        <View style={s3.salaryRow}>
          <TextInput style={s3.salaryInput} value={salary} onChangeText={(t) => setSalary(t.replace(/[^0-9.]/g, ""))} placeholder="0" placeholderTextColor={G4} keyboardType="numeric" />
          <View style={s3.salaryUnit}><Text style={s3.salaryUnitText}>DT</Text></View>
        </View>
      </View>
      <View style={s3.section}>
        <Text style={s3.label}>Situation professionnelle</Text>
        <View style={s3.empGrid}>
          {EMP_OPTIONS.map((o) => (
            <Pressable key={o.value} style={[s3.empBtn, emp === o.value && s3.empBtnActive]} onPress={() => setEmp(o.value)}>
              <Text style={[s3.empLabel, emp === o.value && s3.empLabelActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={s3.section}>
        <Text style={s3.label}>Jour de reception du salaire</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s3.dayRow}>
            {SAL_DAYS.map((d) => (
              <Pressable key={d} style={[s3.dayBtn, salaryDay === d && s3.dayBtnActive]} onPress={() => setSalaryDay(d)}>
                <Text style={[s3.dayText, salaryDay === d && s3.dayTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <Pressable style={[s3.btn, (!valid || loading) && s3.btnOff]} onPress={submit} disabled={!valid || loading}>
        {loading ? <ActivityIndicator color={WH} size="small" /> : <Text style={s3.btnText}>Terminer la verification</Text>}
      </Pressable>
    </View>
  );
};
const s3 = StyleSheet.create({
  wrap: { flex: 1, gap: 20 },
  section: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", color: G7, letterSpacing: 0.5 },
  salaryRow: { flexDirection: "row" },
  salaryInput: { flex: 1, height: 56, borderRadius: 14, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderWidth: 1.5, borderColor: G3, paddingHorizontal: 16, fontSize: 22, fontWeight: "700", color: G9, backgroundColor: G1 },
  salaryUnit: { width: 56, height: 56, borderRadius: 14, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderWidth: 1.5, borderColor: P + "44", backgroundColor: P + "22", alignItems: "center", justifyContent: "center" },
  salaryUnitText: { color: P, fontWeight: "800", fontSize: 14 },
  empGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: G1, borderWidth: 1.5, borderColor: "transparent" },
  empBtnActive: { borderColor: P, backgroundColor: PL },
  empLabel: { fontSize: 12, color: G7, fontWeight: "600" },
  empLabelActive: { color: P },
  dayRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  dayBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: G1, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "transparent" },
  dayBtnActive: { borderColor: P, backgroundColor: PL },
  dayText: { fontSize: 13, fontWeight: "700", color: G7 },
  dayTextActive: { color: P },
  btn: { backgroundColor: GR, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", shadowColor: GR, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  btnOff: { opacity: 0.45 },
  btnText: { color: WH, fontWeight: "800", fontSize: 15 },
});

// --- Result Screens ---
const SuccessScreen = ({ onDone }: { onDone: () => void }) => (
  <View style={rs.wrap}>
    <View style={rs.iconRing}>
      <Text style={rs.iconText}>OK</Text>
    </View>
    <Text style={rs.title}>Verification reussie !</Text>
    <Text style={rs.sub}>Votre identite est confirmee. Vous pouvez maintenant utiliser tous les services CreadiTN.</Text>
    <Pressable style={rs.btn} onPress={onDone}><Text style={rs.btnText}>Aller a l accueil</Text></Pressable>
  </View>
);

const IdentityUsedScreen = ({ onDone }: { onDone: () => void }) => (
  <View style={rs.wrap}>
    <View style={[rs.iconRing, { backgroundColor: "#fef3c7", borderColor: "#f59e0b" }]}>
      <Text style={[rs.iconText, { color: "#f59e0b" }]}>!</Text>
    </View>
    <Text style={rs.title}>Identite deja enregistree</Text>
    <Text style={rs.sub}>Cette piece d identite est deja liee a un autre compte. Contactez notre support si c est une erreur.</Text>
    <Pressable style={[rs.btn, { backgroundColor: "#f59e0b" }]} onPress={onDone}><Text style={rs.btnText}>Contacter le support</Text></Pressable>
    <Pressable style={rs.ghost} onPress={onDone}><Text style={rs.ghostText}>Retour au profil</Text></Pressable>
  </View>
);

const RejectedScreen = ({ result, onRetry, onDone }: { result: KycVerificationResult; onRetry: () => void; onDone: () => void }) => (
  <View style={rs.wrap}>
    <View style={[rs.iconRing, { backgroundColor: "#fee2e2", borderColor: RE }]}>
      <Text style={[rs.iconText, { color: RE }]}>X</Text>
    </View>
    <Text style={rs.title}>Verification refusee</Text>
    <Text style={rs.sub}>{result.message}</Text>
    <View style={rs.scoreCard}>
      <Text style={rs.scoreLabel}>Score de confiance</Text>
      <View style={rs.bar}>
        <View style={[rs.barFill, { width: `${result.confidence}%`, backgroundColor: result.confidence >= 70 ? GR : result.confidence >= 50 ? "#f59e0b" : RE }]} />
      </View>
      <Text style={rs.scoreVal}>{result.confidence}%</Text>
    </View>
    <Pressable style={[rs.btn, { backgroundColor: RE }]} onPress={onRetry}><Text style={rs.btnText}>Reessayer</Text></Pressable>
    <Pressable style={rs.ghost} onPress={onDone}><Text style={rs.ghostText}>Retour au profil</Text></Pressable>
  </View>
);

const rs = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  iconRing: { width: 88, height: 88, borderRadius: 44, marginBottom: 8, borderWidth: 3, borderColor: GR, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 20, fontWeight: "900", color: GR },
  title: { fontSize: 24, fontWeight: "800", color: G9, textAlign: "center" },
  sub: { fontSize: 14, color: G5, textAlign: "center", lineHeight: 22 },
  btn: { width: "100%", backgroundColor: P, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnText: { color: WH, fontWeight: "800", fontSize: 15 },
  ghost: { width: "100%", alignItems: "center", paddingVertical: 12 },
  ghostText: { color: G5, fontWeight: "600", fontSize: 14 },
  scoreCard: { width: "100%", backgroundColor: G1, borderRadius: 14, padding: 16, gap: 8 },
  scoreLabel: { fontSize: 12, fontWeight: "700", color: G7 },
  bar: { height: 8, backgroundColor: G3, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  scoreVal: { fontSize: 22, fontWeight: "800", color: G9, textAlign: "right" },
});

// --- Step 2: Identity Confirmation (read-only Didit data) ---
const Step2Confirm = ({
  result,
  onConfirm,
  loading,
}: {
  result: KycVerificationResult;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const fullName =
    [result.extractedFirstName, result.extractedLastName].filter(Boolean).join(" ") || "";
  const dob = result.extractedDateOfBirth || "";
  const identityNumber = result.extractedIdentityNumber || "";

  // Block confirm unless ALL 4 identity fields are present (source of truth = Didit only)
  const dataComplete = !!fullName && !!dob && !!identityNumber;

  return (
    <View style={sc.wrap}>
      <View style={sc.banner}>
        <View style={sc.bannerIcon}><Text style={sc.bannerIconText}>ID</Text></View>
        <Text style={sc.bannerTitle}>Identite verifiee par Didit</Text>
        <Text style={sc.bannerSub}>
          Confirmez que ces informations vous appartiennent. Elles seront verrouillee a votre compte.
        </Text>
      </View>

      {!dataComplete && (
        <View style={sc.missingBanner}>
          <Text style={sc.missingText}>
            Les donnees d identite sont incompletes. Veuillez reessayer la verification avec un document plus lisible.
          </Text>
        </View>
      )}

      <View style={sc.card}>
        <View style={sc.row}>
          <Text style={sc.fieldLabel}>Nom complet</Text>
          <Text style={[sc.fieldValue, !fullName && sc.fieldMissing]}>{fullName || "Non disponible"}</Text>
        </View>
        <View style={sc.divider} />
        <View style={sc.row}>
          <Text style={sc.fieldLabel}>Numero CIN</Text>
          <Text style={[sc.fieldValue, !identityNumber && sc.fieldMissing]}>{identityNumber || "Non disponible"}</Text>
        </View>
        <View style={sc.divider} />
        <View style={sc.row}>
          <Text style={sc.fieldLabel}>Date de naissance</Text>
          <Text style={[sc.fieldValue, !dob && sc.fieldMissing]}>{dob || "Non disponible"}</Text>
        </View>
        <View style={sc.divider} />
        <View style={sc.row}>
          <Text style={sc.fieldLabel}>Score de confiance</Text>
          <View style={sc.scoreWrap}>
            <View style={sc.scoreBar}>
              <View
                style={[
                  sc.scoreBarFill,
                  {
                    width: `${result.confidence}%` as `${number}%`,
                    backgroundColor: result.confidence >= 70 ? colors.success : "#f59e0b",
                  },
                ]}
              />
            </View>
            <Text style={[sc.scoreVal, { color: result.confidence >= 70 ? colors.success : "#f59e0b" }]}>
              {result.confidence}%
            </Text>
          </View>
        </View>
      </View>

      <View style={sc.lockNote}>
        <Text style={sc.lockIcon}>LOCK</Text>
        <Text style={sc.lockText}>
          Cette identite sera definitivement liee a votre compte. Aucun autre compte ne pourra utiliser la meme piece d identite.
        </Text>
      </View>

      <Pressable
        style={[sc.btn, (!dataComplete || loading) && sc.btnOff]}
        onPress={onConfirm}
        disabled={!dataComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color={WH} size="small" />
        ) : (
          <Text style={sc.btnText}>Oui, c est bien moi</Text>
        )}
      </Pressable>
    </View>
  );
};
const sc = StyleSheet.create({
  wrap: { flex: 1, gap: 20 },
  banner: { alignItems: "center", gap: 8, paddingTop: 8 },
  bannerIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: PL, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  bannerIconText: { color: P, fontWeight: "900", fontSize: 14 },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: G9, textAlign: "center" },
  bannerSub: { fontSize: 13, color: G5, textAlign: "center", lineHeight: 20 },
  missingBanner: { backgroundColor: "#fee2e2", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fecaca" },
  missingText: { fontSize: 12, color: "#b91c1c", lineHeight: 18 },
  card: { backgroundColor: WH, borderRadius: 18, borderWidth: 1, borderColor: G3, padding: 16, gap: 0 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: G5, letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, fontWeight: "700", color: G9, textAlign: "right", flex: 1, marginLeft: 16 },
  fieldMissing: { color: RE, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: G1 },
  scoreWrap: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginLeft: 16, justifyContent: "flex-end" },
  scoreBar: { height: 6, flex: 1, backgroundColor: G3, borderRadius: 3, overflow: "hidden", maxWidth: 80 },
  scoreBarFill: { height: 6, borderRadius: 3 },
  scoreVal: { fontSize: 13, fontWeight: "800", minWidth: 36, textAlign: "right" },
  lockNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#fde68a" },
  lockIcon: { fontSize: 10, fontWeight: "900", color: "#d97706", marginTop: 1 },
  lockText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18 },
  btn: { backgroundColor: P, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", shadowColor: P, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  btnOff: { opacity: 0.45 },
  btnText: { color: WH, fontWeight: "800", fontSize: 15 },
});

// --- Step metadata ---
const STEPS = [
  { label: "Verification", icon: "ID" },
  { label: "Portefeuille", icon: "CARD" },
  { label: "Finances", icon: "FIN" },
];

// --- Main Component ---
const KycVerification = () => {
  const { navigate } = useAppNavigation();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<KycData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KycVerificationResult | null>(null);
  const [kycSuccess, setKycSuccess] = useState(false);
  const [identityUsed, setIdentityUsed] = useState(false);
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [checking, setChecking] = useState(true);
  const lock = useRef(false);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    // Determine which step to resume based on what the user has already completed.
    (async () => {
      try {
        const kycStatus = await getKycStatus(user.userId);
        if (kycStatus?.status !== "APPROVED") {
          // KYC not yet approved — start at step 1
          return;
        }
        // KYC done — check if card has been added (step 3)
        const cards = await getCards(user.userId).catch(() => []);
        const hasCard = Array.isArray(cards) && cards.length > 0;
        if (!hasCard) {
          // KYC approved but no card yet — resume at step 2
          setStep(2);
          return;
        }
        // Card done — check if financial profile has been filled (step 3)
        const financialCheck = await checkHasFinancialProfile(user.userId).catch(() => ({ exists: false }));
        const hasFinancial = financialCheck?.exists === true;
        if (!hasFinancial) {
          // Card added but no financial profile — resume at step 3
          setStep(3);
          return;
        }
        // Everything complete — show success screen
        setAlreadyApproved(true);
      } catch {
        // Ignore errors — fall back to step 1
      } finally {
        setChecking(false);
      }
    })();
  }, [user]);

  const updateData = useCallback((partial: Partial<KycData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const submit1 = useCallback(async () => {
    if (!user || !data.cinFront || !data.cinBack || lock.current) return;
    lock.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await submitKycVerification(
        user.userId,
        data.cinFront,
        data.cinBack,
        data.selfie,
        "",
        0,
        data.cinNumber.trim(),
      );
      setResult(res);
      if (res.status === "APPROVED") {
        // Step 2 (card) is step index 2 in the new 3-step flow
        setTimeout(() => setStep(2), 900);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue";
      if (
        msg.includes("deja associee") ||
        msg.includes("deja liee") ||
        msg.includes("already associated") ||
        msg.includes("already used")
      ) {
        setIdentityUsed(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      lock.current = false;
    }
  }, [user, data]);

  useEffect(() => {
    const ready =
      step === 1 &&
      !!data.cinFront &&
      !!data.cinBack &&
      !!data.selfie &&
      !loading &&
      !result &&
      !error &&          // do NOT auto-fire again after an error — user must tap retry
      !lock.current;
    if (!ready) return;
    const t = setTimeout(submit1, 700);
    return () => clearTimeout(t);
  }, [step, data.cinFront, data.cinBack, data.selfie, loading, result, error, submit1]);

  useEffect(() => {
    if (!kycSuccess) return;
    const t = setTimeout(() => navigate("Home"), 2500);
    return () => clearTimeout(t);
  }, [kycSuccess, navigate]);

  /**
   * Soft retry — keeps all uploaded photos & CIN number, just clears the
   * error/result state and re-enables auto-submission. Used for transient
   * errors (network, server timeout) so the user doesn't have to re-upload.
   */
  const retryStep1 = () => {
    setResult(null);
    setError(null);
    lock.current = false;
    // auto-submit useEffect will fire again now that error is cleared
  };

  /**
   * Full reset — clears everything and goes back to step 1.
   * Used when the user explicitly wants to start over (e.g. rejected by Didit).
   */
  const fullRetry = () => {
    setResult(null);
    setError(null);
    setData(INITIAL);
    lock.current = false;
    setStep(1);
  };

  if (identityUsed) {
    return (
      <SafeAreaView style={m.safe}>
        <IdentityUsedScreen onDone={() => navigate("Profile")} />
      </SafeAreaView>
    );
  }
  if (result && result.status !== "APPROVED") {
    return (
      <SafeAreaView style={m.safe}>
        <RejectedScreen result={result} onRetry={fullRetry} onDone={() => navigate("Profile")} />
      </SafeAreaView>
    );
  }
  if (kycSuccess) {
    return (
      <SafeAreaView style={m.safe}>
        <SuccessScreen onDone={() => navigate("Home")} />
      </SafeAreaView>
    );
  }
  if (checking) {
    return (
      <SafeAreaView style={m.safe}>
        <View style={m.center}>
          <ActivityIndicator color={P} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (alreadyApproved) {
    return (
      <SafeAreaView style={m.safe}>
        <SuccessScreen onDone={() => navigate("Home")} />
      </SafeAreaView>
    );
  }

  const stepMeta = STEPS[step - 1];

  return (
    <SafeAreaView style={m.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={m.header}>
          <Pressable
            style={m.backBtn}
            onPress={() => {
              if (step === 1) { navigate("Profile"); return; }
              setStep((s) => s - 1);
            }}
          >
            <Text style={m.backArrow}>{"<"}</Text>
          </Pressable>
          <View style={m.headerCenter}>
            <Text style={m.headerTitle}>{stepMeta.label}</Text>
            <Text style={m.headerSub}>Etape {step} sur {STEPS.length}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <StepDots current={step} total={STEPS.length} />

        {error && (
          <View style={m.errorBanner}>
            <Text style={m.errorText}>{error}</Text>
            {step === 1 && (
              <View style={m.retryRow}>
                <Pressable style={m.retryBtn} onPress={retryStep1}>
                  <Text style={m.retryBtnText}>Reessayer la verification</Text>
                </Pressable>
                <Pressable style={m.retryBtnGhost} onPress={fullRetry}>
                  <Text style={m.retryBtnGhostText}>Recommencer</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={m.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <Step1 data={data} onChange={updateData} loading={loading} />}
          {step === 2 && (
            <Step2
              onSuccess={() => setStep(3)}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
            />
          )}
          {step === 3 && (
            <Step3
              onSuccess={() => setKycSuccess(true)}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const m = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: G1, alignItems: "center", justifyContent: "center" },
  backArrow: { fontSize: 18, color: G7 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: G9 },
  headerSub: { fontSize: 11, color: G5, marginTop: 1 },
  errorBanner: { marginHorizontal: 16, marginBottom: 6, backgroundColor: "#fee2e2", borderRadius: 10, padding: 12, gap: 8 },
  errorText: { color: RE, fontSize: 13 },
  retryRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  retryBtn: { flex: 1, backgroundColor: RE, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  retryBtnText: { color: WH, fontSize: 12, fontWeight: "800" },
  retryBtnGhost: { borderWidth: 1, borderColor: RE, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" },
  retryBtnGhostText: { color: RE, fontSize: 12, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
});

export default KycVerification;
