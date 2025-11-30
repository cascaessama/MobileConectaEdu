import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";

type Post = {
  _id?: string;
  id?: string;
  titulo?: string;
  conteudo?: string;
  dataCriacao?: string;
  autor?: string;
};

/** ====== PALETA (cores baseadas no site ConectaEdu) ====== */
const PALETTE = {
  primary: "#4A90E2",      // azul principal (semelhante ao botão e links)
  primaryDark: "#134E9B",  // azul escuro do texto "ConectaEdu"
  bgLight: "#EAF2FF",      // fundo da barra superior
  bgScreen: "#F5F7FB",     // fundo geral do app
  border: "#C9E0FF",       // borda sutil
  ink: "#1E293B",          // texto principal
  inkMuted: "#64748B",     // texto secundário
  card: "#FFFFFF",
  danger: "#C0392B",
};

const normalize = (j: any): Post[] => {
  const arr: any[] =
    (Array.isArray(j?.portal) && j.portal) ||
    (Array.isArray(j?.posts) && j.posts) ||
    (Array.isArray(j) ? j : []);
  return arr.map((p: any) => ({
    _id: p?._id ?? p?.id ?? String(Math.random()),
    id: p?.id ?? p?._id,
    titulo: p?.titulo ?? p?.title ?? "",
    conteudo: p?.conteudo ?? p?.content ?? "",
    dataCriacao: p?.dataCriacao ?? p?.createdAt ?? "",
    autor: p?.autor ?? p?.author ?? "",
  }));
};

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

export default function Posts() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("https://conectaedu.onrender.com/portal", {
        headers: { "Cache-Control": "no-cache" },
      });
      const text = await r.text();
      let j: any;
      try {
        j = JSON.parse(text);
      } catch {
        throw new Error("Resposta não é JSON (o backend pode estar iniciando).");
      }
      const arr = normalize(j);
      setItems(arr);
      if (!arr.length) setError("Nenhum post encontrado.");
    } catch (e: any) {
      setItems([]);
      setError(e?.message ?? "Falha ao buscar posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const key = item._id || item.id || "";
      const isOpen = !!expanded[key];
      return (
        <Pressable onPress={() => toggleExpand(key)} style={styles.card}>
          {/* Chip do app */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ConectaEdu</Text>
          </View>

          <Text style={styles.title}>{item.titulo || "Sem título"}</Text>

          <Text style={styles.meta}>
            {item.autor ? `${item.autor}` : "Autor desconhecido"}
            {item.dataCriacao ? ` • ${formatDate(item.dataCriacao)}` : ""}
          </Text>

          <Text style={styles.content} numberOfLines={isOpen ? 0 : 4}>
            {item.conteudo?.trim() || "Sem conteúdo."}
          </Text>

          <Text style={styles.more}>
            {isOpen ? "Ver menos ▲" : "Ver mais ▼"}
          </Text>
        </Pressable>
      );
    },
    [expanded, toggleExpand]
  );

  const keyExtractor = useCallback(
    (it: Post) => (it._id || it.id || Math.random().toString()),
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
        <Text style={styles.loadingText}>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.appbar}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
          }}
          style={styles.logo}
        />
        <Text style={styles.appbarTitle}>ConectaEdu</Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={Empty}
      />
    </View>
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
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  appbarTitle: {
    color: PALETTE.primaryDark,
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 0.3,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: PALETTE.inkMuted },
  error: {
    margin: 12,
    color: PALETTE.danger,
    fontWeight: "700",
  },
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
    elevation: 2, // Android shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
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
