// Editar.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** ====== PALETA ====== */
const PALETTE = {
  primary: "#4A90E2",
  primaryDark: "#134E9B",
  bgLight: "#EAF2FF",
  bgScreen: "#F5F7FB",
  border: "#C9E0FF",
  ink: "#1E293B",
  inkMuted: "#64748B",
  card: "#FFFFFF",
  danger: "#C0392B",
};

const BASE_URL = "https://conectaedu.onrender.com"; // ajuste se necessário
const TOKEN_KEY = "@conectaedu/token";

type Post = {
  _id?: string;
  id?: string;
  titulo?: string;
  conteudo?: string;
  autor?: string;
  dataCriacao?: string;
};

type RootStackParamList = {
  EditarPost: { post: Post };
};

type EditRoute = RouteProp<RootStackParamList, "EditarPost">;

async function updatePostLocal(id: string, body: { titulo: string; conteudo: string; autor?: string }) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/portal/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const txt = await res.text().catch(() => "");
  if (!res.ok) throw new Error(txt || `Falha ao atualizar (HTTP ${res.status})`);
  try { return txt ? JSON.parse(txt) : {}; } catch { return {}; }
}

export default function Editar() {
  const navigation = useNavigation<any>();
  const route = useRoute<EditRoute>();
  const original = route.params?.post ?? {};

  const postId = useMemo(() => original._id || original.id || "", [original]);

  const [titulo, setTitulo] = useState(original.titulo || "");
  const [conteudo, setConteudo] = useState(original.conteudo || "");
  const [autor, setAutor] = useState(original.autor || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!postId) {
      setError("ID do post não informado.");
      return;
    }
    if (!titulo.trim() || !conteudo.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      await updatePostLocal(postId, { titulo: titulo.trim(), conteudo: conteudo.trim(), autor: autor.trim() || undefined });
      Alert.alert("Sucesso", "Post atualizado com sucesso!");
      navigation.goBack(); // Professor recarrega ao focar
    } catch (e: any) {
      setError(e?.message ?? "Falha ao atualizar o post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Editar Post</Text>
          <View style={styles.appbarAccent} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Atualize os campos e toque em “Salvar”.
          </Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Um título bonito…"
            placeholderTextColor={PALETTE.inkMuted}
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Autor</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do autor (opcional)"
            placeholderTextColor={PALETTE.inkMuted}
            value={autor}
            onChangeText={setAutor}
          />

          <Text style={styles.label}>Conteúdo</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Edite o conteúdo do post…"
            placeholderTextColor={PALETTE.inkMuted}
            value={conteudo}
            onChangeText={setConteudo}
            multiline
            textAlignVertical="top"
          />

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => navigation.goBack()} disabled={submitting}>
              <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Salvar</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bgScreen },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.bgLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  appbarTitle: {
    color: PALETTE.primaryDark,
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  appbarAccent: {
    width: 140,
    height: 3,
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    marginTop: 4,
  },
  container: { padding: 16 },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: PALETTE.ink, marginBottom: 4 },
  subtitle: { color: PALETTE.inkMuted, marginBottom: 16 },
  label: { fontWeight: "600", color: "#2b2b2b", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: PALETTE.border, backgroundColor: "#fff",
    borderRadius: 10, padding: 12, fontSize: 16, color: PALETTE.ink,
  },
  textarea: { height: 160, lineHeight: 22, marginTop: 2 },
  errorMsg: {
    marginTop: 12, padding: 8, borderRadius: 8, backgroundColor: "#FFE9E9", color: "#A61B1B", fontSize: 13,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: PALETTE.border },
  btnGhostText: { color: PALETTE.ink },
  btnPrimary: { backgroundColor: PALETTE.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});
