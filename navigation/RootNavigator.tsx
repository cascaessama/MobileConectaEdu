import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../telas/ExibePosts";
import Professor from "../telas/Admin";
import LerPost from "../telas/LerPost";
import Login from "../telas/Login";
import CadastrarPost from "../telas/CadastrarPost";
import EditarPost from "../telas/EditarPost";
import Admin from "../telas/Admin";
import Aluno from "../telas/Aluno";
import ListarUsuarios from "../telas/ListarUsuarios";
import CadastrarUsuario from "../telas/CadastrarUsuario";
import ExibePosts from "../telas/ExibePosts";
import EditarUsuario from "../telas/EditarUsuario";

export type RootStackParamList = {
  ExibePosts: undefined;
  Aluno: undefined;
  Admin: undefined;
  LerPost:undefined;
  Login:undefined;
  CadastrarPost:undefined;
  EditarPost:undefined;
  ListarUsuarios: undefined;
  CadastrarUsuario:undefined;
  EditarUsuario:undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
      />
    
      <Stack.Screen name="Admin" component={Admin} />

      <Stack.Screen name="CadastrarPost" component={CadastrarPost} />

      
      <Stack.Screen name="EditarPost" component={EditarPost} />


      <Stack.Screen name="LerPost" component={LerPost}  options={{ title: "LerPost" }}/>

      <Stack.Screen name="ExibePosts" component={ExibePosts}  options={{ title: "ExibePost" }}/>

      <Stack.Screen name="Aluno" component={Aluno}  options={{ title: "Aluno" }}/>

      <Stack.Screen name="ListarUsuarios" component={ListarUsuarios}  options={{ title: "ListarUsuarios" }}/>
      <Stack.Screen name="CadastrarUsuario" component={CadastrarUsuario}  options={{ title: "CadastrarUsuario" }}/>
      <Stack.Screen name="EditarUsuario" component={EditarUsuario}  options={{ title: "EditarUsuario" }}/>


    </Stack.Navigator>
  );
}
