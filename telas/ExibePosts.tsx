// ExibePosts.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import type { Post } from "../modelo/Post";

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

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ExibePosts() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  /** ====== Função de logout ====== */
  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(TOKEN_KEY);
          navigation.replace("Login", { fromMenu: true });
        },
      },
    ]);
  };

  /** ====== Carregar posts ====== */
  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setItems([]);
        setError("Você precisa fazer login para visualizar os posts.");
        setLoading(false);
        navigation.navigate("Login", { fromMenu: true });
        return;
      }

      const url = `${API_URL}/portal`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawText = await response.text();

      if (response.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setItems([]);
        setError("Sessão expirada. Faça login novamente.");
        setLoading(false);
        navigation.navigate("Login", { fromMenu: true });
        return;
      }

      if (!response.ok) {
        let msg = "Falha ao buscar posts.";
        try {
          const data = JSON.parse(rawText);
          if (data?.message) msg = data.message;
        } catch {
          if (rawText) msg = rawText;
        }
        throw new Error(msg);
      }

      let data: any = [];
      try {
        data = JSON.parse(rawText);
      } catch {
        data = [];
      }

      const arr: Post[] = Array.isArray(data) ? data : [];
      setItems(arr);

      if (!arr.length) {
        setError("Nenhum post encontrado.");
      }
    } catch (e: any) {
      setItems([]);
      setError(e?.message ?? "Falha ao buscar posts.");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((post) => {
      const titulo = post.titulo?.toLowerCase() ?? "";
      const conteudo = post.conteudo?.toLowerCase() ?? "";
      const autor = post.autor?.toLowerCase() ?? "";
      return titulo.includes(q) || conteudo.includes(q) || autor.includes(q);
    });
  }, [items, search]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const key = item._id || item.id || "";
      const isOpen = !!expanded[key];
      return (
        <Pressable
          onPress={() => navigation.navigate("LerPost", { post: item })}
          style={styles.card}
        >
          {/* Removido badge 'ConectaEdu' conforme solicitado */}
          <Text style={styles.title}>{item.titulo || "Sem título"}</Text>
          <Text style={styles.meta}>
            {item.autor ? `${item.autor}` : "Autor desconhecido"}
            {item.dataCriacao ? ` • ${formatDate(item.dataCriacao)}` : ""}
          </Text>
          <Text style={styles.content} numberOfLines={isOpen ? 0 : 4}>
            {item.conteudo?.trim() || "Sem conteúdo."}
          </Text>
        </Pressable>
      );
    },
    [expanded, navigation]
  );

  const keyExtractor = useCallback(
    (it: Post) => it._id || it.id || Math.random().toString(),
    []
  );

  const Empty = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
        <Text style={styles.emptySubtitle}>Puxe para atualizar.</Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar no padrão administrativo */}
      <View style={styles.appbar}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
          }}
          style={styles.logo}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Área do Aluno</Text>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={PALETTE.danger} />
        </Pressable>
      </View>

      {/* Menu removido conforme solicitação */}

      {/* Campo de busca */}
      <View style={styles.searchWrapper}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por palavra-chave..."
          placeholderTextColor={PALETTE.inkMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* Conteúdo */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.loadingText}>Carregando…</Text>
        </View>
      ) : (
        <>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={[
              styles.listContent,
              filteredItems.length === 0 && { flex: 1, justifyContent: "center" },
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={Empty}
          />
        </>
      )}
    </SafeAreaView>
  );
}

/** ====== ESTILOS ====== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bgScreen },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: PALETTE.bgLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  logo: { width: 28, height: 28, marginRight: 8 },
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
  logoutBtn: { padding: 6, marginLeft: "auto" },

  menu: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
    backgroundColor: "#fff",
  },
  menuBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "#fff",
  },
  menuBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  menuText: { color: PALETTE.ink, fontWeight: "700" },
  menuTextActive: { color: "#fff" },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  searchInput: {
    backgroundColor: PALETTE.bgScreen,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    fontSize: 14,
    color: PALETTE.ink,
  },

  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 8, color: PALETTE.inkMuted },
  error: { margin: 12, color: PALETTE.danger, fontWeight: "700" },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  separator: { height: 12 },

  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: PALETTE.ink,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: PALETTE.inkMuted,
    marginBottom: 10,
  },
  content: { fontSize: 14, lineHeight: 20, color: PALETTE.ink },
  more: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: PALETTE.primaryDark,
    alignSelf: "flex-start",
  },
  empty: { alignItems: "center" },
  emptyTitle: { fontWeight: "800", fontSize: 16, color: PALETTE.ink },
  emptySubtitle: { color: PALETTE.inkMuted, marginTop: 2 },
});
