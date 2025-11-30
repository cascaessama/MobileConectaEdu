// CadastrarPost.tsx
import React, { useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

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

const BASE_URL = "https://conectaedu.onrender.com"; // {{url}}
const TOKEN_KEY = "@conectaedu/token";

/** ====== Função local de criação ====== */
async function createPostLocal({
  titulo,
  conteudo,
  autor,
}: {
  titulo: string;
  conteudo: string;
  autor?: string;
}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  // Body alinhado ao exemplo do Postman:
  // { "titulo", "conteudo", "dataCriacao", "autor" }
  const payload: any = {
    titulo,
    conteudo,
    dataCriacao: new Date().toISOString(),
  };
  if (autor) {
    payload.autor = autor;
  }

  const url = `${BASE_URL}/portal`; // rota createPosts: {{url}}/portal
  console.log("POST", url, payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      // auth bearer {{token}}
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg =
      Array.isArray(data?.message)
        ? data.message.join("\n")
        : typeof data?.message === "string"
        ? data.message
        : text || `Falha ao cadastrar (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export default function CadastrarPost() {
  const navigation = useNavigation<any>();

  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [autor, setAutor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!titulo.trim() || !conteudo.trim() || !autor.trim()) {
      setError("Preencha título, conteúdo e nome do autor.");
      return;
    }

    try {
      setSubmitting(true);
      await createPostLocal({
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        autor: autor.trim(),
      });
      Alert.alert("Sucesso", "Post cadastrado com sucesso!");
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? "Falha ao cadastrar o post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Cadastrar Post</Text>
          <View style={styles.appbarAccent} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Preencha os campos abaixo e toque em “Salvar”.
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
            placeholder="Nome autor…"
            placeholderTextColor={PALETTE.inkMuted}
            value={autor}
            onChangeText={setAutor}
          />

          <Text style={styles.label}>Conteúdo</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Escreva o conteúdo do post…"
            placeholderTextColor={PALETTE.inkMuted}
            value={conteudo}
            onChangeText={setConteudo}
            multiline
            textAlignVertical="top"
          />

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.btn,
                styles.btnPrimary,
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Salvar</Text>
              )}
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: PALETTE.ink,
    marginBottom: 4,
  },
  subtitle: { color: PALETTE.inkMuted, marginBottom: 16 },
  label: {
    fontWeight: "600",
    color: "#2b2b2b",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: PALETTE.ink,
  },
  textarea: { height: 160, lineHeight: 22, marginTop: 2 },
  errorMsg: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFE9E9",
    color: "#A61B1B",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnGhost: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  btnGhostText: { color: PALETTE.ink },
  btnPrimary: { backgroundColor: PALETTE.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});