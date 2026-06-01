import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type Perfil = "admin" | "funcionario" | "";

type Peca = {
  id: string;
  tipo_peca: string;
  marca: string;
  modelo: string;
  qualidade: string;
  valor_custo: number;
  valor_final: number;
  created_at?: string;
};

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [tela, setTela] = useState<"consultar" | "cadastrar" | "todos">("consultar");

  const [pecas, setPecas] = useState<Peca[]>([]);
  const [resultados, setResultados] = useState<Peca[]>([]);

  const [tipoPeca, setTipoPeca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  const [novaPeca, setNovaPeca] = useState({
    tipo_peca: "",
    marca: "",
    modelo: "",
    qualidade: "",
    valor_custo: "",
    valor_final: "",
  });

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const porPagina = 5;

  function entrar() {
    if (usuario === "marcos" && senha === "1234") {
      setPerfil("admin");
      setLogado(true);
      setTela("consultar");
      return;
    }

    if (usuario === "funcionario" && senha === "1234") {
      setPerfil("funcionario");
      setLogado(true);
      setTela("consultar");
      return;
    }

    alert("Usuário ou senha incorretos");
  }

  function sair() {
    setLogado(false);
    setPerfil("");
    setUsuario("");
    setSenha("");
    setTela("consultar");
  }

  function dinheiro(valor: any) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function converterNumero(valor: string) {
    if (!valor) return 0;
    return Number(
      valor
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  function limparFormulario() {
    setNovaPeca({
      tipo_peca: "",
      marca: "",
      modelo: "",
      qualidade: "",
      valor_custo: "",
      valor_final: "",
    });
    setEditandoId(null);
  }

  function logoMarca(marca: string) {
    const m = (marca || "").toLowerCase();

    if (m.includes("apple")) return "";
    if (m.includes("samsung")) return "S";
    if (m.includes("xiaomi")) return "MI";
    if (m.includes("motorola")) return "M";
    if (m.includes("realme")) return "R";

    return (marca || "MM").slice(0, 2).toUpperCase();
  }

  function corLogo(marca: string) {
    const m = (marca || "").toLowerCase();

    if (m.includes("apple")) return "#f5f5f5";
    if (m.includes("samsung")) return "#1d5eff";
    if (m.includes("xiaomi")) return "#ff6600";
    if (m.includes("motorola")) return "#24a4ff";
    if (m.includes("realme")) return "#ffd500";

    return "#ff6600";
  }

  async function carregarPecas() {
    const { data, error } = await supabase
      .from("pecas_precos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPecas(data || []);
  }

  useEffect(() => {
    carregarPecas();
  }, []);

  async function pesquisarPecas() {
    let query = supabase.from("pecas_precos").select("*");

    if (tipoPeca) query = query.ilike("tipo_peca", `%${tipoPeca}%`);
    if (marca) query = query.ilike("marca", `%${marca}%`);
    if (modelo) query = query.ilike("modelo", `%${modelo}%`);

    const { data, error } = await query.order("valor_final", {
      ascending: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setResultados(data || []);
    setPagina(1);
  }

  async function salvarPeca() {
    const dados = {
      tipo_peca: novaPeca.tipo_peca.trim(),
      marca: novaPeca.marca.trim(),
      modelo: novaPeca.modelo.trim(),
      qualidade: novaPeca.qualidade.trim(),
      valor_custo: converterNumero(novaPeca.valor_custo),
      valor_final: converterNumero(novaPeca.valor_final),
    };

    if (!dados.tipo_peca || !dados.marca || !dados.modelo || !dados.qualidade) {
      alert("Preencha tipo, marca, modelo e qualidade.");
      return;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("pecas_precos")
        .update(dados)
        .eq("id", editandoId);

      if (error) return alert(error.message);
      alert("Preço alterado com sucesso!");
    } else {
      const { error } = await supabase.from("pecas_precos").insert([dados]);

      if (error) return alert(error.message);
      alert("Preço cadastrado com sucesso!");
    }

    limparFormulario();
    await carregarPecas();
    setTela("todos");
  }

  function editarPeca(peca: Peca) {
    setEditandoId(peca.id);
    setTela("cadastrar");

    setNovaPeca({
      tipo_peca: peca.tipo_peca || "",
      marca: peca.marca || "",
      modelo: peca.modelo || "",
      qualidade: peca.qualidade || "",
      valor_custo: String(peca.valor_custo || ""),
      valor_final: String(peca.valor_final || ""),
    });
  }

  async function excluirPeca(id: string) {
    const confirmar = confirm("Deseja excluir essa peça?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("pecas_precos")
      .delete()
      .eq("id", id);

    if (error) return alert(error.message);

    alert("Peça excluída com sucesso!");
    await carregarPecas();
    setResultados((atual) => atual.filter((p) => p.id !== id));
  }

  const listaBase = tela === "consultar" ? resultados : pecas;

  const listaFiltrada = useMemo(() => {
    return listaBase;
  }, [listaBase]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const listaAtual = listaFiltrada.slice(inicio, inicio + porPagina);

  if (!logado) {
    return (
      <div style={loginPage}>
        <h1 style={loginTitle}>Marcos Magazine</h1>
        <h2 style={loginSubtitle}>Consulta de Preços de Peças</h2>

        <div style={loginCard}>
          <input
            style={loginInput}
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <input
            style={loginInput}
            placeholder="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button style={loginButton} onClick={entrar}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <aside style={sidebar}>
        <h2 style={sidebarTitle}>Marcos Magazine</h2>
        <div style={orangeLine}></div>

        <div style={profileBox}>
          <div style={profileIcon}>👤</div>
          <p style={profileText}>
            Perfil:
            <br />
            <strong>{perfil === "admin" ? "Administrador" : "Funcionário"}</strong>
          </p>
        </div>

        <button
          style={tela === "consultar" ? activeMenuButton : menuButton}
          onClick={() => {
            setTela("consultar");
            setPagina(1);
          }}
        >
          <span style={menuIcon}>⌕</span>
          <span>
            Consultar
            <br />
            Peças
          </span>
        </button>

        {perfil === "admin" && (
          <>
            <button
              style={tela === "cadastrar" ? activeMenuButton : menuButton}
              onClick={() => {
                limparFormulario();
                setTela("cadastrar");
              }}
            >
              <span style={menuIcon}>+</span>
              <span>
                Cadastrar
                <br />
                Preços
              </span>
            </button>

            <button
              style={tela === "todos" ? activeMenuButton : menuButton}
              onClick={() => {
                setTela("todos");
                setPagina(1);
              }}
            >
              <span style={menuIcon}>▦</span>
              <span>
                Todos os
                <br />
                Preços
              </span>
            </button>
          </>
        )}

        <button style={logoutButton} onClick={sair}>
          <span style={exitIcon}>↪</span>
          <span>Sair</span>
        </button>
      </aside>

      <main style={content}>
        <h1 style={mainTitle}>Consulta de Preços de Peças</h1>

        {tela === "consultar" && (
          <section style={searchCard}>
            <input
              style={input}
              placeholder="Tipo. Ex: Tela"
              value={tipoPeca}
              onChange={(e) => setTipoPeca(e.target.value)}
            />

            <input
              style={input}
              placeholder="Marca. Ex: Apple"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />

            <input
              style={input}
              placeholder="Modelo. Ex: iPhone 11"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
            />

            <button style={button} onClick={pesquisarPecas}>
              Buscar
            </button>
          </section>
        )}

        {tela === "cadastrar" && perfil === "admin" && (
          <section style={searchCard}>
            <h2 style={sectionTitle}>
              {editandoId ? "Alterar Preço" : "Cadastrar Novo Preço"}
            </h2>

            <input
              style={input}
              placeholder="Tipo da peça. Ex: Tela"
              value={novaPeca.tipo_peca}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, tipo_peca: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Marca. Ex: Apple"
              value={novaPeca.marca}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, marca: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Modelo. Ex: iPhone 11"
              value={novaPeca.modelo}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, modelo: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Qualidade. Ex: OLED, LCD, Incell"
              value={novaPeca.qualidade}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, qualidade: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Valor de custo"
              value={novaPeca.valor_custo}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, valor_custo: e.target.value })
              }
            />

            <input
              style={input}
              placeholder="Valor final"
              value={novaPeca.valor_final}
              onChange={(e) =>
                setNovaPeca({ ...novaPeca, valor_final: e.target.value })
              }
            />

            <button style={button} onClick={salvarPeca}>
              {editandoId ? "Salvar Alteração" : "Salvar Preço"}
            </button>
          </section>
        )}

        {(tela === "todos" || tela === "consultar") && (
          <>
            <h2 style={subTitle}>
              {tela === "todos" ? "Todos os Preços Cadastrados" : "Resultados"}
            </h2>

            {listaAtual.length === 0 ? (
              <div style={emptyCard}>Nenhuma peça encontrada.</div>
            ) : (
              <div style={listBox}>
                {listaAtual.map((peca) => (
                  <div key={peca.id} style={pieceCard}>
                    <div
                      style={{
                        ...brandLogo,
                        background: corLogo(peca.marca),
                        color: (peca.marca || "").toLowerCase().includes("apple")
                          ? "#111"
                          : "#fff",
                      }}
                    >
                      {logoMarca(peca.marca)}
                    </div>

                    <div style={infoBox}>
                      <h3 style={pieceTitle}>
                        {peca.tipo_peca} - {peca.marca} {peca.modelo}
                      </h3>

                      <p style={pieceText}>
                        Qualidade:{" "}
                        <strong style={orangeText}>{peca.qualidade}</strong>
                      </p>

                      {perfil === "admin" && (
                        <p style={pieceText}>Custo: {dinheiro(peca.valor_custo)}</p>
                      )}
                    </div>

                    <div style={divider}></div>

                    <div style={priceArea}>
                      <p style={priceLabel}>Valor final:</p>
                      <h2 style={price}>{dinheiro(peca.valor_final)}</h2>

                      {perfil === "admin" && (
                        <div style={actionBox}>
                          <button style={editButton} onClick={() => editarPeca(peca)}>
                            ✎
                          </button>

                          <button
                            style={deleteButton}
                            onClick={() => excluirPeca(peca.id)}
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={pagination}>
              <button
                style={pageButton}
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </button>

              <p style={pageText}>
                Página <strong style={orangeText}>{pagina}</strong> de {totalPaginas}
              </p>

              <button
                style={nextButton}
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
              >
                Próxima
              </button>

              <p style={totalText}>Total de {listaFiltrada.length} registros</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const page = {
  background: "#050505",
  color: "#fff",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  overflowX: "hidden" as const,
};

const sidebar = {
  width: 118,
  background: "linear-gradient(180deg, #111, #050505)",
  borderRight: "1px solid #292929",
  minHeight: "100vh",
  padding: "24px 8px",
  boxSizing: "border-box" as const,
  flexShrink: 0,
};

const sidebarTitle = {
  color: "#ff6600",
  fontSize: 20,
  fontWeight: "900",
  lineHeight: 1.08,
  margin: 0,
};

const orangeLine = {
  height: 2,
  width: "100%",
  background: "#ff6600",
  margin: "18px 0 22px",
};

const profileBox = {
  textAlign: "center" as const,
  marginBottom: 24,
};

const profileIcon = {
  fontSize: 23,
};

const profileText = {
  fontSize: 12,
  lineHeight: 1.3,
  margin: "6px 0 0",
  color: "#fff",
};

const menuButton = {
  width: "100%",
  minHeight: 64,
  background: "rgba(255,255,255,0.02)",
  color: "#fff",
  border: "1px solid #2b2b2b",
  borderRadius: 10,
  padding: 7,
  marginBottom: 10,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 11,
  lineHeight: 1.15,
  textAlign: "left" as const,
};

const activeMenuButton = {
  ...menuButton,
  border: "1px solid #ff6600",
  boxShadow: "inset 3px 0 0 #ff6600",
};

const menuIcon = {
  color: "#ff6600",
  fontSize: 23,
  fontWeight: "bold",
};

const logoutButton = {
  ...menuButton,
  color: "#ff4444",
  marginTop: 18,
};

const exitIcon = {
  color: "#ff6600",
  fontSize: 20,
};

const content = {
  flex: 1,
  padding: "24px 10px 22px",
  boxSizing: "border-box" as const,
  maxWidth: "calc(100vw - 118px)",
};

const mainTitle = {
  color: "#fff",
  fontSize: 20,
  lineHeight: 1.08,
  textAlign: "center" as const,
  margin: "0 auto 18px",
  fontWeight: "800",
};

const subTitle = {
  color: "#c9c9c9",
  fontSize: 15,
  textAlign: "center" as const,
  margin: "0 0 15px",
  fontWeight: "400",
};

const listBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 10,
};

const pieceCard = {
  background: "linear-gradient(180deg, #141414, #0c0c0c)",
  border: "1px solid #2b2b2b",
  borderRadius: 11,
  padding: 9,
  display: "grid",
  gridTemplateColumns: "44px 1fr 1px 90px",
  gap: 8,
  alignItems: "center",
  minHeight: 88,
};

const brandLogo = {
  width: 38,
  height: 38,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: 13,
  justifySelf: "center",
};

const infoBox = {
  minWidth: 0,
};

const pieceTitle = {
  margin: "0 0 7px",
  fontSize: 12,
  lineHeight: 1.15,
  fontWeight: "800",
};

const pieceText = {
  margin: "4px 0",
  fontSize: 10.5,
  color: "#d6d6d6",
};

const orangeText = {
  color: "#ff6600",
};

const divider = {
  width: 1,
  height: 58,
  background: "#303030",
};

const priceArea = {
  textAlign: "right" as const,
};

const priceLabel = {
  margin: 0,
  fontSize: 10,
  fontWeight: "bold",
};

const price = {
  margin: "4px 0 8px",
  color: "#ff6600",
  fontSize: 15,
  whiteSpace: "nowrap" as const,
};

const actionBox = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
};

const editButton = {
  width: 30,
  height: 30,
  borderRadius: 7,
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  border: "1px solid #4a4a4a",
  fontSize: 15,
  cursor: "pointer",
};

const deleteButton = {
  width: 30,
  height: 30,
  borderRadius: 7,
  background: "rgba(255,0,0,0.08)",
  color: "#ff6b6b",
  border: "1px solid #d32f2f",
  fontSize: 14,
  cursor: "pointer",
};

const pagination = {
  borderTop: "1px solid #222",
  marginTop: 18,
  paddingTop: 15,
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  alignItems: "center",
  gap: 6,
  textAlign: "center" as const,
};

const pageButton = {
  background: "transparent",
  color: "#ddd",
  border: "1px solid #333",
  borderRadius: 7,
  padding: "10px 6px",
  fontSize: 12,
};

const nextButton = {
  background: "#ff6600",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "10px 6px",
  fontSize: 12,
};

const pageText = {
  fontSize: 12,
};

const totalText = {
  gridColumn: "1 / 4",
  color: "#bfbfbf",
  margin: 0,
  fontSize: 12,
};

const searchCard = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 11,
  padding: 12,
  marginBottom: 15,
};

const sectionTitle = {
  marginTop: 0,
  textAlign: "center" as const,
  fontSize: 16,
};

const input = {
  width: "100%",
  padding: 11,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  boxSizing: "border-box" as const,
  fontSize: 16,
};

const button = {
  width: "100%",
  background: "#ff6600",
  color: "#fff",
  border: "none",
  padding: 12,
  borderRadius: 8,
  fontWeight: "bold",
  fontSize: 14,
};

const emptyCard = {
  background: "#111",
  border: "1px solid #333",
  padding: 18,
  borderRadius: 10,
  color: "#aaa",
  textAlign: "center" as const,
};

const loginPage = {
  background: "#050505",
  color: "#fff",
  minHeight: "100vh",
  fontFamily: "Arial",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const loginTitle = {
  color: "#ff6600",
  fontSize: 42,
  margin: 0,
  fontWeight: "900",
  textAlign: "center" as const,
};

const loginSubtitle = {
  color: "#fff",
  fontSize: 18,
  marginTop: 8,
  marginBottom: 25,
  textAlign: "center" as const,
};

const loginCard = {
  background: "#111",
  padding: 25,
  borderRadius: 16,
  width: "100%",
  maxWidth: 420,
  border: "1px solid #333",
};

const loginInput = {
  width: "100%",
  padding: 15,
  marginBottom: 14,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  boxSizing: "border-box" as const,
  fontSize: 16,
};

const loginButton = {
  width: "100%",
  background: "#ff6600",
  color: "#fff",
  border: "none",
  padding: 15,
  borderRadius: 8,
  fontWeight: "bold",
  fontSize: 16,
};

export default App;