// CadastrarUsuario.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
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

type UserType = "teacher" | "student";

export default function CadastrarUsuario() {
  const navigation = useNavigation<any>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!username.trim() || !password.trim() || !userType) {
      setError("Preencha todos os campos e selecione o tipo de usuário.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      const response = await fetch(
        "https://conectaedu.onrender.com/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            userType,
          }),
        }
      );

      if (!response.ok) {
        let msg = "Falha ao cadastrar usuário.";
        try {
          const data = await response.json();
          if (data?.message) msg = data.message;
        } catch {
          const text = await response.text();
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      Alert.alert("Sucesso", "Usuário cadastrado com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const renderTipoBtn = (tipo: UserType, label: string, icon: "school" | "person") => {
    const active = userType === tipo;
    return (
      <Pressable
        style={[
          styles.tipoBtn,
          active && styles.tipoBtnActive,
        ]}
        onPress={() => setUserType(tipo)}
      >
        <MaterialIcons
          name={icon}
          size={18}
          color={active ? "#fff" : PALETTE.primaryDark}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.tipoBtnText,
            active && styles.tipoBtnTextActive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.appbar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={PALETTE.primaryDark}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Cadastrar Usuário</Text>
          <View style={styles.appbarAccent} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          Preencha os dados abaixo para criar um novo usuário.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="ex.: professor01"
            placeholderTextColor={PALETTE.inkMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Digite a senha"
            placeholderTextColor={PALETTE.inkMuted}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de usuário</Text>
          <View style={styles.tipoRow}>
            {renderTipoBtn("teacher", "Professor", "school")}
            {renderTipoBtn("student", "Aluno", "person")}
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar usuário</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
    marginRight: 8,
    padding: 4,
    borderRadius: 999,
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

  content: {
    flex: 1,
    padding: 16,
  },
  hint: {
    fontSize: 13,
    color: PALETTE.inkMuted,
    marginBottom: 16,
  },

  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: PALETTE.ink,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: PALETTE.ink,
  },

  tipoRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipoBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    backgroundColor: "#fff",
  },
  tipoBtnActive: {
    backgroundColor: PALETTE.primary,
  },
  tipoBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: PALETTE.primaryDark,
  },
  tipoBtnTextActive: {
    color: "#fff",
  },

  saveBtn: {
    marginTop: 16,
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  error: {
    marginTop: 4,
    color: PALETTE.danger,
    fontWeight: "700",
  },
});
