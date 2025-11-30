// LerPost.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RouteProp } from "@react-navigation/native";
import type { Post } from "../modelo/Post";

/** ====== PALETA (mesma do Home) ====== */
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
  LerPost: { post: Post };
};

type LerPostRouteProp = RouteProp<RootStackParamList, "LerPost">;

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

export default function LerPost() {
  const navigation = useNavigation();
  const route = useRoute<LerPostRouteProp>();

  const post = route.params?.post;

  const meta = useMemo(() => {
    const autor = post?.autor || "Autor desconhecido";
    const data = post?.dataCriacao ? ` • ${formatDate(post.dataCriacao)}` : "";
    return `${autor}${data}`;
  }, [post]);

  if (!post) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.error}>
          Não foi possível carregar este post.
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
          }}
          style={styles.logo}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.appbarTitle}>Exibição de Post</Text>

        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>


          <Text style={styles.title}>{post.titulo || "Sem título"}</Text>

          <Text style={styles.meta}>{meta}</Text>

          <Text style={styles.body}>
            {(post.conteudo || "Sem conteúdo.").trim()}
          </Text>
        </View>

        {/* Botão de Voltar no final */}
        <Pressable
          style={styles.footerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerBackText}>← Voltar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
  },

  /* Appbar */
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PALETTE.bgLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  
  logo: { width: 26, height: 26, marginHorizontal: 6 },
  appbarTitle: {
    color: PALETTE.primaryDark,
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  

  /* Conteúdo */
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: PALETTE.ink,
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: PALETTE.inkMuted,
    marginBottom: 14,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: PALETTE.ink,
  },

  /* Botão de voltar inferior */
  footerBackBtn: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  footerBackText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  /* Erro */
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: PALETTE.danger, fontWeight: "700", marginBottom: 12 },
  backBtn: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
