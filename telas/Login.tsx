import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

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

/** ====== CHAVES DO STORAGE ====== */
const TOKEN_KEY = "@conectaedu/token";
const USER_TYPE_KEY = "@conectaedu/userType";

/** ====== TIPOS ====== */
type LoginResponse = {
  access_token?: string;
  token?: string;
  accessToken?: string;
  jwt?: string;
  message?: string;
  [k: string]: any;
};

type TokenPayload = {
  sub?: string;
  username?: string;
  userType?: "admin" | "teacher" | "student";
  iat?: number;
  exp?: number;
};

/** ====== FUNÇÕES AUXILIARES ====== */
async function saveSession(token: string, userType: string) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_TYPE_KEY, userType],
  ]);
}

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function getUserType() {
  return AsyncStorage.getItem(USER_TYPE_KEY);
}

function extractToken(data: LoginResponse, authHeader?: string | null) {
  const bodyToken =
    data?.access_token ?? data?.token ?? data?.accessToken ?? data?.jwt;
  if (bodyToken) return bodyToken;
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^Bearer\s+/i, "");
  }
  return undefined;
}

/** ====== COMPONENTE LOGIN ====== */
export default function Login({ navigation }: any) {
  const route = useRoute<any>();
  const fromMenu = !!route.params?.fromMenu;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** ====== Verifica sessão existente ====== */
  useEffect(() => {
    (async () => {
      try {
        const [token, type] = await Promise.all([getToken(), getUserType()]);
        if (token && !fromMenu) {
          const userType = type || "student";
          navigation.replace(
            userType === "admin" || userType === "teacher"
              ? "Admin"
              : "ExibePosts"
          );
          return;
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [navigation, fromMenu]);

  /** ====== Função principal de login ====== */
  async function handleSubmit() {
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("Preencha usuário e senha.");
      return;
    }

    setSubmitting(true);
    try {
      const url = "https://conectaedu.onrender.com/users/login";
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      }).finally(() => clearTimeout(id));

      const raw = await res.text();
      let data: LoginResponse = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok) {
        let msg = data?.message || `Falha na autenticação (HTTP ${res.status})`;
        if (/invalid credentials/i.test(msg)) {
          msg = "Usuário ou senha incorretos.";
        }
        throw new Error(msg);
      }

      const authHeader =
        res.headers.get("authorization") || res.headers.get("Authorization");
      const token = extractToken(data, authHeader);
      if (!token) {
        throw new Error("Resposta sem token de acesso.");
      }

      const decoded = jwtDecode<TokenPayload>(token);
      const userType =
        decoded.userType === "admin" || decoded.userType === "teacher"
          ? decoded.userType
          : "student";

      await saveSession(token, userType);

      navigation.replace(
        userType === "admin" || userType === "teacher"
          ? "Admin"
          : "ExibePosts"
      );
    } catch (err: any) {
      let msg =
        err?.name === "AbortError"
          ? "Tempo de conexão esgotado."
          : err?.message || "Erro de rede ao autenticar.";
      if (/invalid credentials/i.test(msg)) {
        msg = "Usuário ou senha incorretos.";
      }
      setError(msg);
      Alert.alert("Erro", msg);
    } finally {
      setSubmitting(false);
    }
  }

  /** ====== Tela de inicialização ====== */
  if (booting) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
        <Text style={{ color: PALETTE.inkMuted, marginTop: 8 }}>
          Verificando sessão…
        </Text>
      </View>
    );
  }

  /** ====== Interface ====== */
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>ConectaEdu</Text>
        <View style={styles.titleAccent} />
        <Text style={styles.titleSubtitle}>Aprender. Conectar. Evoluir.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Acesse sua conta</Text>

        <Text style={styles.label}>Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu usuário"
          placeholderTextColor={PALETTE.inkMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor={PALETTE.inkMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        {error ? (
          <Text
            style={[
              styles.errorMsg,
              (/invalid credentials/i.test(error) || /usuário ou senha incorretos\./i.test(error)) && {
                fontWeight: "700",
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        {/* Botão voltar removido conforme solicitado */}
      </View>
    </KeyboardAvoidingView>
  );
}

/** ====== ESTILOS ====== */
const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
    alignItems: "center",
    justifyContent: "center",
  },
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { width: 72, height: 72, marginBottom: 10 },
  title: {
    fontSize: 30,
    color: PALETTE.primaryDark,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  titleAccent: {
    width: 120,
    height: 4,
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    marginTop: 6,
    marginBottom: 6,
  },
  titleSubtitle: {
    fontSize: 12,
    color: PALETTE.inkMuted,
    fontWeight: "700",
  },
  card: {
    backgroundColor: PALETTE.card,
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: PALETTE.border,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },
  subtitle: {
    fontSize: 18,
    color: PALETTE.ink,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  label: { fontWeight: "600", color: "#2b2b2b", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    color: PALETTE.ink,
    backgroundColor: "#fff",
  },
  errorMsg: {
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFE9E9",
    color: "#A61B1B",
    fontSize: 13,
  },
  button: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  
});
