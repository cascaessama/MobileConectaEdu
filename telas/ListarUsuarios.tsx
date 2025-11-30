// ListarUsuarios.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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

export default function ListarUsuarios() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const keyExtractor = (u: User) => u._id || u.id || u.username;

  const fetchUsers = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setItems([]);
        setError("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }
      // Busca paginada: tenta agregar todas as páginas enquanto houver resultados
      const aggregated: User[] = [];
      let page = 1;
      const limit = 100; // ajuste se necessário conforme API
      while (true) {
        const url = `${API_URL}/users?page=${page}&limit=${limit}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          let msg = "Falha ao buscar usuários.";
          try {
            const data = await response.json();
            if (data?.message) msg = data.message;
          } catch {
            const text = await response.text();
            if (text) msg = text;
          }
          throw new Error(msg);
        }

        let pageData: any = [];
        try {
          pageData = await response.json();
        } catch {
          pageData = [];
        }

        const list: User[] = Array.isArray(pageData?.items)
          ? pageData.items
          : Array.isArray(pageData)
          ? pageData
          : [];

        aggregated.push(...list);

        // Verifica fim de paginação: sem itens ou menor que limit
        if (list.length < limit) break;
        page += 1;
        // Proteção para evitar loop infinito
        if (page > 100) break;
      }

      setItems(aggregated);
      if (!aggregated.length) setError("Nenhum usuário encontrado.");
    } catch (e: any) {
      setItems([]);
      setError(e?.message ?? "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja realmente encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(TOKEN_KEY);
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  /** ====== Ações ====== */
  const handleEdit = (user: User) => {
    navigation.navigate("EditarUsuario", { user });
  };

  const handleDelete = async (user: User) => {
    const id = user._id || user.id;
    if (!id) {
      Alert.alert("Erro", "Usuário sem identificador.");
      return;
    }

    Alert.alert(
      "Excluir usuário",
      `Deseja realmente excluir o usuário "${user.username}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem(TOKEN_KEY);
              if (!token) {
                Alert.alert("Sessão expirada", "Faça login novamente.");
                return;
              }

              const res = await fetch(`${API_URL}/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                let msg = "Falha ao excluir usuário.";
                try {
                  const data = await res.json();
                  if (data?.message) msg = data.message;
                } catch {
                  const t = await res.text();
                  if (t) msg = t;
                }
                throw new Error(msg);
              }

              // Remove localmente
              setItems((prev) => prev.filter((u) => (u._id || u.id) !== id));
            } catch (e: any) {
              Alert.alert("Erro", e?.message ?? "Erro ao excluir usuário.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: User }) => {
    const labelTipo =
      item.userType === "admin"
        ? "Administrador"
        : item.userType === "teacher"
        ? "Professor"
        : item.userType === "student"
        ? "Aluno"
        : item.userType;

    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userType}>{labelTipo}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} onPress={() => handleEdit(item)}>
            <MaterialIcons name="edit" size={22} color={PALETTE.primaryDark} />
          </Pressable>

          <Pressable style={styles.iconBtn} onPress={() => handleDelete(item)}>
            <MaterialIcons name="delete" size={22} color={PALETTE.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      const name = u.username?.toLowerCase() ?? "";
      const tipo = u.userType?.toLowerCase() ?? "";
      return name.includes(q) || tipo.includes(q);
    });
  }, [items, search]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.appbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Usuários</Text>
          <View style={styles.appbarAccent} />
        </View>
        {/* Botão de sair */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color={PALETTE.danger} />
        </Pressable>
      </View>

      <View style={styles.tabMenu}>
        <Pressable style={styles.tabBtn} onPress={() => navigation.navigate("Admin")}>
          <Text style={styles.tabText}>Posts</Text>
        </Pressable>

        <Pressable style={[styles.tabBtn, styles.tabBtnActive]} onPress={() => {}}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Usuários</Text>
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
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nenhum usuário cadastrado</Text>
                <Text style={styles.emptySubtitle}>
                  Toque em “+” para cadastrar um novo.
                </Text>
              </View>
            )}
          />
        </>
      )}

      {/* FAB para cadastrar usuário */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("CadastrarUsuario")}
      >
        <MaterialIcons name="person-add" size={28} color="#fff" />
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
  backBtn: {
    marginRight: 8,
    padding: 4,
    borderRadius: 999,
  },
  logoutBtn: {
    marginLeft: "auto",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  appbarTitle: {
    color: PALETTE.primaryDark,
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  appbarAccent: {
    width: 120,
    height: 3,
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    marginTop: 4,
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

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  separator: { height: 8 },

  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    color: PALETTE.ink,
  },
  userType: {
    fontSize: 13,
    color: PALETTE.inkMuted,
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  iconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: PALETTE.border,
  },

  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 8, color: PALETTE.inkMuted },
  error: { margin: 12, color: PALETTE.danger, fontWeight: "700" },
  empty: { alignItems: "center" },
  emptyTitle: { fontWeight: "800", fontSize: 16, color: PALETTE.ink },
  emptySubtitle: { color: PALETTE.inkMuted, marginTop: 2 },

  fab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
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
