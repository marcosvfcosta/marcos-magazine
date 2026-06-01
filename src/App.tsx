import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState<"admin" | "funcionario" | "">("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [tela, setTela] = useState("consultar");
  const [pecas, setPecas] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
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

  const isMobile = window.innerWidth <= 600;

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

  async function carregarPecas() {
    const { data, error } = await supabase
      .from("pecas_precos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);
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

    if (error) return alert(error.message);
    setResultados(data || []);
  }

  async function salvarPeca() {
    const { error } = await supabase.from("pecas_precos").insert([
      {
        tipo_peca: novaPeca.tipo_peca,
        marca: novaPeca.marca,
        modelo: novaPeca.modelo,
        qualidade: novaPeca.qualidade,
        valor_custo: Number(novaPeca.valor_custo),
        valor_final: Number(novaPeca.valor_final),
      },
    ]);

    if (error) return alert(error.message);

    alert("Peça cadastrada com sucesso!");

    setNovaPeca({
      tipo_peca: "",
      marca: "",
      modelo: "",
      qualidade: "",
      valor_custo: "",
      valor_final: "",
    });

    carregarPecas();
  }

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

  const sidebarStyle = {
    ...sidebar,
    width: isMobile ? 132 : 280,
    padding: isMobile ? 12 : 24,
  };

  const contentStyle = {
    ...content,
    padding: isMobile ? 14 : 32,
    width: isMobile ? "calc(100vw - 132px)" : "auto",
  };

  return (
    <div style={page}>
      <aside style={sidebarStyle}>
        <h2 style={isMobile ? sidebarTitleMobile : sidebarTitle}>
          Marcos Magazine
        </h2>

        <div style={orangeLine}></div>

        <p style={isMobile ? profileTextMobile : profileText}>
          👤 Perfil:
          <br />
          <strong>
            {perfil === "admin" ? "Administrador" : "Funcionário"}
          </strong>
        </p>

        <button
          style={tela === "consultar" ? activeMenuButton : menuButton}
          onClick={() => setTela("consultar")}
        >
          🔎 Consultar Peças
        </button>

        {perfil === "admin" && (
          <>
            <button
              style={tela === "cadastrar" ? activeMenuButton : menuButton}
              onClick={() => setTela("cadastrar")}
            >
              ➕ Cadastrar Preços
            </button>

            <button
              style={tela === "todos" ? activeMenuButton : menuButton}
              onClick={() => setTela("todos")}
            >
              📋 Todos os Preços
            </button>
          </>
        )}

        <button style={logoutButton} onClick={sair}>
          🚪 Sair
        </button>
      </aside>

      <main style={contentStyle}>
        <h1 style={isMobile ? mainTitleMobile : mainTitle}>
          Consulta de Preços de Peças
        </h1>

        {tela === "consultar" && (
          <>
            <section style={card}>
              <h3 style={sectionTitle}>Pesquisar Peça</h3>

              <div style={isMobile ? searchGridMobile : searchGrid}>
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
                  Pesquisar
                </button>
              </div>
            </section>

            <h2 style={resultTitle}>Resultados da Pesquisa</h2>

            {resultados.length === 0 ? (
              <div style={emptyCard}>Nenhuma peça encontrada ainda.</div>
            ) : (
              resultados.map((peca) => (
                <div
                  key={peca.id}
                  style={isMobile ? resultCardMobile : resultCard}
                >
                  <div>
                    <h2 style={pieceTitle}>
                      {peca.tipo_peca} - {peca.marca} {peca.modelo}
                    </h2>

                    <p style={pieceText}>
                      Qualidade:{" "}
                      <strong style={{ color: "#ff6600" }}>
                        {peca.qualidade}
                      </strong>
                    </p>

                    {perfil === "admin" && (
                      <p style={pieceText}>Custo: R$ {peca.valor_custo}</p>
                    )}
                  </div>

                  <div style={priceBox}>
                    <p style={priceLabel}>Valor final:</p>
                    <h1 style={isMobile ? priceMobile : price}>
                      R$ {peca.valor_final}
                    </h1>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tela === "cadastrar" && perfil === "admin" && (
          <section style={card}>
            <h3 style={sectionTitle}>Cadastrar Novo Preço</h3>

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
              placeholder="Qualidade. Ex: OLED"
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
              Salvar Preço
            </button>
          </section>
        )}

        {tela === "todos" && perfil === "admin" && (
          <>
            <h2 style={resultTitle}>Todos os Preços Cadastrados</h2>

            {pecas.map((peca) => (
              <div
                key={peca.id}
                style={isMobile ? resultCardMobile : resultCard}
              >
                <div>
                  <h2 style={pieceTitle}>
                    {peca.tipo_peca} - {peca.marca} {peca.modelo}
                  </h2>
                  <p style={pieceText}>Qualidade: {peca.qualidade}</p>
                  <p style={pieceText}>Custo: R$ {peca.valor_custo}</p>
                </div>

                <div style={priceBox}>
                  <p style={priceLabel}>Valor final:</p>
                  <h1 style={isMobile ? priceMobile : price}>
                    R$ {peca.valor_final}
                  </h1>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

const page = {
  background: "linear-gradient(135deg, #090909, #151515)",
  color: "#fff",
  minHeight: "100vh",
  fontFamily: "Arial",
  display: "flex",
  overflowX: "hidden" as const,
};

const loginPage = {
  background: "radial-gradient(circle at top, #1f1f1f, #050505)",
  color: "#fff",
  minHeight: "100vh",
  fontFamily: "Arial",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  overflowX: "hidden" as const,
};

const loginTitle = {
  color: "#ff6600",
  fontSize: 44,
  margin: 0,
  fontWeight: "900",
  textAlign: "center" as const,
};

const loginSubtitle = {
  color: "#fff",
  fontSize: 20,
  marginTop: 10,
  marginBottom: 25,
  textAlign: "center" as const,
};

const loginCard = {
  background: "linear-gradient(180deg, #1d1d1d, #121212)",
  padding: 28,
  borderRadius: 16,
  width: "100%",
  maxWidth: 460,
  border: "1px solid #333",
  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
};

const loginInput = {
  width: "100%",
  padding: 16,
  marginBottom: 14,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#101010",
  color: "#fff",
  boxSizing: "border-box" as const,
  fontSize: 16,
};

const loginButton = {
  width: "100%",
  background: "linear-gradient(135deg, #ff6600, #ff7a18)",
  color: "#fff",
  border: "none",
  padding: "15px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 16,
};

const sidebar = {
  background: "linear-gradient(180deg, #101010, #080808)",
  minHeight: "100vh",
  boxSizing: "border-box" as const,
  borderRight: "1px solid #333",
  flexShrink: 0,
};

const sidebarTitle = {
  color: "#ff6600",
  fontSize: 28,
  fontWeight: "900",
  margin: 0,
};

const sidebarTitleMobile = {
  color: "#ff6600",
  fontSize: 22,
  fontWeight: "900",
  margin: 0,
  lineHeight: 1.15,
};

const orangeLine = {
  width: "100%",
  height: 2,
  background: "#ff6600",
  marginTop: 16,
  marginBottom: 22,
};

const profileText = {
  color: "#ddd",
  marginBottom: 25,
};

const profileTextMobile = {
  color: "#ddd",
  marginBottom: 18,
  fontSize: 14,
  lineHeight: 1.4,
};

const content = {
  flex: 1,
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
};

const mainTitle = {
  color: "#fff",
  fontSize: 34,
  marginTop: 0,
  marginBottom: 24,
};

const mainTitleMobile = {
  color: "#fff",
  fontSize: 24,
  lineHeight: 1.1,
  marginTop: 0,
  marginBottom: 20,
  textAlign: "center" as const,
};

const card = {
  background: "linear-gradient(180deg, #1f1f1f, #171717)",
  padding: 18,
  borderRadius: 12,
  marginBottom: 22,
  border: "1px solid #333",
  boxSizing: "border-box" as const,
};

const sectionTitle = {
  marginTop: 0,
  fontSize: 20,
};

const searchGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 180px",
  gap: 14,
};

const searchGridMobile = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
};

const input = {
  width: "100%",
  padding: 13,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  boxSizing: "border-box" as const,
  fontSize: 16,
};

const button = {
  background: "linear-gradient(135deg, #ff6600, #ff7a18)",
  color: "#fff",
  border: "none",
  padding: "14px 18px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: 15,
  width: "100%",
};

const menuButton = {
  width: "100%",
  background: "transparent",
  color: "#fff",
  border: "1px solid #222",
  padding: "13px 10px",
  borderRadius: 8,
  cursor: "pointer",
  marginBottom: 10,
  textAlign: "left" as const,
  fontSize: 14,
  lineHeight: 1.25,
};

const activeMenuButton = {
  width: "100%",
  background: "linear-gradient(135deg, #ff6600, #ff7a18)",
  color: "#fff",
  border: "none",
  padding: "13px 10px",
  borderRadius: 8,
  cursor: "pointer",
  marginBottom: 10,
  textAlign: "left" as const,
  fontSize: 14,
  lineHeight: 1.25,
  fontWeight: "bold",
};

const logoutButton = {
  width: "100%",
  background: "transparent",
  color: "#ff3333",
  border: "1px solid #222",
  padding: "13px 10px",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: 18,
  textAlign: "left" as const,
  fontSize: 14,
};

const resultTitle = {
  color: "#fff",
  fontSize: 22,
  textAlign: "center" as const,
};

const emptyCard = {
  background: "#1f1f1f",
  color: "#aaa",
  padding: 20,
  borderRadius: 10,
  border: "1px solid #333",
  textAlign: "center" as const,
};

const resultCard = {
  background: "linear-gradient(180deg, #242424, #1a1a1a)",
  padding: 22,
  borderRadius: 12,
  marginBottom: 14,
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
};

const resultCardMobile = {
  background: "linear-gradient(180deg, #242424, #1a1a1a)",
  padding: 18,
  borderRadius: 12,
  marginBottom: 14,
  border: "1px solid #333",
  display: "grid",
  gridTemplateColumns: "1fr 120px",
  gap: 12,
  alignItems: "center",
  boxSizing: "border-box" as const,
};

const pieceTitle = {
  margin: 0,
  fontSize: 20,
  lineHeight: 1.25,
};

const pieceText = {
  color: "#ddd",
  margin: "8px 0",
  fontSize: 15,
};

const priceBox = {
  textAlign: "right" as const,
};

const priceLabel = {
  color: "#fff",
  margin: 0,
  fontWeight: "bold",
  fontSize: 14,
};

const price = {
  color: "#ff6600",
  fontSize: 34,
  margin: "5px 0 0",
};

const priceMobile = {
  color: "#ff6600",
  fontSize: 25,
  margin: "5px 0 0",
  whiteSpace: "nowrap" as const,
};

export default App;