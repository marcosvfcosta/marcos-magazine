
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { supabase } from "./supabase";

type Grupo = "Feminino" | "Masculino" | "Transparente";
type Estilo = "Decorado" | "Case";

type Capinha = {
  id: string;
  produto_id: string;
  nome: string;
  publico: string;
  quantidade: number;
  quantidade_comprar: number;
  status_pedido: string;
  imagem_url: string | null;
  ordem?: number | null;
};

type Props = {
  produtoId: string;
  modelo: string;
  podeEditar: boolean;
  onVoltar: () => void;
  onFazerPedido: () => void;
  onAtualizar?: () => void;
};

const C = {
  fundo: "#0D1118",
  card: "#1A202A",
  borda: "#303744",
  laranja: "#FF6500",
  texto: "#F4F5F7",
  secundario: "#A6AFBE",
};

const estilos: Record<string, CSSProperties> = {
  pagina: {
    minHeight: "100%",
    padding: "18px 12px 110px",
    background: C.fundo,
    color: C.texto,
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
  },
  botao: {
    background: C.card,
    color: C.texto,
    border: `1px solid ${C.borda}`,
    borderRadius: 12,
    padding: "12px 15px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  grupo: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginTop: 20,
  },
  estilos: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  grade: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 20,
  },
  foto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    borderRadius: 12,
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    boxSizing: "border-box",
  },
};

function identificarGrupo(item: Capinha): Grupo {
  if (
    item.nome.startsWith("[Transparente]") ||
    item.publico === "Unissex"
  ) {
    return "Transparente";
  }

  return item.publico === "Masculino"
    ? "Masculino"
    : "Feminino";
}

function identificarEstilo(item: Capinha): Estilo {
  return item.nome.includes("[Case]")
    ? "Case"
    : "Decorado";
}

