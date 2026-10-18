import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { ativarNotificacoesTecnico } from "./firebasePush";

type Solicitacao = {
  id: string;
  nome_cliente: string;
  modelo_celular: string;
  servico: string;
  descricao_peca: string | null;
  status: string;
  created_at: string;
};

export default function TecnicoApp({ onSair }: { onSair: () => void | Promise<void> }) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [ativandoPush, setAtivandoPush] = useState(false);
  const [mensagemPush, setMensagemPush] = useState("");

  async function ativarPush() {
    if (ativandoPush) return;
    setAtivandoPush(true);
    setMensagemPush("");
    try {
      await ativarNotificacoesTecnico();
      setMensagemPush("Notificações ativadas neste aparelho. Falta configurar o envio automático pelo servidor.");
    } catch (e) {
      setMensagemPush(e instanceof Error ? e.message : "Não foi possível ativar as notificações.");
    } finally {
      setAtivandoPush(false);
    }
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase.from("solicitacoes_servico")
      .select("id,nome_cliente,modelo_celular,servico,descricao_peca,status,created_at")
      .order("created_at", { ascending: false });
    if (error) setErro(error.message);
    else { setSolicitacoes((data ?? []) as Solicitacao[]); setErro(""); }
    setCarregando(false);
  }, []);

  useEffect(() => { void carregar(); const timer = window.setInterval(() => void carregar(), 10000); return () => window.clearInterval(timer); }, [carregar]);

  async function atualizarStatus(id: string, status: "em_andamento" | "concluido" | "nao_reparou") {
    if (ocupado) return;
    setOcupado(id);
    const { data: usuario, error: authError } = await supabase.auth.getUser();
    if (authError || !usuario.user) {
      setErro("Sessão expirada. Entre novamente.");
      setOcupado(null);
      return;
    }
    const { error } = await supabase.from("solicitacoes_servico")
      .update({ status, concluido_por: status === "em_andamento" ? null : usuario.user.id, concluido_em: status === "em_andamento" ? null : new Date().toISOString() })
      .eq("id", id);
    if (error) setErro(error.message);
    else await carregar();
    setOcupado(null);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0D1118", color: "#fff", fontFamily: "Arial,sans-serif", padding: 18 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid #303744", paddingBottom: 18 }}>
        <div><strong style={{ color: "#FF6500", fontSize: 23 }}>Marcos Magazine</strong><div style={{ color: "#aeb7c3" }}>Painel do técnico</div></div>
        <button onClick={() => void onSair()} style={botaoSecundario}>Sair</button>
      </header>
      <main style={{ maxWidth: 850, margin: "24px auto" }}>
        <section style={{ background: "#1A202A", border: "1px solid #303744", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <strong style={{ display: "block", marginBottom: 10 }}>🔔 Notificações de serviço</strong>
          <button type="button" disabled={ativandoPush} onClick={() => void ativarPush()} style={botaoLaranja}>
            {ativandoPush ? "Ativando..." : "Ativar notificações"}
          </button>
          {mensagemPush && <p role="status" style={{ color: "#d6e0ea", marginBottom: 0 }}>{mensagemPush}</p>}
        </section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2>Solicitações de serviço</h2>
          <button style={botaoSecundario} onClick={() => void carregar()}>Atualizar</button>
        </div>
        {erro && <p role="alert" style={{ color: "#ff9999" }}>Erro: {erro}</p>}
        {carregando ? <p>Carregando solicitações...</p> : solicitacoes.length === 0 ? <p>Nenhuma solicitação encontrada.</p> : solicitacoes.map((s) => (
          <article key={s.id} style={{ background: "#1A202A", border: "1px solid #303744", borderRadius: 14, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong>{s.nome_cliente}</strong><span style={{ color: "#FF6500" }}>{s.status}</span>
            </div>
            <p><b>Aparelho:</b> {s.modelo_celular}</p>
            <p><b>Serviço:</b> {s.servico}</p>
            {s.descricao_peca && <p><b>Peça:</b> {s.descricao_peca}</p>}
            <small style={{ color: "#aeb7c3" }}>{new Date(s.created_at).toLocaleString("pt-BR")}</small>
            {!(["concluido", "nao_reparou"].includes(s.status)) && (
              <div style={{ marginTop: 15, display: "flex", flexWrap: "wrap", gap: 9 }}>
                {s.status !== "em_andamento" && <button disabled={ocupado !== null}
                  onClick={() => void atualizarStatus(s.id, "em_andamento")}
                  style={botaoSecundario}>Em andamento</button>}
                <button disabled={ocupado !== null} onClick={() => void atualizarStatus(s.id, "concluido")}
                  style={botaoLaranja}>{ocupado === s.id ? "Salvando..." : "Concluído"}</button>
                <button disabled={ocupado !== null} onClick={() => {
                  if (window.confirm("Confirmar que o aparelho não foi reparado?")) void atualizarStatus(s.id, "nao_reparou");
                }} style={{ ...botaoSecundario, color: "#ffaaaa", borderColor: "#803b45" }}>Não reparou</button>
              </div>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}

const botaoSecundario = { background: "#222b38", color: "white", border: "1px solid #303744", borderRadius: 10, padding: "11px 15px", cursor: "pointer" };
const botaoLaranja = { background: "#FF6500", color: "white", border: 0, borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontWeight: 700 };
