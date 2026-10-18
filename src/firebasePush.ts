import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { supabase } from "./supabase";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export async function ativarNotificacoesTecnico(): Promise<void> {
  if (!window.isSecureContext) {
    throw new Error("Abra o aplicativo publicado em HTTPS para ativar notificações.");
  }
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    throw new Error("Este navegador não oferece notificações push. No iPhone, abra o app instalado na Tela de Início (iOS 16.4+).");
  }
  if (!window.matchMedia("(display-mode: standalone)").matches &&
      /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    throw new Error("No iPhone, abra o aplicativo pelo ícone da Tela de Início, não pelo Safari.");
  }
  if (!(await isSupported())) {
    throw new Error("O Firebase Messaging não é compatível com este navegador ou contexto.");
  }

  const { data: auth, error: erroAuth } = await supabase.auth.getUser();
  if (erroAuth || !auth.user) throw new Error("Faça login como técnico antes de ativar.");

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("perfil")
    .eq("usuario_id", auth.user.id)
    .single();
  if (erroPerfil || perfil?.perfil !== "tecnico") {
    throw new Error("Somente uma conta de técnico pode ativar notificações de serviço.");
  }

  const obrigatorias = [
    config.apiKey, config.authDomain, config.projectId,
    config.messagingSenderId, config.appId,
    import.meta.env.VITE_FIREBASE_VAPID_KEY,
  ];
  if (obrigatorias.some((v) => !v)) {
    throw new Error("Faltam as variáveis VITE_FIREBASE_* no .env e na Vercel.");
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão não concedida. Autorize notificações nos Ajustes do iPhone.");
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const app = getApps().length ? getApp() : initializeApp(config);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("O Firebase não retornou um token de notificações.");

  const { error } = await supabase.from("push_tokens").upsert(
    { token, user_id: auth.user.id, updated_at: new Date().toISOString() },
    { onConflict: "token" }
  );
  if (error) throw new Error("Não foi possível salvar o dispositivo no Supabase: " + error.message);
}
