// api.service.ts

import { Post } from "../modelo/Post";


const ENDPOINT = "https://conectaedu.onrender.com/portal";

/** Normaliza diferentes formatos que o backend possa retornar */
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

export async function fetchPosts(): Promise<Post[]> {
  const r = await fetch(ENDPOINT, { headers: { "Cache-Control": "no-cache" } });
  const text = await r.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Resposta não é JSON (o backend pode estar iniciando).");
  }

  const arr = normalize(parsed);
  if (!arr.length) {
    // não é erro fatal, deixe o componente decidir a UI de vazio
    return [];
  }
  return arr;
}
