import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../telas/ExibePosts";
import Professor from "../telas/Admin";


// 1. Passe o tipo para o construtor do Stack
const Stack = createNativeStackNavigator();

export default function Menu() {
  return (
    // 2. Agora o TypeScript aceita 'initialRouteName="Home"' porque
    //    sabe que "Home" é uma chave válida em RootStackParamList
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Professor" component={Professor} />
    </Stack.Navigator>
  );
}