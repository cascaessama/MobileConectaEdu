// ExcluirPost.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

type RootStackParamList = {
  ExcluirPost: { id: string; titulo?: string };
};

type ExcluirRouteProp = RouteProp<RootStackParamList, "ExcluirPost">;

/** ====== Função local de exclusão ======
 *  Usa o token salvo e faz o DELETE direto na API.
 */
async function deletePostLocal(id: string) {
  const BASE_URL = "https://conectaedu.onrender.com"; // ajuste se necessário
  const token = await AsyncStorage.getItem("@conectaedu/token");

  const res = await fetch(`${BASE_URL}/portal/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Falha ao excluir o post (HTTP ${res.status})`);
  }

  return true;
}

export default function ExcluirPost() {
  const navigation = useNavigation<any>();
  const route = useRoute<ExcluirRouteProp>();
  const { id, titulo } = route.params || ({} as any);

  const [loading, setLoading] = useState(false);

  const handleExcluir = async () => {
    if (!id) {
      Alert.alert("Erro", "ID do post não informado.");
      return;
    }

    try {
      setLoading(true);
      await deletePostLocal(id);
      Alert.alert("Sucesso", "Post excluído com sucesso!");
      navigation.goBack(); // volta para Professor.tsx (que recarrega a lista)
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao excluir o post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Excluir post</Text>
        <Text style={styles.subtitle}>
          Tem certeza que deseja excluir{" "}
          <Text style={styles.bold}>"{titulo || "Sem título"}"</Text>?
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.btnCancel]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.btnText, styles.btnCancelText]}>Cancelar</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, styles.btnDanger]}
            onPress={handleExcluir}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Excluir</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: PALETTE.card,
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  title: {
    fontSize: 20,
    color: PALETTE.ink,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: PALETTE.inkMuted,
    fontSize: 15,
    marginBottom: 16,
  },
  bold: { color: PALETTE.ink, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  btnCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  btnCancelText: { color: PALETTE.ink },
  btnDanger: { backgroundColor: PALETTE.danger },
  btnText: { color: "#fff", fontWeight: "700" },
});
