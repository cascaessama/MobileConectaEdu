// Admin.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Post } from "../modelo/Post";
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
const API_URL = "https://conectaedu.onrender.com"; // {{url}}

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

export default function Admin() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log("🟦 [Admin] TOKEN:", token?.slice(0, 24) + "...");
      if (!token) {
        setItems([]);
        setError("Sessão expirada. Faça login novamente.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const url = `${API_URL}/portal`;
      console.log("🔹 [Admin] GET", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // IMPORTANTE
        },
      });

      const raw = await res.text();
      console.log("🟢 [Admin] /portal status:", res.status, "body:", raw);

      if (res.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setItems([]);
        setError("Sessão expirada. Faça login novamente.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      if (!res.ok) {
        let msg = "Falha ao buscar posts.";
        try {
          const j = JSON.parse(raw);
          if (j?.message) msg = j.message;
        } catch {
          if (raw) msg = raw;
        }
        throw new Error(msg);
      }

      let data: any = [];
      try {
        data = raw ? JSON.parse(raw) : [];
      } catch {
        data = [];
      }

      const arr: Post[] = Array.isArray(data) ? data : [];
      setItems(arr);
      if (!arr.length) setError("Nenhum post encontrado.");
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

  // Recarrega sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Logout
  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente sair da área do professor?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(TOKEN_KEY);
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const id = item._id || item.id || "";
      return (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("LerPost", { post: item })}
        >
          {/* Cabeçalho do card */}
          <View style={styles.cardHeader}>
            {/* Ações (editar/excluir) */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => navigation.navigate("EditarPost", { post: item })}
                style={styles.iconBtn}
              >
                <MaterialIcons
                  name="edit"
                  size={22}
                  color={PALETTE.primaryDark}
                />
              </Pressable>

              <Pressable
                onPress={() =>
                  navigation.navigate("ExcluirPost", {
                    id,
                    titulo: item.titulo || "Sem título",
                  })
                }
                style={styles.iconBtn}
              >
                <MaterialIcons
                  name="delete"
                  size={22}
                  color={PALETTE.danger}
                />
              </Pressable>
            </View>
          </View>

          {/* Título e meta */}
          <Text style={styles.title}>{item.titulo || "Sem título"}</Text>
          <Text style={styles.meta}>
            {item.autor ? `${item.autor}` : "Autor desconhecido"}
            {item.dataCriacao ? ` • ${formatDate(item.dataCriacao)}` : ""}
          </Text>

          {/* Conteúdo (preview) */}
          <Text style={styles.content} numberOfLines={4}>
            {item.conteudo?.trim() || "Sem conteúdo."}
          </Text>
        </Pressable>
      );
    },
    [navigation]
  );

  const keyExtractor = useCallback(
    (it: Post) => it._id || it.id || Math.random().toString(),
    []
  );

  const Empty = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum post cadastrado</Text>
        <Text style={styles.emptySubtitle}>
          Toque em “+” para cadastrar um novo.
        </Text>
      </View>
    ),
    []
  );

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

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Área do Professor</Text>
          <View style={styles.appbarAccent} />
        </View>

        {/* Botão de sair */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={PALETTE.danger} />
        </Pressable>
      </View>

      {/* Menu interno: Posts / Usuários */}
      <View style={styles.tabMenu}>
        <Pressable style={[styles.tabBtn, styles.tabBtnActive]} onPress={() => {}}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Posts</Text>
        </Pressable>

        <Pressable
          style={styles.tabBtn}
          onPress={() => navigation.navigate("ListarUsuarios")}
        >
          <Text style={styles.tabText}>Usuários</Text>
        </Pressable>
      </View>

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

      {/* Conteúdo (Posts) */}
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

      {/* FAB Cadastrar Post */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("CadastrarPost")}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
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
  logoutBtn: {
    marginLeft: "auto",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  /* Menu de abas */
  tabMenu: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "#fff",
  },
  tabBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  tabText: {
    color: PALETTE.ink,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },

  /* Busca */
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

  /* Lista de posts */
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: PALETTE.ink,
    marginTop: 2,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: PALETTE.inkMuted,
    marginBottom: 10,
  },
  content: { fontSize: 14, lineHeight: 20, color: PALETTE.ink },

  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 8, color: PALETTE.inkMuted },
  error: { margin: 12, color: PALETTE.danger, fontWeight: "700" },
  empty: { alignItems: "center" },
  emptyTitle: { fontWeight: "800", fontSize: 16, color: PALETTE.ink },
  emptySubtitle: { color: PALETTE.inkMuted, marginTop: 2 },

  /* FAB */
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
