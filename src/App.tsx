
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

type Perfil = "admin" | "funcionario" | "";
type Tela = "consultar" | "cadastrar" | "todos";

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

const EMAIL_ADMIN = "marcosvinicius95pnnn@gmail.com";
const EMAIL_FUNCIONARIO = "funcionario@marcosmagazine.com.br";

const MARCAS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Realme"];

const QUALIDADES = [
  "OLED",
  "LCD",
  "Premium",
  "Original Nacional",
  "Peça genuína",
  "Peça não genuína",
  "Subplaca tipo c",
  "Subplaca V8",
  "Conector",
];

const TIPOS = [
  "Tela",
  "Bateria",
  "Conector de carga",
  "Câmera",
  "Tampa traseira",
  "Flex",
  "Alto-falante",
  "Microfone",
  "Película",
  "Outro",
];

function normalizar(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function dinheiro(valor: number | string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterNumero(valor: string) {
  const limpo = valor.replace(/R\$/gi, "").replace(/\s/g, "");
  return limpo.includes(",")
    ? Number(limpo.replace(/\./g, "").replace(",", "."))
    : Number(limpo);
}

function logoMarca(marca: string) {
  const m = normalizar(marca);
  if (m.includes("apple")) return "";
  if (m.includes("samsung")) return "S";
  if (m.includes("xiaomi")) return "MI";
  if (m.includes("motorola")) return "M";
  if (m.includes("realme")) return "R";
  return (marca || "MM").slice(0, 2).toUpperCase();
}

function corLogo(marca: string) {
  const m = normalizar(marca);
  if (m.includes("apple")) return "#f5f5f5";
  if (m.includes("samsung")) return "#1d5eff";
  if (m.includes("xiaomi")) return "#ff6600";
  if (m.includes("motorola")) return "#24a4ff";
  if (m.includes("realme")) return "#ffd500";
  return "#ff6600";
}

const formularioVazio = () => ({
  tipo_peca: "",
  marca: "",
  modelo: "",
  qualidade: "",
  valor_custo: "",
  valor_final: "",
});

export default function App() {
  const [verificando, setVerificando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [tela, setTela] = useState<Tela>("consultar");

  const [pecas, setPecas] = useState<Peca[]>([]);
  const [resultados, setResultados] = useState<Peca[]>([]);
  const [tipoPeca, setTipoPeca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [digitarModelo, setDigitarModelo] = useState(false);

  const [novaPeca, setNovaPeca] = useState(formularioVazio());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(false);

  const porPagina = 5;

  const modelosDisponiveis = useMemo(() => {
    const encontrados = new Map<string, string>();

    for (const peca of pecas) {
      if (
        marca &&
        normalizar(peca.marca) !== normalizar(marca)
      ) {
        continue;
      }

      const nome = (peca.modelo || "").trim();
      const chave = normalizar(nome);

      if (nome && !encontrados.has(chave)) {
        encontrados.set(chave, nome);
      }
    }

    return Array.from(encontrados.values()).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true })
    );
  }, [pecas, marca]);

  async function carregarPerfil(usuarioId: string) {
    const { data, error } = await supabase
      .from("perfis")
      .select("perfil")
      .eq("usuario_id", usuarioId)
      .single();

    if (error || !data) {
      throw new Error(
        "Seu usuário não possui um perfil autorizado. Verifique a tabela perfis no Supabase."
      );
    }

    if (data.perfil !== "admin" && data.perfil !== "funcionario") {
      throw new Error("Perfil de acesso inválido.");
    }

    return data.perfil as Perfil;
  }

  async function carregarPecas() {
    const { data, error } = await supabase
      .from("pecas_precos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar peças: " + error.message);
      return;
    }

    setPecas((data || []) as Peca[]);
  }

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          if (ativo) {
            setLogado(false);
            setPerfil("");
          }
          return;
        }

        const perfilEncontrado = await carregarPerfil(data.user.id);

        if (ativo) {
          setPerfil(perfilEncontrado);
          setLogado(true);
          await carregarPecas();
        }
      } catch (erro) {
        console.error(erro);
        if (ativo) {
          setLogado(false);
          setPerfil("");
        }
      } finally {
        if (ativo) setVerificando(false);
      }
    }

    void verificarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  async function entrar() {
    if (entrando) return;

    if (!usuario.trim() || !senha) {
      alert("Informe o usuário e a senha.");
      return;
    }

    setEntrando(true);

    try {
      const nome = usuario.trim().toLowerCase().replace(/^@/, "");

      let email = usuario.trim();

      if (nome === "admin") {
        email = EMAIL_ADMIN;
      } else if (nome === "funcionario") {
        email = EMAIL_FUNCIONARIO;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data.user) {
        alert("Usuário ou senha incorretos.");
        return;
      }

      let perfilEncontrado: Perfil;

      try {
        perfilEncontrado = await carregarPerfil(data.user.id);
      } catch (erro) {
        await supabase.auth.signOut();
        throw erro;
      }

      setPerfil(perfilEncontrado);
      setLogado(true);
      setTela("consultar");
      setSenha("");
      setResultados([]);
      setPagina(1);

      await carregarPecas();
    } catch (erro) {
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível entrar."
      );
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Erro ao sair: " + error.message);
      return;
    }

    setLogado(false);
    setPerfil("");
    setUsuario("");
    setSenha("");
    setTela("consultar");
    setPecas([]);
    setResultados([]);
    setModelo("");
    setDigitarModelo(false);
  }

  function limparFormulario() {
    setNovaPeca(formularioVazio());
    setEditandoId(null);
  }

  async function pesquisarPecas() {
    const modeloEscolhido = normalizar(modelo);
    setCarregando(true);

    try {
      const { data, error } = await supabase
        .from("pecas_precos")
        .select("*")
        .order("valor_final", { ascending: true });

      if (error) {
        alert(error.message);
        return;
      }

      const filtrados = ((data || []) as Peca[]).filter((peca) => {
        const tipoOk =
          !tipoPeca.trim() ||
          normalizar(peca.tipo_peca) === normalizar(tipoPeca);

        const marcaOk =
          !marca.trim() ||
          normalizar(peca.marca) === normalizar(marca);

        const modeloOk =
          !modeloEscolhido ||
          normalizar(peca.modelo) === modeloEscolhido;

        return tipoOk && marcaOk && modeloOk;
      });

      setResultados(filtrados);
      setPagina(1);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarPeca() {
    if (perfil !== "admin") {
      alert("Somente o administrador pode cadastrar ou alterar preços.");
      return;
    }

    const dados = {
      tipo_peca: novaPeca.tipo_peca.trim(),
      marca: novaPeca.marca.trim(),
      modelo: novaPeca.modelo.trim(),
      qualidade: novaPeca.qualidade.trim(),
      valor_custo: converterNumero(novaPeca.valor_custo),
      valor_final: converterNumero(novaPeca.valor_final),
    };

    if (
      !dados.tipo_peca ||
      !dados.marca ||
      !dados.modelo ||
      !dados.qualidade
    ) {
      alert("Preencha tipo, marca, modelo e qualidade.");
      return;
    }

    if (
      !novaPeca.valor_custo.trim() ||
      !novaPeca.valor_final.trim() ||
      !Number.isFinite(dados.valor_custo) ||
      !Number.isFinite(dados.valor_final) ||
      dados.valor_custo < 0 ||
      dados.valor_final < 0
    ) {
      alert("Informe valores de custo e final válidos.");
      return;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("pecas_precos")
        .update(dados)
        .eq("id", editandoId);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Preço alterado com sucesso!");
    } else {
      const { error } = await supabase
        .from("pecas_precos")
        .insert([dados]);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Preço cadastrado com sucesso!");
    }

    limparFormulario();
    await carregarPecas();
    setPagina(1);
    setTela("todos");
  }

  function editarPeca(peca: Peca) {
    if (perfil !== "admin") return;

    setEditandoId(peca.id);
    setTela("cadastrar");

    setNovaPeca({
      tipo_peca: peca.tipo_peca || "",
      marca: peca.marca || "",
      modelo: peca.modelo || "",
      qualidade: peca.qualidade || "",
      valor_custo: String(peca.valor_custo ?? ""),
      valor_final: String(peca.valor_final ?? ""),
    });
  }

  async function excluirPeca(id: string) {
    if (perfil !== "admin") {
      alert("Acesso não autorizado.");
      return;
    }

    if (!confirm("Deseja excluir essa peça?")) return;

    const { error } = await supabase
      .from("pecas_precos")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Peça excluída com sucesso!");

    await carregarPecas();

    setResultados((atual) => atual.filter((p) => p.id !== id));
  }

  const listaBase = tela === "consultar" ? resultados : pecas;

  const totalPaginas = Math.max(
    1,
    Math.ceil(listaBase.length / porPagina)
  );

  const listaAtual = listaBase.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina
  );

  if (verificando) {
    return (
      <div style={loginPage}>
        <h1 style={loginTitle}>Marcos Magazine</h1>
        <p>Verificando acesso...</p>
      </div>
    );
  }

  if (!logado) {
    return (
      <div style={loginPage}>
        <h1 style={loginTitle}>Marcos Magazine</h1>

        <h2 style={loginSubtitle}>
          Consulta de Preços de Peças
        </h2>

        <div style={loginCard}>
          <input
            style={loginInput}
            placeholder="@admin ou @funcionario"
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <input
            style={loginInput}
            placeholder="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void entrar();
            }}
          />

          <button
            style={loginButton}
            onClick={() => void entrar()}
            disabled={entrando}
          >
            {entrando ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <aside style={sidebar}>
        <h2 style={sidebarTitle}>Marcos Magazine</h2>

        <div style={orangeLine} />

        <div style={profileBox}>
          <div style={profileIcon}>👤</div>

          <p style={profileText}>
            Perfil:
            <br />
            <strong>
              {perfil === "admin" ? "Administrador" : "Funcionário"}
            </strong>
          </p>
        </div>

        <button
          style={
            tela === "consultar" ? activeMenuButton : menuButton
          }
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
              style={
                tela === "cadastrar" ? activeMenuButton : menuButton
              }
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

        <button
          style={logoutButton}
          onClick={() => void sair()}
        >
          <span style={exitIcon}>↪</span>
          <span>Sair</span>
        </button>
      </aside>

      <main style={content}>
        <h1 style={mainTitle}>
          Consulta de Preços de Peças
        </h1>

        {tela === "consultar" && (
          <section style={searchCard}>
            <select
              style={input}
              value={tipoPeca}
              onChange={(e) => setTipoPeca(e.target.value)}
            >
              <option value="">Todos os tipos de peças</option>

              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <select
              style={input}
              value={marca}
              onChange={(e) => {
                setMarca(e.target.value);
                setModelo("");
                setDigitarModelo(false);
              }}
            >
              <option value="">Todas as marcas</option>

              {MARCAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              style={input}
              value={digitarModelo ? "__digitar__" : modelo}
              onChange={(e) => {
                const valor = e.target.value;

                if (valor === "__digitar__") {
                  setDigitarModelo(true);
                  setModelo("");
                } else {
                  setDigitarModelo(false);
                  setModelo(valor);
                }
              }}
            >
              <option value="">Todos os modelos</option>

              {modelosDisponiveis.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}

              <option value="__digitar__">
                ✏️ Digitar modelo
              </option>
            </select>

            {digitarModelo && (
              <div>
                <input
                  style={input}
                  placeholder="Digite o modelo exato"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void pesquisarPecas();
                    }
                  }}
                />

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={() => {
                    setDigitarModelo(false);
                    setModelo("");
                  }}
                >
                  Voltar para lista de modelos
                </button>
              </div>
            )}

            <button
              style={button}
              disabled={carregando}
              onClick={() => void pesquisarPecas()}
            >
              {carregando ? "Buscando..." : "Buscar"}
            </button>
          </section>
        )}

        {tela === "cadastrar" && perfil === "admin" && (
          <section style={searchCard}>
            <h2 style={sectionTitle}>
              {editandoId ? "Alterar Preço" : "Cadastrar Novo Preço"}
            </h2>

            <select
              style={input}
              value={novaPeca.tipo_peca}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  tipo_peca: e.target.value,
                })
              }
            >
              <option value="">Selecione o tipo de peça</option>

              {[
                ...new Set([
                  ...TIPOS,
                  ...(novaPeca.tipo_peca ? [novaPeca.tipo_peca] : []),
                ]),
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              style={input}
              value={novaPeca.marca}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  marca: e.target.value,
                })
              }
            >
              <option value="">Selecione a marca</option>

              {[
                ...new Set([
                  ...MARCAS,
                  ...(novaPeca.marca ? [novaPeca.marca] : []),
                ]),
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              style={input}
              placeholder="Modelo. Ex: iPhone 11 Pro Max"
              value={novaPeca.modelo}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  modelo: e.target.value,
                })
              }
            />

            <select
              style={input}
              value={novaPeca.qualidade}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  qualidade: e.target.value,
                })
              }
            >
              <option value="">Selecione a qualidade</option>

              {[
                ...new Set([
                  ...QUALIDADES,
                  ...(novaPeca.qualidade ? [novaPeca.qualidade] : []),
                ]),
              ].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            <input
              style={input}
              placeholder="Valor de custo"
              inputMode="decimal"
              value={novaPeca.valor_custo}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  valor_custo: e.target.value,
                })
              }
            />

            <input
              style={input}
              placeholder="Valor final"
              inputMode="decimal"
              value={novaPeca.valor_final}
              onChange={(e) =>
                setNovaPeca({
                  ...novaPeca,
                  valor_final: e.target.value,
                })
              }
            />

            <button
              style={button}
              onClick={() => void salvarPeca()}
            >
              {editandoId ? "Salvar Alteração" : "Salvar Preço"}
            </button>
          </section>
        )}

        {(tela === "todos" || tela === "consultar") && (
          <>
            <h2 style={subTitle}>
              {tela === "todos"
                ? "Todos os Preços Cadastrados"
                : "Resultados"}
            </h2>

            {listaAtual.length === 0 ? (
              <div style={emptyCard}>
                Nenhuma peça encontrada.
              </div>
            ) : (
              <div style={listBox}>
                {listaAtual.map((peca) => (
                  <div key={peca.id} style={pieceCard}>
                    <div
                      style={{
                        ...brandLogo,
                        background: corLogo(peca.marca),
                        color: normalizar(peca.marca).includes("apple")
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
                        <strong style={orangeText}>
                          {peca.qualidade}
                        </strong>
                      </p>

                      {perfil === "admin" && (
                        <p style={pieceText}>
                          Custo: {dinheiro(peca.valor_custo)}
                        </p>
                      )}
                    </div>

                    <div style={divider} />

                    <div style={priceArea}>
                      <p style={priceLabel}>Valor final:</p>

                      <h2 style={price}>
                        {dinheiro(peca.valor_final)}
                      </h2>

                      {perfil === "admin" && (
                        <div style={actionBox}>
                          <button
                            style={editButton}
                            onClick={() => editarPeca(peca)}
                            title="Editar"
                          >
                            ✎
                          </button>

                          <button
                            style={deleteButton}
                            onClick={() =>
                              void excluirPeca(peca.id)
                            }
                            title="Excluir"
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
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>

              <p style={pageText}>
                Página{" "}
                <strong style={orangeText}>{pagina}</strong>{" "}
                de {totalPaginas}
              </p>

              <button
                style={nextButton}
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </button>

              <p style={totalText}>
                Total de {listaBase.length} registros
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// =====================================
// ESTILOS — LARANJA E PRETO
// =====================================

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
  cursor: "pointer",
};

const nextButton = {
  background: "#ff6600",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "10px 6px",
  fontSize: 12,
  cursor: "pointer",
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
  cursor: "pointer",
};

const secondaryButton = {
  width: "100%",
  background: "#222",
  color: "#fff",
  border: "1px solid #555",
  padding: 10,
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
  marginBottom: 10,
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
  boxSizing: "border-box" as const,
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
  cursor: "pointer",
};
