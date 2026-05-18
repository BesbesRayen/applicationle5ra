import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MobileLayout from "@/components/MobileLayout";
import { createSupportTicket, getSupportFaq, getSupportTickets, SupportFaq, SupportTicket } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const Support = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [faq, setFaq] = useState<SupportFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const [faqData, ticketData] = await Promise.all([getSupportFaq(), getSupportTickets(user.userId)]);
      setFaq(faqData);
      setTickets(ticketData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger support.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitQuestion = async () => {
    if (!user) {
      navigate("Login");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorMessage("Entrez un sujet et votre question.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await createSupportTicket(user.userId, { subject: subject.trim(), message: message.trim() });
      setSubject("");
      setMessage("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec d'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Profile")} style={styles.backButton}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>
          <Text style={styles.title}>Aide & Support</Text>
        </View>
        <Text style={styles.subtitle}>Posez vos questions et consultez les reponses.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nouvelle question</Text>
          <TextInput value={subject} onChangeText={setSubject} style={styles.input} placeholder="Sujet" placeholderTextColor="#6b6b80" />
          <TextInput
            value={message}
            onChangeText={setMessage}
            style={[styles.input, styles.textArea]}
            placeholder="Decrivez votre probleme..."
            placeholderTextColor="#6b6b80"
            multiline
            textAlignVertical="top"
          />
          <Pressable style={[styles.primaryButton, submitting && styles.disabled]} onPress={submitQuestion} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? "Envoi..." : "Envoyer ma question"}</Text>
          </Pressable>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {loading && <Text style={styles.infoText}>Chargement...</Text>}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mes questions</Text>
          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketRow}>
              <Text style={styles.ticketTitle}>{ticket.subject}</Text>
              <Text style={styles.ticketMessage}>{ticket.message || "(Aucun detail)"}</Text>
              <Text style={styles.ticketResponse}>{ticket.response || "Reponse en attente"}</Text>
            </View>
          ))}
          {!loading && tickets.length === 0 && <Text style={styles.infoText}>Aucune question envoyee.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {faq.map((item) => (
            <View key={item.id} style={styles.faqRow}>
              <Text style={styles.faqQ}>{item.question}</Text>
              <Text style={styles.faqA}>{item.answer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  backText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, flex: 1 },
  subtitle: { fontSize: 13, color: colors.gray500 },
  card: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: colors.gray900 },
  input: { borderWidth: 1, borderColor: colors.gray300, borderRadius: radii.lg, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.gray50, color: colors.gray900 },
  textArea: { minHeight: 96 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radii.lg, alignItems: "center", paddingVertical: 11 },
  primaryText: { color: colors.white, fontWeight: "700" },
  disabled: { opacity: 0.7 },
  ticketRow: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, padding: 10, gap: 4 },
  ticketTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  ticketMessage: { fontSize: 12, color: colors.gray700 },
  ticketResponse: { fontSize: 11, color: colors.accent, fontWeight: "600" },
  faqRow: { borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 8, gap: 4 },
  faqQ: { fontSize: 12, fontWeight: "700", color: colors.gray900 },
  faqA: { fontSize: 12, color: colors.gray600 },
  infoText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error },
});

export default Support;