export default function GaleriaCapinhas({
  produtoId,
  modelo,
  podeEditar,
  onVoltar,
  onFazerPedido,
  onAtualizar, 
}: Props) {
  const [grupo, setGrupo] = useState<Grupo>("Feminino");
  const [estilo, setEstilo] = useState<Estilo>("Decorado");
  const [capinhas, setCapinhas] = useState<Capinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);
  const [fotoItemAberto, setFotoItemAberto] = useState<Capinha | null>(null);
  const [excluirItem, setExcluirItem] = useState<Capinha | null>(null);
  const [escolherOrigem, setEscolherOrigem] = useState(false);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  const [movendoId, setMovendoId] = useState<string | null>(null);
  const arrasteRef = useRef<{ id: string; ativo: boolean; x: number; y: number } | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pressionouRef = useRef(false);

  function ordenar(itens: Capinha[]) {
    return [...itens].sort((a, b) => {
      const oa = a.ordem ?? Number.MAX_SAFE_INTEGER;
      const ob = b.ordem ?? Number.MAX_SAFE_INTEGER;
      return oa - ob || a.nome.localeCompare(b.nome, "pt-BR");
    });
  }

  async function carregar() {
    const { data, error } = await supabase
      .from("estoque_variacoes")
      .select("*")
      .eq("produto_id", produtoId)
      .order("nome");

    if (error) throw error;

    setCapinhas(ordenar((data || []) as Capinha[]));
  }

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      setCarregando(true);

      try {
        const { data, error } = await supabase
          .from("estoque_variacoes")
          .select("*")
          .eq("produto_id", produtoId)
          .order("nome");

        if (error) throw error;

        if (ativo) {
          setCapinhas(ordenar((data || []) as Capinha[]));
        }
      } catch (erro) {
        if (ativo) {
          alert(
            "Erro ao carregar capinhas: " +
              (erro instanceof Error
                ? erro.message
                : String(erro))
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void iniciar();

    return () => {
      ativo = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [produtoId]);

  const fotos = capinhas.filter((item) => {
    if (!item.imagem_url) {
      return false;
    }

    if (identificarGrupo(item) !== grupo) {
      return false;
    }

    if (grupo === "Transparente") {
      return true;
    }

    return identificarEstilo(item) === estilo;
  });

  function limparPressao() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  async function ajustarQuantidade(item: Capinha, delta: number) {
    if (!podeEditar || enviando || salvandoOrdem) return;
    const anterior = Number(item.quantidade);
    if (delta < 0 && anterior <= 0) return;
    const nova = anterior + delta;
    setEnviando(true);
    try {
      const { data, error } = await supabase.from("estoque_variacoes")
        .update({ quantidade: nova, updated_at: new Date().toISOString() })
        .eq("id", item.id).eq("quantidade", anterior).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("O estoque foi alterado em outro aparelho. Atualize e tente novamente.");
      setCapinhas(atual => atual.map(c => c.id === item.id ? { ...c, quantidade: nova } : c));
      onAtualizar?.();
    } catch (erro) {
      alert("Não foi possível atualizar a quantidade: " + (erro instanceof Error ? erro.message : String(erro)));
      await carregar();
    } finally { setEnviando(false); }
  }

  async function mudarPosicao(origemId: string, destinoId: string) {
    if (origemId === destinoId || salvandoOrdem || !podeEditar) return;
    const visiveis = fotos.map(c => c.id);
    const inicio = visiveis.indexOf(origemId);
    const fim = visiveis.indexOf(destinoId);
    if (inicio < 0 || fim < 0) return;
    const novaOrdem = [...visiveis];
    novaOrdem.splice(inicio, 1);
    novaOrdem.splice(fim, 0, origemId);
    // Preserva a posição dos itens das outras divisões.
    const conjunto = new Set(visiveis);
    let cursor = 0;
    const todos = capinhas.map(c => conjunto.has(c.id) ? novaOrdem[cursor++] : c.id);
    const antigos = capinhas;
    setCapinhas(todos.map((id, i) => ({ ...antigos.find(c => c.id === id)!, ordem: i + 1 })));
    setSalvandoOrdem(true);
    try {
      for (let i = 0; i < todos.length; i++) {
        const { data, error } = await supabase.from("estoque_variacoes")
          .update({ ordem: i + 1 }).eq("id", todos[i]).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Sem permissão para salvar a ordem.");
      }
      onAtualizar?.();
    } catch (erro) {
      alert("Não foi possível salvar a ordem. Execute o SQL enviado antes de usar esta função. Detalhes: " + (erro instanceof Error ? erro.message : String(erro)));
      await carregar();
    } finally { setSalvandoOrdem(false); }
  }

  function iniciarPressao(item: Capinha, x: number, y: number) {
    limparPressao();
    pressionouRef.current = false;
    if (!podeEditar || salvandoOrdem) return;
    arrasteRef.current = { id: item.id, ativo: false, x, y };
    timerRef.current = setTimeout(() => {
      if (arrasteRef.current?.id !== item.id) return;
      arrasteRef.current.ativo = true;
      pressionouRef.current = true;
      setMovendoId(item.id);
    }, 650);
  }

  function moverPonteiro(x: number, y: number) {
    const a = arrasteRef.current;
    if (!a) return;
    if (!a.ativo && Math.hypot(x - a.x, y - a.y) > 12) {
      limparPressao();
      arrasteRef.current = null;
    }
  }

  function terminarPressao(x: number, y: number) {
    limparPressao();
    const a = arrasteRef.current;
    arrasteRef.current = null;
    setMovendoId(null);
    if (!a?.ativo) return;
    const destino = document.elementFromPoint(x, y)?.closest("[data-capinha-id]");
    const destinoId = destino?.getAttribute("data-capinha-id");
    if (destinoId) void mudarPosicao(a.id, destinoId);
    window.setTimeout(() => { pressionouRef.current = false; }, 50);
  }

  function abrirFoto(item: Capinha) {
    limparPressao();
    if (pressionouRef.current) { pressionouRef.current = false; return; }
    if (item.imagem_url) { setFotoAberta(item.imagem_url); setFotoItemAberto(item); }
  }

  useEffect(() => {
    function aoMover(e: PointerEvent) { moverPonteiro(e.clientX, e.clientY); }
    function aoSoltar(e: PointerEvent) { terminarPressao(e.clientX, e.clientY); }
    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
    };
  });

  async function receberFoto(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = evento.target.files?.[0];

    evento.target.value = "";

    if (!arquivo || !podeEditar || enviando) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha uma imagem válida.");
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      alert("A foto deve ter no máximo 10 MB.");
      return;
    }

    setEnviando(true);
    setEscolherOrigem(false);

    let caminhoEnviado: string | null = null;

    try {
      const extensao =
        arquivo.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";

      const caminho =
        `estoque/${Date.now()}-` +
        `${Math.random().toString(36).slice(2)}.${extensao}`;

      const upload = await supabase.storage
        .from("estoque-fotos")
        .upload(caminho, arquivo, {
          contentType: arquivo.type,
          upsert: false,
        });

      if (upload.error) throw upload.error;

      caminhoEnviado = caminho;

      const { data: urlData } = supabase.storage
        .from("estoque-fotos")
        .getPublicUrl(caminho);

      const publico =
        grupo === "Transparente" ? "Unissex" : grupo;

      const nome =
        grupo === "Transparente"
          ? `[Transparente] ${Date.now()}`
          : `[${estilo}] ${Date.now()}`;

      const { data, error } = await supabase
        .from("estoque_variacoes")
        .insert({
          produto_id: produtoId,
          nome,
          publico,
          quantidade: 1,
          quantidade_comprar: 0,
          status_pedido: "pendente",
          imagem_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error("Cadastro não autorizado.");
      }

      await carregar();
      onAtualizar?.();
    } catch (erro) {
      if (caminhoEnviado) {
        await supabase.storage
          .from("estoque-fotos")
          .remove([caminhoEnviado]);
      }

      alert(
        "Não foi possível adicionar a capinha: " +
          (erro instanceof Error
            ? erro.message
            : String(erro))
      );
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluirItem || !podeEditar || enviando) return;

    setEnviando(true);

    try {
      const { data, error } = await supabase
        .from("estoque_variacoes")
        .delete()
        .eq("id", excluirItem.id)
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error("Exclusão não autorizada.");
      }

      setExcluirItem(null);
      await carregar();
      onAtualizar?.();
    } catch (erro) {
      alert(
        "Erro ao excluir: " +
          (erro instanceof Error
            ? erro.message
            : String(erro))
      );
    } finally {
      setEnviando(false);
    }
  }

  function botaoSelecao(
    texto: string,
    ativo: boolean,
    clicar: () => void
  ) {
    return (
      <button
        type="button"
        onClick={clicar}
        style={{
          ...estilos.botao,
          background: ativo ? C.laranja : C.card,
          borderColor: ativo ? C.laranja : C.borda,
          color: C.texto,
          padding: "13px 7px",
        }}
      >
        {texto}
      </button>
    );
  }

  return (
    <main style={estilos.pagina}>
      <div style={estilos.container}>
        <button
          type="button"
          style={estilos.botao}
          onClick={onVoltar}
        >
          ← Voltar
        </button>
        <button
  type="button"
  onClick={onFazerPedido}
  style={{
    ...estilos.botao,
    background: "#FF6500",
    marginLeft: 10,
  }}
>
  🛒 Fazer pedido
</button>

        <h2
          style={{
            fontSize: 23,
            margin: "24px 0 5px",
            fontWeight: 800,
            
color: "#FFFFFF",
WebkitTextFillColor: "#FFFFFF",

          }}
        >
          {modelo}
        </h2>

        <p
          style={{
            color: C.secundario,
            fontSize: 13,
            marginTop: 0,
          }}
        >
          Galeria de capinhas
        </p>

        <div style={estilos.grupo}>
          {(["Feminino", "Masculino", "Transparente"] as Grupo[])
            .map((item) => (
              <div key={item}>
                {botaoSelecao(
                  item,
                  grupo === item,
                  () => {
                    setGrupo(item);
                    setEstilo("Decorado");
                  }
                )}
              </div>
            ))}
        </div>

        {grupo !== "Transparente" && (
          <div style={estilos.estilos}>
            {(["Decorado", "Case"] as Estilo[]).map(
              (item) => (
                <div key={item}>
                  {botaoSelecao(
                    item,
                    estilo === item,
                    () => setEstilo(item)
                  )}
                </div>
              )
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>
            {grupo === "Transparente"
              ? "Transparentes"
              : `${grupo} / ${estilo}`}
          </strong>

          <span
            style={{
              color: C.laranja,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {fotos.length}{" "}
            {fotos.length === 1 ? "capinha" : "capinhas"}
          </span>
        </div>

        {carregando ? (
          <p style={{ color: C.secundario, marginTop: 20 }}>
            Carregando capinhas...
          </p>
        ) : (
          <div style={estilos.grade}>
            {fotos.map((item) => (
              <div key={item.id} data-capinha-id={item.id}
                onPointerDown={e => { if (e.target instanceof Element && e.target.closest("button")) return; iniciarPressao(item, e.clientX, e.clientY); }}
                onPointerCancel={() => { limparPressao(); arrasteRef.current = null; setMovendoId(null); }}
                onContextMenu={e => e.preventDefault()}
                style={{ background: C.card, border: `2px solid ${movendoId === item.id ? C.laranja : C.borda}`,
                  borderRadius: 12, overflow: "hidden", touchAction: movendoId === item.id ? "none" : "pan-y",
                  opacity: movendoId === item.id ? 0.7 : 1 }}>
                <div onClick={() => abrirFoto(item)}
                  style={{ aspectRatio: "3 / 4", cursor: "pointer", touchAction: "pan-y" }}>
                  <img src={item.imagem_url || ""} alt="Capinha cadastrada" draggable={false} style={estilos.foto} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2,
                  background: "#222B39", padding: "5px 3px" }}>
                  <button type="button" disabled={!podeEditar || enviando || salvandoOrdem || item.quantidade <= 0}
                    onClick={() => void ajustarQuantidade(item, -1)}
                    style={{ ...estilos.botao, padding: 0, minWidth: 28, height: 31, background: "#303744", opacity: item.quantidade <= 0 ? .45 : 1 }}>−</button>
                  <strong style={{ color: C.texto, fontSize: 16 }}>{item.quantidade}</strong>
                  <button type="button" disabled={!podeEditar || enviando || salvandoOrdem}
                    onClick={() => void ajustarQuantidade(item, 1)}
                    style={{ ...estilos.botao, padding: 0, minWidth: 28, height: 31, background: C.laranja }}>+</button>
                </div>
              </div>
            ))}

            {podeEditar && (
              <button
                type="button"
                disabled={enviando}
                onClick={() => setEscolherOrigem(true)}
                style={{
                  aspectRatio: "3 / 4",
                  border: `2px dashed ${C.laranja}`,
                  background: C.card,
                  color: C.laranja,
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 8,
                  opacity: enviando ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 35,
                    marginBottom: 8,
                  }}
                >
                  +
                </span>
                {enviando
                  ? "Enviando..."
                  : "Adicionar foto"}
              </button>
            )}
          </div>
        )}

        {!carregando && fotos.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: C.secundario,
              marginTop: 24,
              fontSize: 13,
            }}
          >
            Nenhuma capinha cadastrada nesta categoria.
          </p>
        )}

        {podeEditar && (
          <p
            style={{
              color: C.secundario,
              fontSize: 12,
              marginTop: 22,
              lineHeight: 1.6,
            }}
          >
            Cada foto representa uma unidade de estoque.
            Toque para ampliar ou segure por 1 segundo
            para excluir.
          </p>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={receberFoto}
          style={{ display: "none" }}
        />

        <input
          ref={galeriaRef}
          type="file"
          accept="image/*"
          onChange={receberFoto}
          style={{ display: "none" }}
        />
      </div>

      {escolherOrigem && (
        <div style={estilos.modal}>
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              background: C.card,
              borderRadius: 18,
              padding: 20,
              border: `1px solid ${C.borda}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Adicionar capinha
            </h3>

            <p
              style={{
                color: C.secundario,
                fontSize: 13,
              }}
            >
              Escolha como deseja adicionar a foto.
            </p>

            <button
              type="button"
              style={{
                ...estilos.botao,
                width: "100%",
                marginBottom: 10,
              }}
              onClick={() => {
                setEscolherOrigem(false);
                cameraRef.current?.click();
              }}
            >
              📷 Câmera
            </button>

            <button
              type="button"
              style={{
                ...estilos.botao,
                width: "100%",
                marginBottom: 10,
              }}
              onClick={() => {
                setEscolherOrigem(false);
                galeriaRef.current?.click();
              }}
            >
              🖼️ Galeria
            </button>

            <button
              type="button"
              style={{
                ...estilos.botao,
                width: "100%",
                background: "transparent",
              }}
              onClick={() => setEscolherOrigem(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {fotoAberta && (
        <div
          style={estilos.modal}
          onClick={() => { setFotoAberta(null); setFotoItemAberto(null); }}
        >
          <button
            type="button"
            onClick={() => { setFotoAberta(null); setFotoItemAberto(null); }}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: C.card,
              color: C.texto,
              border: "none",
              borderRadius: 50,
              width: 42,
              height: 42,
              fontSize: 23,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          {podeEditar && fotoItemAberto && (
            <button type="button" onClick={e => { e.stopPropagation(); setExcluirItem(fotoItemAberto); setFotoAberta(null); setFotoItemAberto(null); }}
              style={{ ...estilos.botao, position: "absolute", bottom: 20, background: "#7C2630" }}>Excluir cadastro</button>
          )}
          <img
            src={fotoAberta}
            alt="Capinha ampliada"
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: 12,
            }}
          />
        </div>
      )}

      {excluirItem && (
        <div style={estilos.modal}>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.borda}`,
              borderRadius: 18,
              padding: 20,
              maxWidth: 350,
              width: "100%",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Excluir capinha?
            </h3>

            <p
              style={{
                color: C.secundario,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Esta foto será removida do cadastro e
              uma unidade sairá do estoque.
            </p>

            <button
              type="button"
              disabled={enviando}
              onClick={confirmarExclusao}
              style={{
                ...estilos.botao,
                width: "100%",
                background: "#7C2630",
                marginBottom: 10,
              }}
            >
              {enviando
                ? "Excluindo..."
                : "Excluir capinha"}
            </button>

            <button
              type="button"
              disabled={enviando}
              onClick={() => setExcluirItem(null)}
              style={{
                ...estilos.botao,
                width: "100%",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
