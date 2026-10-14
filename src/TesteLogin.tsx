
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function TesteLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [testando, setTestando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setRecuperando(true);
          setSenha("");
          setMensagem("Digite sua nova senha.");
        }
      });

    // Identifica um link de recuperação recém-aberto.
    // Não usa uma sessão comum como autorização para redefinir.
    const hash = new URLSearchParams(
      window.location.hash.substring(1)
    );

    if (hash.get("type") === "recovery") {
      setRecuperando(true);
      setSenha("");
      setMensagem("Digite sua nova senha.");
    }

    return () => subscription.unsubscribe();
  }, []);

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
      setMensagem("Login não funcionou: " + error.message);
    } else {
      await supabase.auth.signOut();
      setMensagem("Login confirmado! E-mail e senha corretos.");
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
        redirectTo: window.location.origin,
      }
    );

    setMensagem(
      error
        ? "Erro: " + error.message
        : "Verifique seu e-mail para recuperar a senha."
    );

    setTestando(false);
  }

  async function definirNovaSenha() {
    if (senha.length < 8) {
      setMensagem("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais.");
      return;
    }

    setTestando(true);
    setMensagem("Salvando nova senha...");

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setMensagem(
        "Link inválido ou expirado. Solicite uma nova recuperação."
      );
      setTestando(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    if (error) {
      setMensagem("Erro ao alterar senha: " + error.message);
    } else {
      await supabase.auth.signOut();
      setSenha("");
      setConfirmarSenha("");
      setRecuperando(false);
      setMensagem("Senha alterada com sucesso! Agora teste seu login.");
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    setTestando(false);
  }

  const campo = {
    padding: 12,
    width: "100%",
    maxWidth: 350,
    boxSizing: "border-box" as const,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #555",
  };

  const botao = {
    padding: 12,
    marginRight: 10,
    marginBottom: 10,
    cursor: "pointer",
    borderRadius: 6,
  };

  return (
    <div
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        padding: 30,
        fontFamily: "Arial",
      }}
    >
      <h2 style={{ color: "#ff6600" }}>
        Marcos Magazine
      </h2>

      <h3>
        {recuperando
          ? "Cadastrar nova senha"
          : "Teste de Login Supabase"}
      </h3>

      {recuperando ? (
        <div>
          <input
            type="password"
            placeholder="Nova senha (mínimo 8 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={campo}
          />

          <div>
            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              style={campo}
            />
          </div>

          <button
            onClick={definirNovaSenha}
            disabled={testando}
            style={botao}
          >
            Salvar nova senha
          </button>
        </div>
      ) : (
        <div>
          <div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={campo}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={campo}
            />
          </div>

          <button
            onClick={testar}
            disabled={testando}
            style={botao}
          >
            Testar senha
          </button>

          <button
            onClick={recuperarSenha}
            disabled={testando}
            style={botao}
          >
            Recuperar senha
          </button>
        </div>
      )}

      <p>{mensagem}</p>
    </div>
  );
}
