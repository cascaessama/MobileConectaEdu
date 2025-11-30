// EditarUsuario.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

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

const TOKEN_KEY = "@conectaedu/token";
const API_URL = "https://conectaedu.onrender.com";

type User = {
  _id?: string;
  id?: string;
  username: string;
  userType: "admin" | "teacher" | "student" | string;
};

export default function EditarUsuario() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const original: User | undefined = route.params?.user;

  const userId = useMemo(
    () => original?._id || original?.id || "",
    [original]
  );

  const [username, setUsername] = useState(original?.username ?? "");
  const [userType, setUserType] = useState<
    "admin" | "teacher" | "student" | string
  >(
    original?.userType === "admin" ||
      original?.userType === "teacher" ||
      original?.userType === "student"
      ? original.userType
      : "student"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState(""); // nova senha opcional

  async function handleSave() {
    setError(null);

    if (!userId) {
      Alert.alert("Erro", "Usuário sem identificador.");
      return;
    }
    if (!username.trim()) {
      setError("Informe o nome de usuário.");
      return;
    }
    if (!["admin", "teacher", "student"].includes(userType)) {
      setError("Tipo de usuário inválido.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        return;
      }

      const payload: any = { username: username.trim(), userType };
      if (password.trim()) payload.password = password.trim();

      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok) {
        const msg =
          data?.message || raw || `Falha ao atualizar (HTTP ${res.status})`;
        throw new Error(msg);
      }

      Alert.alert("Sucesso", "Usuário atualizado com sucesso!");
      // volta para a lista, que já recarrega no focus
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao atualizar usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Editar Usuário</Text>
          <View style={styles.appbarAccent} />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.card}>

          <Text style={styles.label}>Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="ex.: joao.silva"
            placeholderTextColor={PALETTE.inkMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Nova senha (Alteração opcional)"
            placeholderTextColor={PALETTE.inkMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Tipo de Usuário</Text>
          <View style={styles.typeRow}>
            {(["teacher", "student"] as const).map((t) => {
              const active = userType === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.typeChip,
                    active && styles.typeChipActive,
                  ]}
                  onPress={() => setUserType(t)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      active && styles.typeChipTextActive,
                    ]}
                  >
                    {t === "teacher" ? "Professor" : "Aluno"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={[styles.btnText, styles.btnGhostText]}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
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
      </View>
    </SafeAreaView>
  );
}

/** ====== ESTILOS ====== */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
  },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.bgLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  backBtn: {
    // removido para padronizar com EditarPost (sem botão de voltar)
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

  container: {
    padding: 16,
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },

  label: { fontWeight: "600", color: "#2b2b2b", marginBottom: 6, marginTop: 10 },


  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: PALETTE.ink,
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "#fff",
  },
  typeChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  typeChipText: {
    color: PALETTE.ink,
    fontWeight: "700",
    fontSize: 13,
  },
  typeChipTextActive: {
    color: "#fff",
  },

  error: {
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
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: PALETTE.border },
  btnGhostText: { color: PALETTE.ink },
  btnPrimary: { backgroundColor: PALETTE.primary },
  btnText: { color: "#fff", fontWeight: "700" },
});
