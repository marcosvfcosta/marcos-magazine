
import type { CSSProperties, ReactNode } from "react";

type Funcao =
  | "capinhas"
  | "peliculas"
  | "estoque"
  | "pecas"
  | "informacoes";

type Props = {
  onNavegar: (funcao: Funcao) => void;
  onAbrirMenu: () => void;
  modelosCadastrados: number;
  itensReposicao: number;
};

const COR = {
  fundo: "#0D1118",
  card: "#1A202A",
  borda: "#303744",
  laranja: "#FF6500",
  branco: "#F4F5F7",
  cinza: "#A6AFBE",
};

function Icone({
  tipo,
  tamanho = 27,
}: {
  tipo: string;
  tamanho?: number;
}) {
  const base = {
    width: tamanho,
    height: tamanho,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const desenhos: Record<string, ReactNode> = {
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    capinhas: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <circle cx="9" cy="5" r="1" />
        <circle cx="12" cy="5" r="1" />
      </>
    ),
    peliculas: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    estoque: (
      <>
        <path d="m3 7 9-4 9 4v10l-9 4-9-4z" />
        <path d="m3 7 9 4 9-4M12 11v10" />
      </>
    ),
    pecas: (
      <>
        <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 17.7 6.3 21l5.3-5.3a5 5 0 0 0 6.4-6.4L15 12l-3-3z" />
      </>
    ),
    informacoes: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    seta: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...base}>{desenhos[tipo]}</svg>;
}

const funcoes: {
  id: Funcao;
  nome: string;
  icone: string;
}[] = [
  { id: "capinhas", nome: "Capinhas", icone: "capinhas" },
  { id: "peliculas", nome: "Películas", icone: "peliculas" },
  { id: "estoque", nome: "Estoque", icone: "estoque" },
  { id: "pecas", nome: "Peças", icone: "pecas" },
  {
    id: "informacoes",
    nome: "Informações",
    icone: "informacoes",
  },
];

const estilos: Record<string, CSSProperties> = {
  pagina: {
    minHeight: "100%",
    background: COR.fundo,
    color: COR.branco,
    padding: "18px 14px 35px",
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 620,
    margin: "0 auto",
  },
  cabecalho: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  botaoMenu: {
    background: "transparent",
    border: "none",
    color: COR.laranja,
    cursor: "pointer",
    padding: 9,
  },
  logo: {
    textAlign: "center",
    lineHeight: 1,
  },
  tituloLogo: {
    color: COR.laranja,
    fontSize: 29,
    fontWeight: 900,
    letterSpacing: -1.2,
  },
  subtituloLogo: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "right",
    marginRight: 4,
    marginTop: 2,
  },
  frase: {
    color: COR.cinza,
    fontSize: 13,
    textAlign: "center",
    margin: "0 0 29px",
    lineHeight: 1.5,
  },
  grade: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  botaoFuncao: {
    background: COR.card,
    border: `1px solid ${COR.borda}`,
    borderRadius: 16,
    padding: "21px 12px",
    minHeight: 116,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: COR.branco,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
  },
  resumo: {
    marginTop: 28,
  },
  tituloResumo: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 12,
  },
  gradeResumo: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  cardResumo: {
    background: COR.card,
    border: `1px solid ${COR.borda}`,
    borderRadius: 14,
    padding: 15,
  },
  numero: {
    fontSize: 27,
    fontWeight: 900,
    marginTop: 9,
  },
  rodape: {
    textAlign: "center",
    color: "#7F8999",
    fontSize: 11,
    marginTop: 32,
  },
};

export default function TelaInicial({
  onNavegar,
  onAbrirMenu,
  modelosCadastrados,
  itensReposicao,
}: Props) {
  return (
    <main style={estilos.pagina}>
      <div style={estilos.container}>
        <header style={estilos.cabecalho}>
          <button
            type="button"
            style={estilos.botaoMenu}
            onClick={onAbrirMenu}
            aria-label="Abrir menu"
          >
            <Icone tipo="menu" />
          </button>

          <div style={estilos.logo}>
            <div style={estilos.tituloLogo}>Marcos</div>
            <div style={estilos.subtituloLogo}>magazine</div>
          </div>

          <div style={{ width: 45 }} />
        </header>

        <p style={estilos.frase}>
          O sucesso é construído todos os dias.
        </p>

        <section style={estilos.grade}>
          {funcoes.map((funcao) => (
            <button
              key={funcao.id}
              type="button"
              style={{
                ...estilos.botaoFuncao,
                gridColumn:
                  funcao.id === "informacoes"
                    ? "1 / -1"
                    : undefined,
              }}
              onClick={() => onNavegar(funcao.id)}
            >
              <span style={{ color: COR.laranja }}>
                <Icone tipo={funcao.icone} tamanho={30} />
              </span>

              <span>{funcao.nome}</span>
            </button>
          ))}
        </section>

        <section style={estilos.resumo}>
          <h3 style={estilos.tituloResumo}>
            Resumo do estoque
          </h3>

          <div style={estilos.gradeResumo}>
            <div style={estilos.cardResumo}>
              <div
                style={{
                  color: COR.cinza,
                  fontSize: 12,
                }}
              >
                Modelos cadastrados
              </div>

              <div style={estilos.numero}>
                {modelosCadastrados}
              </div>
            </div>

            <div style={estilos.cardResumo}>
              <div
                style={{
                  color: COR.cinza,
                  fontSize: 12,
                }}
              >
                Precisam de reposição
              </div>

              <div
                style={{
                  ...estilos.numero,
                  color: COR.laranja,
                }}
              >
                {itensReposicao}
              </div>
            </div>
          </div>
        </section>

        <footer style={estilos.rodape}>
          Marcos Magazine • Gestão inteligente de estoque
        </footer>
      </div>
    </main>
  );
}
