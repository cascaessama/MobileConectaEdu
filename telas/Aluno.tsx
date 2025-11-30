// Aluno.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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

export default function Aluno() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.screen}>
      {/* Topo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aluno</Text>
      </View>

      {/* Conteúdo principal */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Bem-vindo à área do aluno!</Text>
        <Text style={styles.text}>
          Aqui você poderá visualizar suas aulas, materiais e notificações.
        </Text>

        {/* Exemplo de botão */}
        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.btnText}>Voltar para Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bgScreen,
  },
  header: {
    backgroundColor: PALETTE.bgLight,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  headerTitle: {
    color: PALETTE.primaryDark,
    fontWeight: "800",
    fontSize: 22,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PALETTE.primaryDark,
    marginBottom: 10,
  },
  text: {
    color: PALETTE.ink,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
