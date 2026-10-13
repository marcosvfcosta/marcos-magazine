
import { useState } from "react";
import { supabase } from "./supabase";

export default function TesteLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [testando, setTestando] = useState(false);

  async function testar() {
    if (!email.trim() || !senha) {
      setMensagem("Digite o e-mail e a senha.");
      return;
    }

    setTestando(true);
    setMensagem("Verificando...");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setMensagem("❌ Login não funcionou: " + error.message);
    } else {
      setMensagem("✅ Senha correta! Login confirmado.");
      await supabase.auth.signOut();
    }

    setSenha("");
    setTestando(false);
  }

  async function recuperarSenha() {
    if (!email.trim()) {
      setMensagem("Digite seu e-mail primeiro.");
      return;
    }

    setTestando(true);
    setMensagem("Solicitando recuperação...");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: "http://localhost:5173",
      }
    );

    if (error) {
      setMensagem("❌ Erro: " + error.message);
    } else {
      setMensagem(
        "✅ Solicitação enviada. Verifique seu Gmail e a pasta Spam."
      );
    }

    setTestando(false);
  }

  return (
    <div
      style={{
        padding: 30,
        background: "#111",
        color: "white",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >
      <h2>Teste de Login Supabase</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 280, maxWidth: "100%" }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ padding: 10, width: 280, maxWidth: "100%" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={testar}
          disabled={testando}
          style={{ padding: 10, cursor: "pointer" }}
        >
          Testar senha
        </button>

        <button
          onClick={recuperarSenha}
          disabled={testando}
          style={{ padding: 10, cursor: "pointer" }}
        >
          Recuperar senha
        </button>
      </div>

      <p>{mensagem}</p>
    </div>
  );
}
