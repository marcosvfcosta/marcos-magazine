import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import { supabase } from "./supabase";
import TelaInicial from "./TelaInicial";
import GaleriaCapinhas from "./GaleriaCapinhas";
import TecnicoApp from "./TecnicoApp";

type Perfil = "admin" | "funcionario" | "tecnico";
type Tela = "inicio" | "estoque" | "pecas" | "informacoes" | "pedidos" | "pedidos_especiais" | "acompanhar_servicos";
type Categoria = "Capas" | "Películas" | "Outros";
type Publico = "Feminino" | "Masculino" | "Unissex";
type StatusEspecial = "pendente" | "pedido_feito" | "recebido";

type Produto = {
  id: string;
  categoria: Categoria;
  marca: string;
  modelo: string;
  imagem_url: string | null;
  ativo: boolean;
};

type Variacao = {
  id: string;
  produto_id: string;
  nome: string;
  publico: Publico;
  quantidade: number;
  quantidade_comprar: number;
  status_pedido: string;
  imagem_url: string | null;
};

type PedidoManual = {
  id: string;
  categoria: Categoria;
  marca: string | null;
  modelo: string | null;
  nome_produto: string | null;
  publico: string | null;
  tipo: string | null;
  descricao: string | null;
  quantidade: number;
  status: "pendente" | "pedido_feito" | "recebido";
  created_at: string;
};

type FormManual = {
  categoria: Categoria;
  marca: string;
  modelo: string;
  nome_produto: string;
  publico: string;
  tipo: string;
  descricao: string;
  quantidade: string;
};

const manualVazio = (): FormManual => ({
  categoria: "Capas", marca: "", modelo: "", nome_produto: "",
  publico: "Feminina", tipo: "Decorado", descricao: "", quantidade: "1",
});

type Especial = {
  id: string;
  nome_cliente: string;
  telefone: string;
  modelo_aparelho: string;
  descricao: string;
  status: StatusEspecial;
  created_at: string;
};

type SolicitacaoFuncionario = {
  id: string;
  nome_cliente: string;
  modelo_celular: string;
  servico: string;
  descricao_peca: string | null;
  status: string;
  created_at: string;
  concluido_em: string | null;
};

type Peca = {
  id: string;
  tipo_peca: string;
  marca: string;
  modelo: string;
  qualidade: string;
  valor_custo: number;
  valor_final: number;
};

type Informacao = {
  id: string;
  titulo: string;
  conteudo: string;
};

type FormProduto = {
  categoria: Categoria;
  marca: string;
  modelo: string;
  imagem_url: string;
};

type FormVariacao = {
  nome: string;
  publico: Publico;
  quantidade: string;
  quantidade_comprar: string;
  imagem_url: string;
};

type FormEspecial = {
  nome_cliente: string;
  telefone: string;
  modelo_aparelho: string;
  descricao: string;
};

type FormPeca = {
  tipo_peca: string;
  marca: string;
  modelo: string;
  qualidade: string;
  valor_custo: string;
  valor_final: string;
};

type Quantidades = {
  quantidade: string;
  quantidade_comprar: string;
};

const LARANJA = "#ff6600";
const ROSA = "#ff4ca1";
const AZUL = "#34a9ff";

const EMAIL_ADMIN = "marcosvinicius95pnnn@gmail.com";
const EMAIL_FUNCIONARIO = "funcionario@marcosmagazine.com.br";

const MARCAS = ["Apple", "Samsung", "Xiaomi", "Motorola", "Realme"];
const CATEGORIAS: Categoria[] = ["Capas", "Películas", "Outros"];
const PUBLICOS: Publico[] = ["Feminino", "Masculino", "Unissex"];

const TIPOS_PECAS = [
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

const produtoVazio = (categoria: Categoria = "Capas"): FormProduto => ({
  categoria,
  marca: "",
  modelo: "",
  imagem_url: "",
});

const variacaoVazia = (): FormVariacao => ({
  nome: "",
  publico: "Feminino",
  quantidade: "0",
  quantidade_comprar: "0",
  imagem_url: "",
});

const especialVazio = (): FormEspecial => ({
  nome_cliente: "",
  telefone: "",
  modelo_aparelho: "",
  descricao: "",
});

const pecaVazia = (): FormPeca => ({
  tipo_peca: "",
  marca: "",
  modelo: "",
  qualidade: "",
  valor_custo: "",
  valor_final: "",
});

function normalizar(valor: string) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Mantém os nomes de tipos consistentes, inclusive para cadastros antigos.
// A normalização é apenas na interface; nenhum registro é excluído.
function padronizarTipoPeca(valor: string): string {
  const chave = normalizar(valor).replace(/[^a-z0-9]/g, "");
  if (chave === "tela" || chave === "telas") return "Tela";
  return TIPOS_PECAS.find((tipo) =>
    normalizar(tipo).replace(/[^a-z0-9]/g, "") === chave
  ) ?? String(valor || "").trim();
}

function erroTexto(erro: unknown) {
  if (erro instanceof Error) return erro.message;

  if (typeof erro === "object" && erro !== null && "message" in erro) {
    return String(erro.message);
  }

  return String(erro);
}

function dinheiro(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: string) {
  const texto = valor.replace(/R\$/gi, "").replace(/\s/g, "");

  return texto.includes(",")
    ? Number(texto.replace(/\./g, "").replace(",", "."))
    : Number(texto);
}

function inteiro(valor: string) {
  if (!/^\d+$/.test(valor.trim())) return null;

  const n = Number(valor);

  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

const S: Record<string, CSSProperties> = {
  app: {
    minHeight: "100dvh",
    width: "100%",
    overflowX: "hidden",
    background: "#080b11",
    color: "#f7f7f9",
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
  },

  topo: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    minHeight: 67,
    padding: "10px 13px",
    background: "#090d14",
    borderBottom: "1px solid #202733",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    boxSizing: "border-box",
  },

  conteudo: {
    maxWidth: 1050,
    width: "100%",
    margin: "0 auto",
    padding: "16px 12px 115px",
    boxSizing: "border-box",
  },

  card: {
    background: "#111722",
    border: "1px solid #252e3d",
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    minWidth: 0,
    boxSizing: "border-box",
  },

  input: {
    width: "100%",
    minWidth: 0,
    minHeight: 45,
    padding: "11px 12px",
    borderRadius: 11,
    border: "1px solid #313b4c",
    background: "#0e1420",
    color: "#fff",
    fontSize: 16,
    outlineColor: LARANJA,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  principal: {
    minHeight: 43,
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    background: LARANJA,
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },

  secundario: {
    minHeight: 43,
    padding: "10px 14px",
    border: "1px solid #303a4b",
    borderRadius: 10,
    background: "#18202d",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  perigo: {
    minHeight: 43,
    padding: "10px 14px",
    border: "1px solid #71343b",
    borderRadius: 10,
    background: "#391b23",
    color: "#ffacb0",
    fontWeight: 700,
    cursor: "pointer",
  },

  linha: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  titulo: {
    fontSize: 22,
    fontWeight: 800,
    margin: "5px 0 14px",
  },

  pequeno: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#9da7b8",
  },

  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    background: "#0b1018",
    borderTop: "1px solid #273040",
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    padding: "7px 5px calc(8px + env(safe-area-inset-bottom))",
    boxSizing: "border-box",
  },
};

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12, minWidth: 0 }}>
      <span
        style={{
          display: "block",
          color: "#abb4c2",
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        {rotulo}
      </span>
      {children}
    </label>
  );
}

function Botao({
  children,
  onClick,
  variante = "principal",
  disabled = false,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  variante?: "principal" | "secundario" | "perigo";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...(variante === "principal"
          ? S.principal
          : variante === "perigo"
          ? S.perigo
          : S.secundario),
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <div style={{ textAlign: "center", lineHeight: 0.9, flexShrink: 0 }}>
      <div
        style={{
          fontSize: 27,
          fontWeight: 900,
          color: LARANJA,
          letterSpacing: -1.5,
        }}
      >
        Marcos
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#f5f5f5",
          fontWeight: 700,
          textAlign: "center",
          marginRight: 0,
        }}
      >
        magazine
      </div>
    </div>
  );
}

function FotoBotoes({
  url,
  enviando,
  camera,
  galeria,
}: {
  url: string;
  enviando: boolean;
  camera: () => void;
  galeria: () => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={S.linha}>
        <Botao
          variante="secundario"
          disabled={enviando}
          onClick={camera}
          style={{ flex: "1 1 130px" }}
        >
          📷 Câmera
        </Botao>

        <Botao
          variante="secundario"
          disabled={enviando}
          onClick={galeria}
          style={{ flex: "1 1 130px" }}
        >
          🖼️ Galeria
        </Botao>
      </div>

      {enviando && (
        <p style={{ color: LARANJA, fontSize: 13 }}>
          Enviando foto...
        </p>
      )}

      {url && (
        <img
          src={url}
          alt="Foto cadastrada"
          style={{
            width: "100%",
            maxHeight: 190,
            objectFit: "contain",
            borderRadius: 12,
            marginTop: 12,
            background: "#080b11",
          }}
        />
      )}
    </div>
  );
}

function FormularioProduto({
  form,
  setForm,
  editando,
  ocupado,
  enviando,
  salvar,
  cancelar,
  camera,
  galeria,
}: {
  form: FormProduto;
  setForm: React.Dispatch<React.SetStateAction<FormProduto>>;
  editando: boolean;
  ocupado: boolean;
  enviando: boolean;
  salvar: () => void;
  cancelar: () => void;
  camera: () => void;
  galeria: () => void;
}) {
  return (
    <section style={S.card}>
      <h3>{editando ? "Editar modelo" : "Novo modelo"}</h3>

      <Campo rotulo="Categoria">
        <select
          style={S.input}
          value={form.categoria}
          onChange={(e) =>
            setForm((a) => ({
              ...a,
              categoria: e.target.value as Categoria,
            }))
          }
        >
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Marca">
        <select
          style={S.input}
          value={form.marca}
          onChange={(e) =>
            setForm((a) => ({ ...a, marca: e.target.value }))
          }
        >
          <option value="">Selecione</option>
          {MARCAS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Modelo">
        <input
          style={S.input}
          value={form.modelo}
          placeholder="Ex.: iPhone 17 Pro Max"
          onChange={(e) =>
            setForm((a) => ({ ...a, modelo: e.target.value }))
          }
        />
      </Campo>

      {form.categoria !== "Películas" && (
        <FotoBotoes
          url={form.imagem_url}
          enviando={enviando}
          camera={camera}
          galeria={galeria}
        />
      )}

      <Botao
        disabled={ocupado || enviando}
        onClick={salvar}
        style={{ width: "100%" }}
      >
        Salvar modelo
      </Botao>

      <Botao
        variante="secundario"
        onClick={cancelar}
        style={{ width: "100%", marginTop: 8 }}
      >
        Cancelar
      </Botao>
    </section>
  );
}

function FormularioVariacao({
  form,
  setForm,
  categoria,
  editando,
  ocupado,
  enviando,
  salvar,
  cancelar,
  camera,
  galeria,
}: {
  form: FormVariacao;
  setForm: React.Dispatch<React.SetStateAction<FormVariacao>>;
  categoria: Categoria;
  editando: boolean;
  ocupado: boolean;
  enviando: boolean;
  salvar: () => void;
  cancelar: () => void;
  camera: () => void;
  galeria: () => void;
}) {
  return (
    <section style={S.card}>
      <h3>{editando ? "Editar item" : "Cadastrar novo item"}</h3>

      <Campo
        rotulo={
          categoria === "Películas"
            ? "Tipo de película"
            : "Nome da capinha ou item"
        }
      >
        <input
          style={S.input}
          value={form.nome}
          placeholder={
            categoria === "Películas"
              ? "Ex.: 3D, 9D, Privacidade"
              : "Ex.: Coração Rosa"
          }
          onChange={(e) =>
            setForm((a) => ({ ...a, nome: e.target.value }))
          }
        />
      </Campo>

      {categoria !== "Películas" && (
        <Campo rotulo="Público">
          <select
            style={S.input}
            value={form.publico}
            onChange={(e) =>
              setForm((a) => ({
                ...a,
                publico: e.target.value as Publico,
              }))
            }
          >
            {PUBLICOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Campo>
      )}

      {categoria !== "Películas" && (
        <FotoBotoes
          url={form.imagem_url}
          enviando={enviando}
          camera={camera}
          galeria={galeria}
        />
      )}

      <Campo rotulo="Quantidade em estoque">
        <input
          style={S.input}
          type="number"
          min="0"
          step="1"
          value={form.quantidade}
          onChange={(e) =>
            setForm((a) => ({
              ...a,
              quantidade: e.target.value,
            }))
          }
        />
      </Campo>

      <Campo rotulo="Precisa comprar">
        <input
          style={S.input}
          type="number"
          min="0"
          step="1"
          value={form.quantidade_comprar}
          onChange={(e) =>
            setForm((a) => ({
              ...a,
              quantidade_comprar: e.target.value,
            }))
          }
        />
      </Campo>

      <Botao
        disabled={ocupado || enviando}
        onClick={salvar}
        style={{ width: "100%" }}
      >
        {ocupado ? "Salvando..." : "Salvar item"}
      </Botao>

      {editando && (
        <Botao
          variante="secundario"
          onClick={cancelar}
          style={{ width: "100%", marginTop: 8 }}
        >
          Cancelar edição
        </Botao>
      )}
    </section>
  );
}

function ControleNumero({
  valor,
  alterar,
  disabled,
}: {
  valor: string;
  alterar: (valor: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        minWidth: 0,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          alterar(String(Math.max(0, Number(valor || 0) - 1)))
        }
        style={{
          ...S.principal,
          minHeight: 36,
          width: 34,
          padding: 0,
          fontSize: 22,
        }}
      >
        −
      </button>

      <input
        type="number"
        min="0"
        step="1"
        disabled={disabled}
        value={valor}
        onChange={(e) => alterar(e.target.value)}
        style={{
          ...S.input,
          minHeight: 36,
          height: 36,
          width: 55,
          padding: "4px 3px",
          textAlign: "center",
          fontSize: 15,
          fontWeight: 800,
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => alterar(String(Number(valor || 0) + 1))}
        style={{
          ...S.principal,
          minHeight: 36,
          width: 34,
          padding: 0,
          fontSize: 22,
        }}
      >
        +
      </button>
    </div>
  );
}

function FormularioEspecial({
  form,
  setForm,
  salvar,
  cancelar,
  ocupado,
}: {
  form: FormEspecial;
  setForm: React.Dispatch<React.SetStateAction<FormEspecial>>;
  salvar: () => void;
  cancelar: () => void;
  ocupado: boolean;
}) {
  return (
    <section style={S.card}>
      <h3>Novo pedido especial</h3>

      {(
        [
          ["nome_cliente", "Nome do cliente"],
          ["telefone", "Telefone"],
          ["modelo_aparelho", "Modelo do aparelho"],
        ] as [keyof FormEspecial, string][]
      ).map(([campo, rotulo]) => (
        <Campo key={campo} rotulo={rotulo}>
          <input
            style={S.input}
            type={campo === "telefone" ? "tel" : "text"}
            value={form[campo]}
            onChange={(e) =>
              setForm((a) => ({
                ...a,
                [campo]: e.target.value,
              }))
            }
          />
        </Campo>
      ))}

      <Campo rotulo="Descrição">
        <textarea
          style={{ ...S.input, minHeight: 100 }}
          value={form.descricao}
          onChange={(e) =>
            setForm((a) => ({
              ...a,
              descricao: e.target.value,
            }))
          }
        />
      </Campo>

      <Botao
        disabled={ocupado}
        onClick={salvar}
        style={{ width: "100%" }}
      >
        Salvar pedido
      </Botao>

      <Botao
        variante="secundario"
        onClick={cancelar}
        style={{ width: "100%", marginTop: 8 }}
      >
        Cancelar
      </Botao>
    </section>
  );
}

// Ordem de exibição definida pela lista enviada pela loja. Para modelos novos
// ainda não mapeados, o comparador natural funciona como alternativa.
const ORDEM_MARCAS_PELICULAS = ["Apple", "Samsung", "Xiaomi", "Realme", "Poco", "Motorola"];

const ORDEM_MODELOS_PELICULAS: Record<string, string> = {
  Apple: `7/8 branco|7/8 preto|7/8 plus branco|7/8 plus preto|xs|xs max/11pm|xr/11|12mini|12/12pro|12pro max|13mini|13/13pro/14|13 pro max|14 pro|14 pro max|15/15 pro|15 pro max|16|16 pro|16 pro max|17/17 pro|17 pm`,
  Samsung: `a01core|a01|a02/a02s|a03/a03s|a04/a04s/a04e|a05|a05s|a06/a07|a06s|a10/a10s|a11|a12|a13|a14|a15|a16/a17|a20/30/50|a20s|a21s|a22 4g|a23|a24|a25|a26|a31|a32 4g/m22|a33|a34|a35|a36|a37|a51|a52|a53|a54|a55|a56|a70|a71|a72|a73|s20|s20fe|s21|s21 fe|s21 plus|s21 ultra|s22|s22 plus|s22ultra|s23|s23fe|s23 plus|s23 ultra|s24|s24 plus|s24 ultra|s24 fe|s25|s25 plus|s25 ultra|s26|s26 plus|s26 ultra`,
  Xiaomi: `a1|a2|a3|note 7|mi 8 pro|redmi 8a|note 8|note 8t|note 8pro|mi 8 lite|redmi 9|9a/9c|note 9t|note 9|note 9s/pro|9 lite|10a|10c/12c|redmi 10|note 10|note 11|note 11 pro|redmi 12|note 12|note 12s|note 12 pro|redmi 13|redmi 13c|note 13|note 13 pro|14c|note 14|redmi 14|note 14 pro|rm 15|rm 15c|note 15|note 15 pro`,
  Realme: `realme c51|realme c55|realme note 60/60x|realme c63/53|realme c65/c67/c75|realme c71|realme c85`,
  Poco: `m3|m3 pro|x3/x3pro|c3|m4|m4 pro 4g|m4 pro 5g|x4 pro|x4 gt|f3|f4 gt|f5|m5|m5 pro|x5|x5 pro|m6 pro|x6/x6 pro|x7|x7 pro|pc f5 pro|x8 pro|x8 pro max`,
  Motorola: `g05/g15|g5s plus|g5s|g6|g06|g6 plus|g7|g7 play|g7 power|g8|g8play|g8plus|g8power|g8 power lite|g9/g9 play|g9plus|g9power|g10/20/30|g10play|g10power|g13/g23/g53|g14|g15|g22/e32|g23|g24/g04|g31/41|g32|g34|g35|g42|g50|g51|g52/g82|g53|g54|g55|g56|g60|g60s|g62|g71|g71s|g72|g73|g75|g84|g86|g100|e5 play|e5plus|e6play|e6s|e6i|e6plus|e7/e7 power|e7 plus|e13|e20|e22|e32|e40|edge 30|edge 60`,
};

function chaveModeloPeliculas(nome: string): string {
  return normalizar(nome)
    .replace(/\b(iphone|galaxy|samsung|motorola|moto|xiaomi|realme|poco)\b/g, "")
    .replace(/pro\s+max/g, "pm")
    .replace(/[^a-z0-9]/g, "");
}

function marcaDaPelicula(produto: Produto): string {
  const marca = normalizar(produto.marca);
  if (marca.includes("apple") || marca.includes("iphone")) return "Apple";
  if (marca.includes("samsung")) return "Samsung";
  if (marca.includes("realme")) return "Realme";
  if (marca.includes("motorola") || marca === "moto") return "Motorola";
  if (marca.includes("poco")) return "Poco";
  if (normalizar(produto.modelo).startsWith("poco ")) return "Poco";
  if (marca.includes("xiaomi") || marca.includes("redmi")) return "Xiaomi";
  return produto.marca.trim() || "Outros";
}

function tipoDaPelicula(nome: string): string {
  const limpo = normalizar(nome).replace(/\s+/g, " ");
  // Agrupa descrições equivalentes sem alterar nem excluir os cadastros do Supabase.
  if (/^3\s*d/.test(limpo)) {
    if (limpo.includes("priv")) return "3D Privativa";
    if (limpo.includes("fosca")) return "3D Fosca";
    return "3D";
  }
  if (/^9\s*d/.test(limpo)) {
    if (limpo.includes("priv") && limpo.includes("fosc")) return "9D Fosca Privativa";
    if (limpo.includes("priv")) return "9D Privativa";
    if (limpo.includes("fosc")) return "9D Fosca";
    return "9D";
  }
  if (limpo.includes("traseira")) return "Película Traseira";
  return nome.trim() || "Sem tipo";
}

function compararMarcasPeliculas(a: string, b: string): number {
  const ia = ORDEM_MARCAS_PELICULAS.indexOf(a);
  const ib = ORDEM_MARCAS_PELICULAS.indexOf(b);
  if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function indiceLancamentoPeliculas(marca: string, modelo: string): number {
  const chave = chaveModeloPeliculas(modelo);
  const catalogo = (ORDEM_MODELOS_PELICULAS[marca] || "").split("|");
  for (let i = 0; i < catalogo.length; i++) {
    const entrada = catalogo[i];
    // Também encontra iPhone 11 em XR/11 e iPhone 13 Pro em 13/13 Pro/14.
    if (chaveModeloPeliculas(entrada) === chave ||
        entrada.split("/").some(parte => chaveModeloPeliculas(parte) === chave)) return i;
  }
  // Modelos novos ficam após os da sequência cadastrada e usam ordem natural.
  return 9999;
}

function compararLancamentoPeliculas(marca: string, a: string, b: string): number {
  const ia = indiceLancamentoPeliculas(marca, a);
  const ib = indiceLancamentoPeliculas(marca, b);
  if (ia !== ib) return ia - ib;
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

type LinhaPelicula = { chave: string; modelo: string; marca: string; quantidade: number; produto: Produto; semTipo?: boolean };

// Modelos sem variações continuam acessíveis para concluir o cadastro.
function montarLinhasPeliculas(produtos: Produto[], variacoes: Variacao[], marcaFiltro: string, tipoFiltro: string): LinhaPelicula[] {
  const resultado = new Map<string, LinhaPelicula>();
  for (const produto of produtos) {
    if (!produto.ativo || produto.categoria !== "Películas") continue;
    const marca = marcaDaPelicula(produto);
    if (marcaFiltro !== "Todas" && marcaFiltro !== marca) continue;
    const itens = variacoes.filter(v => v.produto_id === produto.id);
    const correspondentes = itens.filter(v => tipoDaPelicula(v.nome) === tipoFiltro);
    if (itens.length && !correspondentes.length) continue;
    const chave = `${marca}:${chaveModeloPeliculas(produto.modelo)}`;
    const quantidade = correspondentes.reduce((total, v) => total + Number(v.quantidade || 0), 0);
    const existente = resultado.get(chave);
    if (existente) {
      existente.quantidade += quantidade;
      if (correspondentes.length && existente.semTipo) {
        existente.produto = produto;
        existente.semTipo = false;
      }
    } else {
      resultado.set(chave, { chave, marca, modelo: produto.modelo.trim(), quantidade, produto, semTipo: !itens.length });
    }
  }
  return [...resultado.values()].sort((a, b) => compararMarcasPeliculas(a.marca, b.marca) || compararLancamentoPeliculas(a.marca, a.modelo, b.modelo));
}

export default function App() {
  const [verificando, setVerificando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | "">("")

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const [tela, setTela] = useState<Tela>("inicio");
  const [menuAberto, setMenuAberto] = useState(false);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [especiais, setEspeciais] = useState<Especial[]>([]);
  const [manuais, setManuais] = useState<PedidoManual[]>([]);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [formManual, setFormManual] = useState<FormManual>(manualVazio());
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [informacoes, setInformacoes] = useState<Informacao[]>([]);

  const [categoria, setCategoria] = useState<Categoria>("Capas");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [marcaPeliculas, setMarcaPeliculas] = useState("Todas");
  const [tipoPeliculas, setTipoPeliculas] = useState("");
  const [mostrarCadastroPelicula, setMostrarCadastroPelicula] = useState(false);
  const [formPelicula, setFormPelicula] = useState<{ marca: string; modelo: string; itens: { tipo: string; quantidade: string }[] }>({
    marca: "", modelo: "", itens: [{ tipo: "", quantidade: "0" }],
  });
  const [produtoPeliculaId, setProdutoPeliculaId] = useState<string | null>(null);
  const salvandoPelicula = useRef(false);
  const [categoriaPedidoLista, setCategoriaPedidoLista] = useState<"Capas" | "Películas">("Películas");
  const [tipoPedidoLista, setTipoPedidoLista] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroAberto, setFiltroAberto] = useState(false);

  const [produtoAbertoId, setProdutoAbertoId] = useState<string | null>(null);
  const [publicoFiltro, setPublicoFiltro] = useState<Publico>("Feminino");

  const [mostrarProduto, setMostrarProduto] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState<string | null>(null);
  const [formProduto, setFormProduto] = useState<FormProduto>(produtoVazio());

  const [mostrarVariacao, setMostrarVariacao] = useState(false);
  const [editandoVariacao, setEditandoVariacao] = useState<string | null>(null);
  const [formVariacao, setFormVariacao] = useState<FormVariacao>(variacaoVazia());

  const [rascunhos, setRascunhos] = useState<Record<string, Quantidades>>({});
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [mostrarEspecial, setMostrarEspecial] = useState(false);
  const [formEspecial, setFormEspecial] = useState<FormEspecial>(especialVazio());

  const [secaoPecas, setSecaoPecas] = useState<"consultar" | "cadastrar" | "todos">("consultar");
  const [formPeca, setFormPeca] = useState<FormPeca>(pecaVazia());
  const [editandoPeca, setEditandoPeca] = useState<string | null>(null);

  const [tipoPeca, setTipoPeca] = useState("");
  const [marcaPeca, setMarcaPeca] = useState("");
  const [modeloPeca, setModeloPeca] = useState("");
  const [qualidadePeca, setQualidadePeca] = useState("");
  const [pesquisouPecas, setPesquisouPecas] = useState(false);
  const [paginaPecas, setPaginaPecas] = useState(1);
  const [pecaSelecionada, setPecaSelecionada] = useState<Peca | null>(null);
  const [pecasComAro, setPecasComAro] = useState<Record<string, boolean>>({});
  const [aroSelecionado, setAroSelecionado] = useState(false);
  const [clienteServico, setClienteServico] = useState("");
  const [servicoSolicitado, setServicoSolicitado] = useState("");
  const [observacoesServico, setObservacoesServico] = useState("");
  const [enviandoServico, setEnviandoServico] = useState(false);
  const [mensagemServico, setMensagemServico] = useState("");

  const [servicosFuncionario, setServicosFuncionario] = useState<SolicitacaoFuncionario[]>([]);
  const [erroServicos, setErroServicos] = useState("");
  const [atualizandoServicos, setAtualizandoServicos] = useState(false);
  const servicosAnteriores = useRef<Record<string, string>>({});

  async function carregarServicosFuncionario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("solicitacoes_servico")
      .select("id,nome_cliente,modelo_celular,servico,descricao_peca,status,created_at,concluido_em")
      .eq("criado_por", user.id)
      .order("created_at", { ascending: false });
    if (error) { setErroServicos(error.message); return; }
    const itens = (data || []) as SolicitacaoFuncionario[];
    const anterior = servicosAnteriores.current;
    const alterados = itens.filter((item) => anterior[item.id] && anterior[item.id] !== item.status);
    if (alterados.length) {
      setMensagemServico(`Status atualizado: ${alterados[0].nome_cliente} — ${alterados[0].status.replaceAll("_", " ")}`);
    }
    servicosAnteriores.current = Object.fromEntries(itens.map((item) => [item.id, item.status]));
    setServicosFuncionario(itens);
    setErroServicos("");
  }

  useEffect(() => {
    if (!logado || !funcionario) return;
    void carregarServicosFuncionario();
    const intervalo = window.setInterval(() => void carregarServicosFuncionario(), 10000);
    return () => window.clearInterval(intervalo);
  }, [logado, perfil]);

  async function apagarServico(item: SolicitacaoFuncionario) {
    if (!funcionario || !["concluido", "nao_reparou"].includes(item.status)) return;
    if (!window.confirm(`Apagar definitivamente do Supabase o serviço de ${item.nome_cliente}? Esta ação não poderá ser desfeita.`)) return;
    setAtualizandoServicos(true);
    try {
      const { data, error } = await supabase.from("solicitacoes_servico")
        .delete().eq("id", item.id).in("status", ["concluido", "nao_reparou"]).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada ou serviço ainda não finalizado.");
      await carregarServicosFuncionario();
      setMensagemServico("Serviço apagado definitivamente do Supabase.");
    } catch (e) { setErroServicos(erroTexto(e)); }
    finally { setAtualizandoServicos(false); }
  }

  async function enviarPecaTecnico() {
    if (!pecaSelecionada || enviandoServico) return;
    if (!clienteServico.trim() || !servicoSolicitado.trim()) {
      setMensagemServico("Informe o cliente e o serviço solicitado.");
      return;
    }
    setEnviandoServico(true);
    setMensagemServico("");
    try {
      const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
      if (erroAuth || !user) throw new Error("Faça login novamente.");
      const p = pecaSelecionada;
      const descricao = [
        `${p.tipo_peca} - ${p.marca} ${p.modelo} - ${p.qualidade}${aroSelecionado ? " - Com aro" : ""} - ${dinheiro(Number(p.valor_final) + (aroSelecionado ? 20 : 0))}`,
        observacoesServico.trim(),
      ].filter(Boolean).join(" | ");
      const { error } = await supabase.from("solicitacoes_servico").insert({
        nome_cliente: clienteServico.trim(),
        modelo_celular: `${p.marca} ${p.modelo}`,
        servico: servicoSolicitado.trim(),
        peca_id: p.id,
        descricao_peca: descricao,
        status: "pendente",
        criado_por: user.id,
      });
      if (error) throw error;
      setPecaSelecionada(null);
      setClienteServico("");
      setServicoSolicitado("");
      setObservacoesServico("");
      setMensagemServico("Serviço enviado ao técnico! Status: Pendente.");
      void carregarServicosFuncionario();
    } catch (e) {
      setMensagemServico(`Erro ao enviar: ${erroTexto(e)}`);
    } finally {
      setEnviandoServico(false);
    }
  }


  const [tituloInfo, setTituloInfo] = useState("");
  const [conteudoInfo, setConteudoInfo] = useState("");
  const [editandoInfo, setEditandoInfo] = useState<string | null>(null);

  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const destinoFotoRef = useRef<"produto" | "variacao">("produto");

  const admin = perfil === "admin";
  const funcionario = perfil === "funcionario";

  async function carregarPerfil(id: string): Promise<Perfil> {
    const { data, error } = await supabase
      .from("perfis")
      .select("perfil")
      .eq("usuario_id", id)
      .single();

    if (error || !data) {
      throw new Error("Usuário sem perfil autorizado.");
    }

    if (
  data.perfil !== "admin" &&
  data.perfil !== "funcionario" &&
  data.perfil !== "tecnico"
) {
  throw new Error("Perfil inválido.");
    }

    return data.perfil;
  }

  async function carregarEstoque() {
    const [p, v] = await Promise.all([
      supabase.from("estoque_produtos").select("*").order("modelo"),
      supabase.from("estoque_variacoes").select("*").order("nome"),
    ]);

    if (p.error) throw p.error;
    if (v.error) throw v.error;

    setProdutos((p.data || []) as Produto[]);
    setVariacoes((v.data || []) as Variacao[]);
  }

  async function carregarManuais() {
    const { data, error } = await supabase.from("pedidos_manuais")
      .select("*").order("created_at", { ascending: false });
    if (error) throw error;
    setManuais((data || []) as PedidoManual[]);
  }

  async function salvarManual() {
    if (!funcionario || ocupado) return;
    const q = inteiro(formManual.quantidade);
    if (!q || q < 1) { alert("Informe uma quantidade maior que zero."); return; }
    if (formManual.categoria === "Outros" && !formManual.nome_produto.trim()) {
      alert("Informe o nome do produto."); return;
    }
    if (formManual.categoria !== "Outros" && (!formManual.marca || !formManual.modelo.trim())) {
      alert("Informe a marca e o modelo."); return;
    }
    if (formManual.categoria === "Películas" && !formManual.tipo.trim()) {
      alert("Digite o tipo de película."); return;
    }
    setOcupado(true);
    try {
      const { error } = await supabase.from("pedidos_manuais").insert({
        categoria: formManual.categoria,
        marca: formManual.marca.trim() || null,
        modelo: formManual.modelo.trim() || null,
        nome_produto: formManual.categoria === "Outros" ? formManual.nome_produto.trim() : null,
        publico: formManual.categoria === "Capas" ? formManual.publico : null,
        tipo: formManual.categoria === "Outros" ? null : formManual.tipo.trim(),
        descricao: formManual.categoria === "Outros" ? formManual.descricao.trim() : null,
        quantidade: q,
        status: "pendente",
      });
      if (error) throw error;
      await carregarManuais();
      setFormManual(manualVazio());
      setMostrarManual(false);
      alert("Pedido manual cadastrado!");
    } catch (e) { alert(erroTexto(e)); }
    finally { setOcupado(false); }
  }

  async function carregarEspeciais() {
    const { data, error } = await supabase
      .from("pedidos_especiais")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setEspeciais((data || []) as Especial[]);
  }

  async function carregarPecas() {
    const { data, error } = await supabase
      .from("pecas_precos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setPecas(((data || []) as Peca[]).map((p) => ({ ...p, tipo_peca: padronizarTipoPeca(p.tipo_peca) })));
  }

  async function carregarInformacoes() {
    const { data, error } = await supabase
      .from("informacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setInformacoes((data || []) as Informacao[]);
  }

  async function atualizarTudo() {
    const resultados = await Promise.allSettled([
      carregarEstoque(),
      carregarManuais(),
      carregarEspeciais(),
      carregarPecas(),
      carregarInformacoes(),
    ]);

    resultados.forEach((r) => {
      if (r.status === "rejected") console.error(r.reason);
    });
  }

  useEffect(() => {
    let ativo = true;

    async function verificar() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) return;

        const encontrado = await carregarPerfil(data.user.id);

        if (!ativo) return;

        setPerfil(encontrado);
        setLogado(true);

        await atualizarTudo();
      } catch (erro) {
        console.error(erro);
      } finally {
        if (ativo) setVerificando(false);
      }
    }

    void verificar();

    return () => {
      ativo = false;
    };
  }, []);

  async function entrar() {
    if (!usuario.trim() || !senha) {
      alert("Informe usuário e senha.");
      return;
    }

    setEntrando(true);

    try {
      const nome = usuario.trim().toLowerCase().replace(/^@/, "");

      let email = usuario.trim();

      if (nome === "admin") email = EMAIL_ADMIN;
      if (nome === "funcionario") email = EMAIL_FUNCIONARIO;
      if (nome === "tecnico") email = "tecnico@marcosmagazine.com.br";

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data.user) {
        throw new Error("Usuário ou senha incorretos.");
      }

      let encontrado: Perfil;

      try {
        encontrado = await carregarPerfil(data.user.id);
      } catch (erro) {
        await supabase.auth.signOut();
        throw erro;
      }

      setPerfil(encontrado);
      setLogado(true);
      setTela("inicio");
      setSenha("");

      await atualizarTudo();
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setLogado(false);
    setPerfil("");
    setUsuario("");
    setSenha("");
    setTela("inicio");
    setMenuAberto(false);
    setProdutos([]);
    setVariacoes([]);
    setEspeciais([]);
    setManuais([]);
    setPecas([]);
    setInformacoes([]);
  }

  function navegar(destino: Tela) {
    setTela(destino);
    setMenuAberto(false);
    setProdutoAbertoId(null);
    setMostrarVariacao(false);
    setMostrarProduto(false);
    setRascunhos({});

    window.scrollTo(0, 0);

    if (destino === "estoque" || destino === "pedidos") {
      void carregarEstoque().catch((e) => alert(erroTexto(e)));
    }
    if (destino === "pedidos") {
      void carregarManuais().catch((e) => alert(erroTexto(e)));
    }

    if (destino === "pedidos_especiais") {
      void carregarEspeciais().catch((e) => alert(erroTexto(e)));
    }

    if (destino === "acompanhar_servicos") void carregarServicosFuncionario();

    if (destino === "pecas") {
      void carregarPecas().catch((e) => alert(erroTexto(e)));
    }

    if (destino === "informacoes") {
      void carregarInformacoes().catch((e) => alert(erroTexto(e)));
    }
  }

  function escolherFoto(
    destino: "produto" | "variacao",
    origem: "camera" | "galeria"
  ) {
    if (!funcionario || enviandoFoto) return;

    destinoFotoRef.current = destino;

    if (origem === "camera") {
      if (cameraRef.current) cameraRef.current.value = "";
      cameraRef.current?.click();
    } else {
      if (galeriaRef.current) galeriaRef.current.value = "";
      galeriaRef.current?.click();
    }
  }

  async function receberFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo || !funcionario) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha uma imagem válida.");
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setEnviandoFoto(true);

    try {
      const extensao = (arquivo.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const caminho = `estoque/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extensao || "jpg"}`;

      const { error } = await supabase.storage
        .from("estoque-fotos")
        .upload(caminho, arquivo, {
          contentType: arquivo.type || "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("estoque-fotos")
        .getPublicUrl(caminho);

      if (destinoFotoRef.current === "produto") {
        setFormProduto((a) => ({
          ...a,
          imagem_url: data.publicUrl,
        }));
      } else {
        setFormVariacao((a) => ({
          ...a,
          imagem_url: data.publicUrl,
        }));
      }

      alert("Foto enviada! Agora salve o cadastro.");
    } catch (erro) {
      alert("Erro ao enviar foto: " + erroTexto(erro));
    } finally {
      setEnviandoFoto(false);
      evento.target.value = "";
    }
  }
const [abrirGaleria, setAbrirGaleria] = useState(false);
  const produtoAberto =
    produtos.find((p) => p.id === produtoAbertoId) || null;

  const produtosFiltrados = useMemo(
    () =>
      produtos
        .filter(
          (p) =>
            p.ativo &&
            p.categoria === categoria &&
            (!marcaFiltro ||
              normalizar(p.marca) === normalizar(marcaFiltro)) &&
            normalizar(`${p.marca} ${p.modelo}`).includes(normalizar(busca))
        )
        .sort((a, b) => {
          const porMarca = a.marca.localeCompare(b.marca, "pt-BR", {
            sensitivity: "base",
          });
          if (porMarca !== 0) return porMarca;

          // "11 Pro Max" e "iPhone 11" devem ficar juntos na ordem numérica.
          const nomeA = normalizar(a.modelo).replace(/^iphone\s*/, "");
          const nomeB = normalizar(b.modelo).replace(/^iphone\s*/, "");
          return nomeA.localeCompare(nomeB, "pt-BR", {
            numeric: true,
            sensitivity: "base",
          });
        }),
    [produtos, categoria, marcaFiltro, busca]
  );

  // Lista compacta de películas; a quantidade representa o estoque atual.
  const tiposDePeliculas = useMemo(() => {
    const ids = new Set(produtos.filter(p => p.ativo && p.categoria === "Películas").map(p => p.id));
    const tipos = new Set(variacoes.filter(v => ids.has(v.produto_id)).map(v => tipoDaPelicula(v.nome)));
    const preferencia = ["3D", "3D Privativa", "3D Fosca", "9D", "9D Fosca", "9D Privativa", "9D Fosca Privativa", "Película Traseira"];
    return [...tipos].sort((a, b) => {
      const ia = preferencia.indexOf(a), ib = preferencia.indexOf(b);
      if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
    });
  }, [produtos, variacoes]);

  const tipoPeliculasAtivo = tiposDePeliculas.includes(tipoPeliculas)
    ? tipoPeliculas
    : (tiposDePeliculas[0] || "");

  const marcasDePeliculas = useMemo(() =>
    [...new Set(produtos.filter(p => p.ativo && p.categoria === "Películas").map(marcaDaPelicula))]
      .sort(compararMarcasPeliculas), [produtos]);

  const linhasDePeliculas = useMemo(
    () => montarLinhasPeliculas(produtos, variacoes, marcaPeliculas, tipoPeliculasAtivo),
    [produtos, variacoes, marcaPeliculas, tipoPeliculasAtivo]
  );

  const variacoesProduto = variacoes.filter(
    (v) => v.produto_id === produtoAbertoId
  );

  const variacoesVisiveis = variacoesProduto.filter(
    (v) =>
      produtoAberto?.categoria === "Películas" ||
      v.publico === publicoFiltro
  );

  const pedidos = variacoes
    .filter((v) => Number(v.quantidade_comprar) > 0)
    .sort((a, b) => {
      const aFeito = a.status_pedido === "pedido_feito" ? 1 : 0;
      const bFeito = b.status_pedido === "pedido_feito" ? 1 : 0;

      if (aFeito !== bFeito) return aFeito - bFeito;

      const nomeA = produtos.find((p) => p.id === a.produto_id)?.modelo || "";
      const nomeB = produtos.find((p) => p.id === b.produto_id)?.modelo || "";

      return nomeA.localeCompare(nomeB, "pt-BR", { numeric: true });
    });

  const pendentes = pedidos.filter(
    (v) => v.status_pedido !== "pedido_feito"
  );

  const comprados = pedidos.filter(
    (v) => v.status_pedido === "pedido_feito"
  );

  

  const manuaisPendentes = manuais.filter(m => m.status === "pendente");
  const manuaisFeitos = manuais.filter(m => m.status === "pedido_feito");
  // A lista de envio reúne somente itens pendentes, inclusive pedidos manuais.
  const tiposPedidoLista = Array.from(new Set([
    ...tiposDePeliculas,
    ...manuaisPendentes.filter(m => m.categoria === "Películas" && m.tipo?.trim()).map(m => tipoDaPelicula(m.tipo || "")),
  ])).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const tipoPedidoAtivo = tiposPedidoLista.includes(tipoPedidoLista) ? tipoPedidoLista : (tiposPedidoLista[0] || "");
  const itensListaPedido = [
    ...pendentes.flatMap(v => {
      const p = produtos.find(item => item.id === v.produto_id);
      if (!p || p.categoria !== categoriaPedidoLista) return [];
      if (p.categoria === "Películas" && tipoDaPelicula(v.nome) !== tipoPedidoAtivo) return [];
      return [{ id: `v-${v.id}`, marca: p.marca, modelo: p.modelo, detalhe: p.categoria === "Capas" ? [v.nome, v.publico].filter(Boolean).join(" — ") : "", quantidade: Number(v.quantidade_comprar || 0) }];
    }),
    ...manuaisPendentes.filter(m => m.categoria === categoriaPedidoLista && (m.categoria !== "Películas" || tipoDaPelicula(m.tipo || "") === tipoPedidoAtivo))
      .map(m => ({ id: `m-${m.id}`, marca: m.marca || "", modelo: m.modelo || m.nome_produto || "Item", detalhe: m.categoria === "Capas" ? [m.publico, m.tipo].filter(Boolean).join(" — ") : "", quantidade: Number(m.quantidade || 0) })),
  ].sort((a, b) => a.marca.localeCompare(b.marca, "pt-BR") || a.modelo.localeCompare(b.modelo, "pt-BR", { numeric: true }));
  function enviarListaPedidosWhatsApp() {
    if (!itensListaPedido.length) return;
    const titulo = categoriaPedidoLista === "Películas" ? `PELÍCULAS ${tipoPedidoAtivo}` : "CAPAS";
    const linhas = [`*PEDIDO DE ${titulo.toUpperCase()}*`];
    let marca = "";
    for (const item of itensListaPedido) {
      if (item.marca !== marca) { marca = item.marca; if (marca) linhas.push("", `*${marca}*`); }
      linhas.push(`• ${item.modelo}${item.detalhe ? ` — ${item.detalhe}` : ""} — ${item.quantidade} un.`);
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  const totalComprar = pedidos.reduce(
    (s, v) => s + Number(v.quantidade_comprar || 0), 0
  ) + manuais.filter(m => m.status !== "recebido")
    .reduce((s, m) => s + Number(m.quantidade || 0), 0);

  function totalPublico(itens: Variacao[], publico: Publico) {
    return itens
      .filter((v) => v.publico === publico)
      .reduce((s, v) => s + Number(v.quantidade || 0), 0);
  }

  function limparProduto() {
    setFormProduto(produtoVazio(categoria));
    setEditandoProduto(null);
    setMostrarProduto(false);
  }

  function limparVariacao() {
    setFormVariacao(variacaoVazia());
    setEditandoVariacao(null);
    setMostrarVariacao(false);
  }

  function abrirProduto(p: Produto) {
    setProdutoAbertoId(p.id);
    setAbrirGaleria(p.categoria === "Capas");
    setPublicoFiltro("Feminino");
    setRascunhos({});
    limparVariacao();
    setMostrarProduto(false);
    window.scrollTo(0, 0);
  }

  function abrirCadastroPelicula(produto?: Produto) {
    const tipo = tipoPeliculasAtivo || "3D";
    const cadastradas = produto ? variacoes.filter(v => v.produto_id === produto.id) : [];
    setProdutoPeliculaId(produto?.id || null);
    setFormPelicula({
      marca: produto?.marca || (marcaPeliculas !== "Todas" ? marcaPeliculas : ""),
      modelo: produto?.modelo || "",
      itens: cadastradas.length
        ? cadastradas.map(v => ({ tipo: tipoDaPelicula(v.nome), quantidade: String(v.quantidade ?? 0) }))
        : [{ tipo, quantidade: "0" }],
    });
    setMostrarCadastroPelicula(true);
    window.scrollTo(0, 0);
  }

  async function salvarPeliculaCompleta() {
    if (!funcionario || ocupado || salvandoPelicula.current) return;
    if (!formPelicula.marca.trim() || !formPelicula.modelo.trim()) {
      alert("Informe a marca e o modelo.");
      return;
    }
    const itens = formPelicula.itens.map(item => ({ tipo: tipoDaPelicula(item.tipo.trim()), quantidade: inteiro(item.quantidade) }));
    if (!itens.length || formPelicula.itens.some(item => !item.tipo.trim())) {
      alert("Informe o tipo de película em todas as linhas.");
      return;
    }
    if (itens.some(item => item.quantidade === null)) {
      alert("Informe quantidades inteiras iguais ou maiores que zero.");
      return;
    }
    if (new Set(itens.map(item => normalizar(item.tipo))).size !== itens.length) {
      alert("Há tipos repetidos. Use uma linha para cada tipo de película.");
      return;
    }
    salvandoPelicula.current = true;
    setOcupado(true);
    let salvos = 0;
    try {
      let produto = produtos.find(p => p.ativo && p.categoria === "Películas" &&
        (produtoPeliculaId ? p.id === produtoPeliculaId :
          normalizar(p.marca) === normalizar(formPelicula.marca) && chaveModeloPeliculas(p.modelo) === chaveModeloPeliculas(formPelicula.modelo)));
      if (!produto) {
        const { data, error } = await supabase.from("estoque_produtos").insert({
          categoria: "Películas", marca: formPelicula.marca.trim(), modelo: formPelicula.modelo.trim(), ativo: true, imagem_url: null,
        }).select("*");
        if (error) throw error;
        if (!data?.length) throw new Error("Não foi possível salvar o modelo. Confira sua permissão de cadastro.");
        produto = data[0] as Produto;
        const salvo = produto;
        setProdutos(atuais => [...atuais.filter(p => p.id !== salvo.id), salvo]);
        setProdutoPeliculaId(produto.id);
      }
      const produtoId = produto.id;
      // Consulta atual permite retomar uma tentativa interrompida sem repetir tipos.
      const consulta = await supabase.from("estoque_variacoes").select("*").eq("produto_id", produtoId);
      if (consulta.error) throw consulta.error;
      const cadastradas = (consulta.data || []) as Variacao[];
      const novas: { produto_id: string; nome: string; publico: Publico; quantidade: number; quantidade_comprar: number; status_pedido: string; imagem_url: null; updated_at: string }[] = [];
      for (const item of itens) {
        const existente = cadastradas.find(v => normalizar(tipoDaPelicula(v.nome)) === normalizar(item.tipo));
        if (existente) {
          // Altera apenas o estoque; mantém pedidos e demais dados desta variação.
          const resposta = await supabase.from("estoque_variacoes").update({ quantidade: item.quantidade!, updated_at: new Date().toISOString() }).eq("id", existente.id).select("*");
          if (resposta.error) throw resposta.error;
          if (!resposta.data?.length) throw new Error(`Não foi possível salvar ${item.tipo}.`);
          const salva = resposta.data[0] as Variacao;
          setVariacoes(atuais => [...atuais.filter(v => v.id !== salva.id), salva]);
          salvos++;
        } else {
          novas.push({ produto_id: produtoId, nome: item.tipo, publico: "Unissex", quantidade: item.quantidade!, quantidade_comprar: 0, status_pedido: "pendente", imagem_url: null, updated_at: new Date().toISOString() });
        }
      }
      if (novas.length) {
        const resposta = await supabase.from("estoque_variacoes").insert(novas).select("*");
        if (resposta.error) throw resposta.error;
        if (!resposta.data || resposta.data.length !== novas.length) throw new Error("Não foi possível confirmar todos os tipos. Tente salvar novamente.");
        const novasSalvas = resposta.data as Variacao[];
        const ids = new Set(novasSalvas.map(v => v.id));
        setVariacoes(atuais => [...atuais.filter(v => !ids.has(v.id)), ...novasSalvas]);
        salvos += novasSalvas.length;
      }
      setMarcaPeliculas(marcaDaPelicula(produto));
      const primeira = cadastradas.find(v => normalizar(tipoDaPelicula(v.nome)) === normalizar(itens[0].tipo));
      setTipoPeliculas(primeira ? tipoDaPelicula(primeira.nome) : itens[0].tipo);
      setMostrarCadastroPelicula(false);
      setProdutoPeliculaId(null);
      alert(`${salvos} tipo(s) de película salvo(s)!`);
    } catch (erro) {
      alert((salvos ? "Alguns tipos foram salvos. Mantenha o formulário e toque em salvar novamente para concluir. " : "Não foi possível concluir o cadastro. ") + erroTexto(erro));
    } finally {
      salvandoPelicula.current = false;
      setOcupado(false);
    }
  }

  async function salvarProduto() {
    if (!funcionario || ocupado || enviandoFoto) return;

    if (!formProduto.marca.trim() || !formProduto.modelo.trim()) {
      alert("Informe a marca e o modelo.");
      return;
    }

    if (!editandoProduto && formProduto.categoria === "Películas") {
      const existente = produtos.find(p => p.ativo && p.categoria === "Películas" && normalizar(p.marca) === normalizar(formProduto.marca) && chaveModeloPeliculas(p.modelo) === chaveModeloPeliculas(formProduto.modelo));
      if (existente) {
        abrirProduto(existente);
        setFormVariacao({ ...variacaoVazia(), nome: tipoPeliculasAtivo });
        setMostrarVariacao(true);
        return;
      }
    }
    setOcupado(true);

    try {
      const dados = {
        categoria: formProduto.categoria,
        marca: formProduto.marca.trim(),
        modelo: formProduto.modelo.trim(),
        imagem_url:
          formProduto.categoria === "Películas"
            ? null
            : formProduto.imagem_url.trim() || null,
      };

      const resposta = editandoProduto
        ? await supabase
            .from("estoque_produtos")
            .update(dados)
            .eq("id", editandoProduto)
            .select("*")
        : await supabase
            .from("estoque_produtos")
            .insert({ ...dados, ativo: true })
            .select("*");

      if (resposta.error) throw resposta.error;
      if (!resposta.data?.length) {
        throw new Error("Gravação não autorizada.");
      }

      const salvo = resposta.data[0] as Produto;
      setProdutos(atuais => [...atuais.filter(p => p.id !== salvo.id), salvo]);
      setCategoria(dados.categoria);
      limparProduto();
      if (dados.categoria === "Películas") {
        setMarcaPeliculas(marcaDaPelicula(salvo));
        abrirProduto(salvo);
        setFormVariacao({ ...variacaoVazia(), nome: tipoPeliculasAtivo });
        setMostrarVariacao(true);
        alert("Modelo salvo! Agora informe o tipo de película e a quantidade e toque em Salvar item.");
      } else {
        alert("Modelo salvo!");
      }
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  function editarProduto(p: Produto) {
    if (!funcionario) return;

    setEditandoProduto(p.id);
    setFormProduto({
      categoria: p.categoria,
      marca: p.marca,
      modelo: p.modelo,
      imagem_url: p.imagem_url || "",
    });

    setMostrarProduto(true);
    setProdutoAbertoId(null);
    window.scrollTo(0, 0);
  }

  async function excluirProduto(p: Produto) {
    if (!funcionario) return;

    if (!confirm(`Excluir ${p.modelo} e suas variações?`)) return;

    try {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .delete()
        .eq("id", p.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada.");

      setProdutoAbertoId(null);
      await carregarEstoque();
    } catch (erro) {
      alert(erroTexto(erro));
    }
  }

  async function salvarVariacao() {
    if (!funcionario || !produtoAberto || ocupado || enviandoFoto) return;

    const quantidade = inteiro(formVariacao.quantidade);
    const comprar = inteiro(formVariacao.quantidade_comprar);

    if (!formVariacao.nome.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    if (quantidade === null || comprar === null) {
      alert("Informe quantidades inteiras válidas.");
      return;
    }

    setOcupado(true);

    try {
      const anterior = variacoes.find(
        (v) => v.id === editandoVariacao
      );

      const dados = {
        produto_id: produtoAberto.id,
        nome: formVariacao.nome.trim(),
        publico:
          produtoAberto.categoria === "Películas"
            ? ("Unissex" as Publico)
            : formVariacao.publico,
        quantidade,
        quantidade_comprar: comprar,
        imagem_url:
          produtoAberto.categoria === "Películas"
            ? null
            : formVariacao.imagem_url.trim() || null,
        status_pedido:
          comprar === 0
            ? "pendente"
            : anterior?.status_pedido === "pedido_feito" &&
              comprar === Number(anterior.quantidade_comprar)
            ? "pedido_feito"
            : "pendente",
        updated_at: new Date().toISOString(),
      };

      const resposta = editandoVariacao
        ? await supabase
            .from("estoque_variacoes")
            .update(dados)
            .eq("id", editandoVariacao)
            .select("id")
        : await supabase
            .from("estoque_variacoes")
            .insert(dados)
            .select("id");

      if (resposta.error) throw resposta.error;
      if (!resposta.data?.length) {
        throw new Error("Gravação não autorizada.");
      }

      if (produtoAberto.categoria === "Películas") {
        setTipoPeliculas(tipoDaPelicula(dados.nome));
        setMarcaPeliculas(marcaDaPelicula(produtoAberto));
      }
      limparVariacao();
      setRascunhos({});
      await carregarEstoque();

      alert("Item salvo!");
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  function editarVariacao(v: Variacao) {
    if (!funcionario) return;

    setEditandoVariacao(v.id);
    setFormVariacao({
      nome: v.nome,
      publico: v.publico,
      quantidade: String(v.quantidade),
      quantidade_comprar: String(v.quantidade_comprar),
      imagem_url: v.imagem_url || "",
    });

    setMostrarVariacao(true);
  }

  async function excluirVariacao(v: Variacao) {
    if (!funcionario || !confirm(`Excluir ${v.nome}?`)) return;

    try {
      const { data, error } = await supabase
        .from("estoque_variacoes")
        .delete()
        .eq("id", v.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada.");

      limparVariacao();
      await carregarEstoque();
    } catch (erro) {
      alert(erroTexto(erro));
    }
  }

  function alterarRascunho(
    v: Variacao,
    campo: keyof Quantidades,
    valor: string
  ) {
    setRascunhos((a) => ({
      ...a,
      [v.id]: {
        quantidade: a[v.id]?.quantidade ?? String(v.quantidade),
        quantidade_comprar:
          a[v.id]?.quantidade_comprar ??
          String(v.quantidade_comprar),
        [campo]: valor,
      },
    }));
  }

  async function salvarQuantidades() {
    if (!funcionario || ocupado) return;

    const entradas = Object.entries(rascunhos);

    if (!entradas.length) {
      alert("Nenhuma quantidade foi alterada.");
      return;
    }

    for (const [, valores] of entradas) {
      if (
        inteiro(valores.quantidade) === null ||
        inteiro(valores.quantidade_comprar) === null
      ) {
        alert("Informe quantidades inteiras válidas.");
        return;
      }
    }

    setOcupado(true);

    try {
      for (const [id, valores] of entradas) {
        const anterior = variacoes.find((v) => v.id === id);
        if (!anterior) continue;

        const comprar = inteiro(valores.quantidade_comprar)!;

        const { data, error } = await supabase
          .from("estoque_variacoes")
          .update({
            quantidade: inteiro(valores.quantidade)!,
            quantidade_comprar: comprar,
            status_pedido:
              comprar === 0
                ? "pendente"
                : comprar === Number(anterior.quantidade_comprar)
                ? anterior.status_pedido
                : "pendente",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          throw new Error("Atualização não autorizada.");
        }
      }

      setRascunhos({});
      await carregarEstoque();

      alert("Estoque atualizado!");
    } catch (erro) {
      alert("Erro ao atualizar: " + erroTexto(erro));
      await carregarEstoque();
    } finally {
      setOcupado(false);
    }
  }

  async function marcarPedidosFeitos() {
    if (!funcionario || ocupado) return;

    const ids = selecionados.filter((id) =>
      pendentes.some((v) => v.id === id)
    );

    const manuaisIds = selecionados.filter(id => manuaisPendentes.some(m => m.id === id));
    if (!ids.length && !manuaisIds.length) {
      alert("Selecione pedidos pendentes.");
      return;
    }

    if (!confirm(`Marcar ${ids.length + manuaisIds.length} item(ns) como pedidos feitos?`)) {
      return;
    }

    setOcupado(true);

    try {
      const { data, error } = ids.length ? await supabase
        .from("estoque_variacoes")
        .update({
          status_pedido: "pedido_feito",
          updated_at: new Date().toISOString(),
        })
        .in("id", ids)
        .select("id") : { data: [], error: null };

      if (error) throw error;
      if (data?.length !== ids.length) {
        throw new Error("Nem todos os pedidos foram atualizados.");
      }
      if (manuaisIds.length) {
        const { data: dm, error: em } = await supabase.from("pedidos_manuais")
          .update({ status: "pedido_feito" }).in("id", manuaisIds)
          .eq("status", "pendente").select("id");
        if (em) throw em;
        if ((dm || []).length !== manuaisIds.length) throw new Error("Alguns pedidos manuais não foram atualizados.");
      }

      setSelecionados([]);
      await Promise.all([carregarEstoque(), carregarManuais()]);

      alert("Pedidos marcados como feitos!");
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarChegada() {
    if (!funcionario || ocupado) return;

    const ids = selecionados.filter((id) =>
      comprados.some((v) => v.id === id)
    );

    const manuaisIds = selecionados.filter(id => manuaisFeitos.some(m => m.id === id));
    if (!ids.length && !manuaisIds.length) {
      alert("Selecione pedidos já realizados.");
      return;
    }

    if (
      !confirm(
        `Os ${ids.length + manuaisIds.length} item(ns) selecionados chegaram?\n\n` +
          "OK = Sim, chegaram.\n" +
          "Cancelar = Não, manter na lista."
      )
    ) {
      return;
    }

    setOcupado(true);

    try {
      for (const id of ids) {
        const v = variacoes.find((item) => item.id === id);
        if (!v) continue;

        const { data, error } = await supabase
          .from("estoque_variacoes")
          .update({
            quantidade:
              Number(v.quantidade) + Number(v.quantidade_comprar),
            quantidade_comprar: 0,
            status_pedido: "pendente",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("quantidade", v.quantidade)
          .eq("quantidade_comprar", v.quantidade_comprar)
          .eq("status_pedido", "pedido_feito")
          .select("id");

        if (error) throw error;

        if (!data?.length) {
          throw new Error(
            "Um pedido foi alterado. Atualize a lista antes de continuar."
          );
        }
      }

      if (manuaisIds.length) {
        const { data: dm, error: em } = await supabase.from("pedidos_manuais")
          .update({ status: "recebido" }).in("id", manuaisIds)
          .eq("status", "pedido_feito").select("id");
        if (em) throw em;
        if ((dm || []).length !== manuaisIds.length) throw new Error("Alguns pedidos manuais não foram atualizados.");
      }
      setSelecionados([]);
      await Promise.all([carregarEstoque(), carregarManuais()]);

      alert(manuaisIds.length
        ? "Recebimento confirmado! Os itens automáticos entraram no estoque. Lance manualmente no estoque os itens de pedidos manuais."
        : "Produtos recebidos e adicionados ao estoque!");
    } catch (erro) {
      alert(
        "Não foi possível concluir todos os recebimentos: " +
          erroTexto(erro)
      );
      await carregarEstoque();
    } finally {
      setOcupado(false);
    }
  }

  async function salvarEspecial() {
    if (!funcionario || ocupado) return;

    if (Object.values(formEspecial).some((v) => !v.trim())) {
      alert("Preencha todos os campos.");
      return;
    }

    setOcupado(true);

    try {
      const { data, error } = await supabase
        .from("pedidos_especiais")
        .insert({
          ...formEspecial,
          status: "pendente",
        })
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Cadastro não autorizado.");

      setFormEspecial(especialVazio());
      setMostrarEspecial(false);
      await carregarEspeciais();

      alert("Pedido especial cadastrado!");
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function atualizarEspecial(
    p: Especial,
    status: StatusEspecial
  ) {
    if (!funcionario || ocupado) return;

    if (!confirm("Confirmar alteração do pedido?")) return;

    setOcupado(true);

    try {
      const { data, error } = await supabase
        .from("pedidos_especiais")
        .update({ status })
        .eq("id", p.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Atualização não autorizada.");

      await carregarEspeciais();
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function excluirEspecial(p: Especial) {
    if (!funcionario || ocupado) return;

    if (!confirm(`Apagar o pedido de ${p.nome_cliente}?`)) return;

    setOcupado(true);

    try {
      const { data, error } = await supabase
        .from("pedidos_especiais")
        .delete()
        .eq("id", p.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada.");

      await carregarEspeciais();
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  // A lista de tipos é fixa; os demais filtros usam dados reais do Supabase.
  function chaveTipoPeca(valor: string) {
    const chave = normalizar(padronizarTipoPeca(valor)).replace(/[^a-z0-9]/g, "");
    if (chave === "outros") return "outro";
    return chave;
  }

  function opcoesUnicasPecas(valores: string[]) {
    const unicos = new Map<string, string>();
    for (const valor of valores) {
      if (valor?.trim() && !unicos.has(normalizar(valor))) {
        unicos.set(normalizar(valor), valor.trim());
      }
    }
    return [...unicos.values()].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
    );
  }

  const marcasDisponiveisPecas = useMemo(
    () => opcoesUnicasPecas(
      pecas
        .filter((p) => !tipoPeca || chaveTipoPeca(p.tipo_peca) === chaveTipoPeca(tipoPeca))
        .map((p) => p.marca)
    ),
    [pecas, tipoPeca]
  );

  const modelosPecas = useMemo(
    () => opcoesUnicasPecas(
      pecas
        .filter((p) =>
          (!tipoPeca || chaveTipoPeca(p.tipo_peca) === chaveTipoPeca(tipoPeca)) &&
          (!marcaPeca || normalizar(p.marca) === normalizar(marcaPeca))
        )
        .map((p) => p.modelo)
    ),
    [pecas, tipoPeca, marcaPeca]
  );

  const qualidadesPecas = useMemo(
    () => opcoesUnicasPecas(
      pecas
        .filter((p) =>
          (!tipoPeca || chaveTipoPeca(p.tipo_peca) === chaveTipoPeca(tipoPeca)) &&
          (!marcaPeca || normalizar(p.marca) === normalizar(marcaPeca)) &&
          (!modeloPeca || normalizar(p.modelo) === normalizar(modeloPeca))
        )
        .map((p) => p.qualidade)
    ),
    [pecas, tipoPeca, marcaPeca, modeloPeca]
  );

  const resultadosPecas = useMemo(
    () => pecas
      .filter((p) =>
        chaveTipoPeca(p.tipo_peca) === chaveTipoPeca(tipoPeca) &&
        normalizar(p.marca) === normalizar(marcaPeca) &&
        normalizar(p.modelo) === normalizar(modeloPeca) &&
        (!qualidadePeca || normalizar(p.qualidade) === normalizar(qualidadePeca))
      )
      .sort((a, b) => Number(a.valor_final) - Number(b.valor_final)),
    [pecas, tipoPeca, marcaPeca, modeloPeca, qualidadePeca]
  );

  const podeExibirResultadosPecas =
    Boolean(tipoPeca && marcaPeca && modeloPeca && pesquisouPecas);

  const listaPecas =
    secaoPecas === "todos"
      ? pecas
      : secaoPecas === "consultar" && podeExibirResultadosPecas
      ? resultadosPecas
      : [];

  const totalPaginasPecas = Math.max(
    1,
    Math.ceil(listaPecas.length / 8)
  );

  const pecasPagina = listaPecas.slice(
    (paginaPecas - 1) * 8,
    paginaPecas * 8
  );

  function limparPeca() {
    setFormPeca(pecaVazia());
    setEditandoPeca(null);
  }

  async function salvarPeca() {
    if (!admin || ocupado) return;

    const dados = {
      tipo_peca: padronizarTipoPeca(formPeca.tipo_peca),
      marca: formPeca.marca.trim(),
      modelo: formPeca.modelo.trim(),
      qualidade: formPeca.qualidade.trim(),
      valor_custo: numero(formPeca.valor_custo),
      valor_final: numero(formPeca.valor_final),
    };

    if (
      !dados.tipo_peca ||
      !dados.marca ||
      !dados.modelo ||
      !dados.qualidade ||
      !formPeca.valor_custo.trim() ||
      !formPeca.valor_final.trim() ||
      !Number.isFinite(dados.valor_custo) ||
      !Number.isFinite(dados.valor_final) ||
      dados.valor_custo < 0 ||
      dados.valor_final < 0
    ) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    setOcupado(true);

    try {
      const resposta = editandoPeca
        ? await supabase
            .from("pecas_precos")
            .update(dados)
            .eq("id", editandoPeca)
            .select("id")
        : await supabase
            .from("pecas_precos")
            .insert(dados)
            .select("id");

      if (resposta.error) throw resposta.error;
      if (!resposta.data?.length) {
        throw new Error("Gravação não autorizada.");
      }

      limparPeca();
      await carregarPecas();
      setSecaoPecas("todos");
      setPaginaPecas(1);

      alert("Preço salvo!");
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  function editarPeca(p: Peca) {
    if (!admin) return;

    setEditandoPeca(p.id);
    setFormPeca({
      tipo_peca: padronizarTipoPeca(p.tipo_peca),
      marca: p.marca,
      modelo: p.modelo,
      qualidade: p.qualidade,
      valor_custo: String(p.valor_custo),
      valor_final: String(p.valor_final),
    });

    setSecaoPecas("cadastrar");
    window.scrollTo(0, 0);
  }

  async function excluirPeca(p: Peca) {
    if (!admin || !confirm("Excluir este preço?")) return;

    try {
      const { data, error } = await supabase
        .from("pecas_precos")
        .delete()
        .eq("id", p.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada.");

      await carregarPecas();
    } catch (erro) {
      alert(erroTexto(erro));
    }
  }

  function limparInfo() {
    setTituloInfo("");
    setConteudoInfo("");
    setEditandoInfo(null);
  }

  async function salvarInfo() {
    if (!admin || ocupado) return;

    if (!tituloInfo.trim() || !conteudoInfo.trim()) {
      alert("Preencha título e conteúdo.");
      return;
    }

    setOcupado(true);

    try {
      const dados = {
        titulo: tituloInfo.trim(),
        conteudo: conteudoInfo.trim(),
      };

      const resposta = editandoInfo
        ? await supabase
            .from("informacoes")
            .update(dados)
            .eq("id", editandoInfo)
            .select("id")
        : await supabase
            .from("informacoes")
            .insert(dados)
            .select("id");

      if (resposta.error) throw resposta.error;
      if (!resposta.data?.length) {
        throw new Error("Gravação não autorizada.");
      }

      limparInfo();
      await carregarInformacoes();

      alert("Informação salva!");
    } catch (erro) {
      alert(erroTexto(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function excluirInfo(info: Informacao) {
    if (!admin || !confirm("Excluir esta informação?")) return;

    try {
      const { data, error } = await supabase
        .from("informacoes")
        .delete()
        .eq("id", info.id)
        .select("id");

      if (error) throw error;
      if (!data?.length) throw new Error("Exclusão não autorizada.");

      await carregarInformacoes();
    } catch (erro) {
      alert(erroTexto(erro));
    }
  }

  function mudarCategoria(c: Categoria) {
    setCategoria(c);
    setMarcaFiltro("");
    setBusca("");
    setProdutoAbertoId(null);
    setRascunhos({});
    setMostrarProduto(false);
    setTela("estoque");
  }

  function alterarQuantidadeCategoria(
    publico: Publico,
    delta: number
  ) {
    const itens = variacoesProduto.filter(
      (v) => v.publico === publico
    );

    if (!itens.length) {
      alert(
        `Cadastre primeiro uma capinha ${publico.toLowerCase()} ` +
          "para definir o que precisa comprar."
      );
      return;
    }

    if (delta > 0 && itens.length > 1) {
      alert(
        "Para saber exatamente qual capinha comprar, use o botão + " +
          "no item desejado da galeria."
      );
      return;
    }

    const v =
      delta > 0
        ? itens[0]
        : itens.find(
            (item) =>
              Number(
                rascunhos[item.id]?.quantidade_comprar ??
                  item.quantidade_comprar
              ) > 0
          );

    if (!v) return;

    const atual = Number(
      rascunhos[v.id]?.quantidade_comprar ??
        v.quantidade_comprar
    );

    alterarRascunho(
      v,
      "quantidade_comprar",
      String(Math.max(0, atual + delta))
    );
  }

  function pedidosTabela(itens: Variacao[]) {
    return (
      <div
        style={{
          background: "#111722",
          border: "1px solid #263040",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 17,
        }}
      >
        {itens.map((v, i) => {
          const p = produtos.find((x) => x.id === v.produto_id);

          return (
            <label
              key={v.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 10px",
                borderBottom:
                  i < itens.length - 1
                    ? "1px solid #253040"
                    : "none",
                cursor: funcionario ? "pointer" : "default",
                minWidth: 0,
              }}
            >
              <input
                type="checkbox"
                disabled={!funcionario}
                checked={selecionados.includes(v.id)}
                onChange={(e) =>
                  setSelecionados((a) =>
                    e.target.checked
                      ? [...a, v.id]
                      : a.filter((id) => id !== v.id)
                  )
                }
                style={{
                  width: 20,
                  height: 20,
                  accentColor: LARANJA,
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <strong
                  style={{
                    fontSize: 14,
                    display: "block",
                    overflowWrap: "anywhere",
                  }}
                >
                  {p?.modelo || "Modelo não encontrado"}
                </strong>

                <span style={S.pequeno}>
                  {v.nome.replace(/\s*\d{12,17}\s*$/, "").trim()}
                  {p?.categoria !== "Películas"
                    ? ` · ${v.publico}`
                    : ""}
                </span>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                <strong style={{ color: LARANJA, fontSize: 17 }}>
                  {v.quantidade_comprar}
                </strong>

                <div style={{ ...S.pequeno, fontSize: 10 }}>
                  un.
                </div>
              </div>
            </label>
          );
        })}
      </div>
    );
  }

  function tabelaManuais(itens: PedidoManual[]) {
    return (
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        {itens.map((m, i) => (
          <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 10,
            padding: 12, borderBottom: i < itens.length - 1 ? "1px solid #253040" : "none" }}>
            <input type="checkbox" disabled={!funcionario}
              checked={selecionados.includes(m.id)}
              onChange={e => setSelecionados(a => e.target.checked ? [...a, m.id] : a.filter(id => id !== m.id))}
              style={{ width: 20, height: 20, accentColor: LARANJA, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", overflowWrap: "anywhere", fontSize: 14 }}>
                {m.categoria === "Outros" ? m.nome_produto : m.modelo}
              </strong>
              <span style={S.pequeno}>
                {m.categoria} · {[m.marca, m.publico, m.tipo, m.descricao].filter(Boolean).join(" · ")}
              </span>
              <div style={{ ...S.pequeno, color: LARANJA }}>Pedido manual</div>
            </div>
            <strong style={{ color: LARANJA, fontSize: 17 }}>{m.quantidade}</strong>
          </label>
        ))}
      </div>
    );
  }

  if (verificando) {
    return (
      <div style={{ ...S.app, padding: 30, color: LARANJA }}>
        Carregando Marcos Magazine...
      </div>
    );
  }

  if (!logado) {
    return (
      <div
        style={{
          ...S.app,
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <div style={{ width: "100%", maxWidth: 410 }}>
          <div style={{ marginBottom: 30 }}>
            <Logo />
          </div>

          <section style={S.card}>
            <h2 style={{ color: "#FF6500", textAlign: "center" }}>Entrar no App</h2>

            <Campo rotulo="Usuário">
              <input
                style={S.input}
                value={usuario}
                autoComplete="username"
                onChange={(e) => setUsuario(e.target.value)}
              />
            </Campo>

            <Campo rotulo="Senha">
              <input
                style={S.input}
                type="password"
                value={senha}
                autoComplete="current-password"
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void entrar();
                }}
              />
            </Campo>

            <Botao
              disabled={entrando}
              onClick={() => void entrar()}
              style={{ width: "100%" }}
            >
              {entrando ? "Entrando..." : "Entrar"}
            </Botao>
          </section>
        </div>
      </div>
    );
  }

  if (perfil === "tecnico") {
    return <TecnicoApp onSair={sair} />;
  }

  return (
    <div style={S.app}>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void receberFoto(e)}
        style={{ display: "none" }}
      />

      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        onChange={(e) => void receberFoto(e)}
        style={{ display: "none" }}
      />

      <header
  style={{
    ...S.topo,
    display: tela === "inicio" ? "none" : "flex",
  }}
>
        <button
          type="button"
          onClick={() => {
            if (produtoAbertoId) {
              setProdutoAbertoId(null);
              setRascunhos({});
              limparVariacao();
            } else {
              setMenuAberto(!menuAberto);
            }
          }}
          style={{
            border: 0,
            background: "transparent",
            color: "#fff",
            fontSize: produtoAbertoId ? 15 : 25,
            minWidth: 45,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          {produtoAbertoId ? "‹ Voltar" : "☰"}
        </button>

        <Logo />

        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          style={{
            border: 0,
            background: "transparent",
            color: "#ddd",
            fontSize: 11,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ◉ {admin ? "Admin" : "Funcionário"}⌄
        </button>
      </header>

      {menuAberto && (
        <>
          <div
            onClick={() => setMenuAberto(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 30,
              background: "#0009",
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 70,
              left: 10,
              zIndex: 31,
              width: "min(290px,calc(100vw - 20px))",
              background: "#151b26",
              border: "1px solid #303a4a",
              borderRadius: 15,
              padding: 14,
              boxSizing: "border-box",
              boxShadow: "0 15px 40px #000a",
            }}
          >
            <h3 style={{ marginTop: 0, color: LARANJA }}>
              Menu
            </h3>

            <Botao
              variante="secundario"
              onClick={() => navegar("pedidos")}
              style={{ width: "100%", marginBottom: 9 }}
            >
              📋 Pedidos
            </Botao>

            <Botao
              variante="secundario"
              onClick={() => navegar("pedidos_especiais")}
              style={{ width: "100%", marginBottom: 9 }}
            >
              📦 Pedidos especiais
            </Botao>

            {funcionario && (
              <Botao variante="secundario" onClick={() => navegar("acompanhar_servicos")}
                style={{ width: "100%", marginBottom: 9 }}>
                🔧 Acompanhar serviços
              </Botao>
            )}

            <Botao
              variante="perigo"
              onClick={() => void sair()}
              style={{ width: "100%" }}
            >
              🚪 Sair
            </Botao>
          </div>
        </>
      )}

      <main style={S.conteudo}>
        {tela === "inicio" && (
  <TelaInicial
    onAbrirMenu={() => setMenuAberto(true)}
    modelosCadastrados={
      produtos.filter((p) => p.ativo).length
    }
    itensReposicao={
      variacoes.filter(
        (v) => Number(v.quantidade_comprar) > 0
      ).length
    }
    onNavegar={(funcao) => {
      if (funcao === "capinhas") {
        setCategoria("Capas");
        navegar("estoque");
      } else if (funcao === "peliculas") {
        setCategoria("Películas");
        navegar("estoque");
      } else if (funcao === "estoque") {
        setCategoria("Outros");
        navegar("estoque");
      } else if (funcao === "pecas") {
        navegar("pecas");
      } else if (funcao === "informacoes") {
        navegar("informacoes");
      }
    }}
  />
)}

        {tela === "estoque" && !produtoAberto && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 9,
                margin: "14px 0",
              }}
            >
              {CATEGORIAS.map((c) => {
                const ativo = categoria === c && tela === "estoque";

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => mudarCategoria(c)}
                    style={{
                      background: ativo
                        ? "linear-gradient(140deg,#ff6600,#b83d00)"
                        : "#151c28",
                      border: ativo
                        ? "1px solid #ff8a42"
                        : "1px solid #283242",
                      borderRadius: 14,
                      color: "#fff",
                      minHeight: 91,
                      padding: "13px 4px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: ativo ? "0 4px 15px #ff660030" : "none",
                    }}
                  >
                    <span style={{ fontSize: 27 }}>
  {c === "Capas"
    ? "📱"
    : c === "Películas"
    ? "🛡️"
    : "📦"}
</span>

                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      {c}
                    </span>
                  </button>
                );
              })}
            </div>

            {categoria === "Películas" ? (
              <>
                <h2 style={{ margin: "17px 0 12px", fontSize: 23 }}>Películas</h2>
                <section style={S.card}>
                  <Campo rotulo="1. Marca">
                    <select style={S.input} value={marcaPeliculas} onChange={e => setMarcaPeliculas(e.target.value)}>
                      <option value="Todas">Todas as marcas</option>
                      {marcasDePeliculas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Campo>
                  <Campo rotulo="2. Tipo de película">
                    <select style={S.input} value={tipoPeliculasAtivo} onChange={e => setTipoPeliculas(e.target.value)}>
                      {tiposDePeliculas.length === 0 && <option value="">Nenhum tipo cadastrado</option>}
                      {tiposDePeliculas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Campo>
                </section>

                {funcionario && !mostrarCadastroPelicula && (
                  <Botao variante="secundario" onClick={() => abrirCadastroPelicula()} style={{ width: "100%", marginBottom: 14 }}>
                    + Cadastrar película
                  </Botao>
                )}
                {funcionario && mostrarCadastroPelicula && (
                  <section style={S.card}>
                    <h3 style={{ marginTop: 0 }}>{produtoPeliculaId ? "Editar películas" : "Cadastrar películas"}</h3>
                    <Campo rotulo="Marca">
                      <select style={S.input} disabled={ocupado || !!produtoPeliculaId} value={formPelicula.marca} onChange={e => setFormPelicula(f => ({ ...f, marca: e.target.value, modelo: "" }))}>
                        <option value="">Selecione</option>
                        {Array.from(new Set([...MARCAS, "Poco", ...marcasDePeliculas, ...(formPelicula.marca ? [formPelicula.marca] : [])])).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </Campo>
                    <Campo rotulo="Modelo">
                      <input style={S.input} disabled={ocupado} readOnly={!!produtoPeliculaId} value={formPelicula.modelo} list="modelos-cadastro-pelicula" placeholder="Ex.: Note 17" onChange={e => setFormPelicula(f => ({ ...f, modelo: e.target.value }))} />
                      <datalist id="modelos-cadastro-pelicula">
                        {produtos.filter(p => p.ativo && p.categoria === "Películas" && normalizar(p.marca) === normalizar(formPelicula.marca)).map(p => <option key={p.id} value={p.modelo} />)}
                      </datalist>
                    </Campo>
                    {formPelicula.itens.map((item, indice) => (
                      <div key={indice} style={{ borderTop: "1px solid #303744", paddingTop: 12, marginTop: 4 }}>
                        {formPelicula.itens.length > 1 && (
                          <div style={{ ...S.linha, justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={S.pequeno}>Tipo {indice + 1}</span>
                            <button type="button" aria-label={`Remover linha ${indice + 1} do formulário`} disabled={ocupado} onClick={() => setFormPelicula(f => ({ ...f, itens: f.itens.filter((_, i) => i !== indice) }))} style={{ ...S.secundario, minHeight: 40, padding: "8px 10px", fontSize: 12 }}>Remover linha</button>
                          </div>
                        )}
                        <Campo rotulo="Tipo de película">
                          <input style={S.input} disabled={ocupado} value={item.tipo} list="tipos-cadastro-pelicula" placeholder="Ex.: 3D, 9D, Privativa" onChange={e => {
                            const tipo = e.target.value;
                            setFormPelicula(f => ({ ...f, itens: f.itens.map((linha, i) => i === indice ? { ...linha, tipo } : linha) }));
                          }} />
                        </Campo>
                        <Campo rotulo="Quantidade em estoque">
                          <input style={S.input} disabled={ocupado} type="number" min="0" step="1" value={item.quantidade} onChange={e => {
                            const quantidade = e.target.value;
                            setFormPelicula(f => ({ ...f, itens: f.itens.map((linha, i) => i === indice ? { ...linha, quantidade } : linha) }));
                          }} />
                        </Campo>
                      </div>
                    ))}
                    <datalist id="tipos-cadastro-pelicula">
                      {Array.from(new Set(["3D", "9D", ...tiposDePeliculas])).map(t => <option key={t} value={t} />)}
                    </datalist>
                    <Botao variante="secundario" disabled={ocupado} onClick={() => setFormPelicula(f => ({ ...f, itens: [...f.itens, { tipo: "", quantidade: "0" }] }))} style={{ width: "100%", marginBottom: 12, color: LARANJA }}>
                      + Tipo de película e quantidade
                    </Botao>
                    <Botao disabled={ocupado} onClick={() => void salvarPeliculaCompleta()} style={{ width: "100%" }}>
                      {ocupado ? "Salvando..." : "Salvar todas as películas"}
                    </Botao>
                    <Botao variante="secundario" disabled={ocupado} onClick={() => setMostrarCadastroPelicula(false)} style={{ width: "100%", marginTop: 8 }}>Cancelar</Botao>
                  </section>
                )}

                <div style={{ ...S.linha, justifyContent: "space-between", margin: "12px 0" }}>
                  <strong>{tipoPeliculasAtivo ? `Película ${tipoPeliculasAtivo}` : "Películas"}</strong>
                  <span style={S.pequeno}>{linhasDePeliculas.length} modelos</span>
                </div>
                {linhasDePeliculas.length === 0 && (
                  <section style={S.card}>Nenhum modelo cadastrado para estes filtros.</section>
                )}
                {linhasDePeliculas.map((item, index) => (
                  <div
                    key={item.chave}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, padding: "13px 12px", background: index % 2 === 0 ? "#111722" : "#151c27",
                      borderBottom: "1px solid #303744", borderRadius: index === 0 ? "11px 11px 0 0" : 0,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ fontSize: 15, display: "block", overflowWrap: "anywhere" }}>{item.modelo}</strong>
                      {marcaPeliculas === "Todas" && <span style={{ color: "#aab4c1", fontSize: 11 }}>{item.marca}</span>}
                      {item.semTipo && <span style={{ display: "block", color: "#f0bf74", fontSize: 12 }}>Falta cadastrar tipo e quantidade</span>}
                    </div>
                    <strong style={{ color: item.quantidade <= 0 ? "#ff7777" : LARANJA, fontSize: 17, whiteSpace: "nowrap" }}>
                      {item.semTipo ? "—" : `${String(Math.max(0, Math.round(item.quantidade))).padStart(2, "0")}${item.quantidade <= 0 ? "🆘" : ""}`}
                    </strong>
                    <button type="button" disabled={ocupado} onClick={() => abrirCadastroPelicula(item.produto)}
                      aria-label={`Ver ou editar ${item.modelo}`}
                      style={{ ...S.secundario, minHeight: 35, padding: "6px 9px", fontSize: 11 }}>
                      {item.semTipo ? "Completar" : "Editar"}
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 11,
                    fontSize: 20,
                    color: "#9da7b8",
                  }}
                >
                  ⌕
                </span>

                <input
                  style={{
                    ...S.input,
                    paddingLeft: 39,
                  }}
                  value={busca}
                  placeholder="Buscar modelo de celular..."
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setTela("estoque");
                  }}
                />
              </div>

              <Botao
                variante="secundario"
                onClick={() => setFiltroAberto(!filtroAberto)}
                style={{ width: 47, padding: 0, fontSize: 20 }}
              >
                ⚲
              </Botao>
            </div>

            {filtroAberto && (
              <section style={S.card}>
                <Campo rotulo="Filtrar por marca">
                  <select
                    style={S.input}
                    value={marcaFiltro}
                    onChange={(e) => {
                      setMarcaFiltro(e.target.value);
                      setTela("estoque");
                    }}
                  >
                    <option value="">Todas as marcas</option>

                    {MARCAS.map((m) => (
                      <option key={m} value={m}>
                        {m === "Apple" ? "iPhone" : m}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Botao
                  variante="secundario"
                  onClick={() => {
                    setMarcaFiltro("");
                    setBusca("");
                    setFiltroAberto(false);
                  }}
                >
                  Limpar filtros
                </Botao>
              </section>
            )}

            <div
              style={{
                display: "flex",
                gap: 7,
                overflowX: "auto",
                paddingBottom: 9,
                marginBottom: 13,
              }}
            >
              {["", ...MARCAS].map((m) => (
                <button
                  key={m || "todos"}
                  type="button"
                  onClick={() => {
                    setMarcaFiltro(m);
                    setTela("estoque");
                  }}
                  style={{
                    ...S.secundario,
                    background:
                      marcaFiltro === m ? LARANJA : "#151c28",
                    borderColor:
                      marcaFiltro === m ? LARANJA : "#293243",
                    minHeight: 37,
                    padding: "8px 13px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontSize: 12,
                  }}
                >
                  {!m ? "Todos" : m === "Apple" ? "iPhone" : m}
                </button>
              ))}
            </div>

            {funcionario && (
              <Botao
                onClick={() => {
                  if (mostrarProduto) {
                    limparProduto();
                  } else {
                    setFormProduto(produtoVazio(categoria));
                    setEditandoProduto(null);
                    setMostrarProduto(true);
                    setTela("estoque");
                  }
                }}
                style={{ width: "100%", marginBottom: 14 }}
              >
                {mostrarProduto
                  ? "Fechar cadastro"
                  : "+ Cadastrar modelo"}
              </Botao>
            )}

            {mostrarProduto && funcionario && (
              <FormularioProduto
                form={formProduto}
                setForm={setFormProduto}
                editando={!!editandoProduto}
                ocupado={ocupado}
                enviando={enviandoFoto}
                salvar={() => void salvarProduto()}
                cancelar={limparProduto}
                camera={() => escolherFoto("produto", "camera")}
                galeria={() => escolherFoto("produto", "galeria")}
              />
            )}

            <div style={{ ...S.linha, justifyContent: "space-between" }}>
              <h3 style={{ margin: "8px 0 13px" }}>
                {categoria}
              </h3>

              <span style={S.pequeno}>
                {produtosFiltrados.length} modelos
              </span>
            </div>

            {produtosFiltrados.length === 0 && (
              <section style={S.card}>
                Nenhum modelo encontrado.
              </section>
            )}

            {produtosFiltrados.map((p) => {
              const itens = variacoes.filter(
                (v) => v.produto_id === p.id
              );

              const feminino = totalPublico(itens, "Feminino");
              const masculino = totalPublico(itens, "Masculino");
              const unissex = totalPublico(itens, "Unissex");

              const total = itens.reduce(
                (s, v) => s + Number(v.quantidade || 0),
                0
              );

              return (
                <section
                  key={p.id}
                  style={{
                    ...S.card,
                    padding: 11,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => abrirProduto(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") abrirProduto(p);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 82,
                        flexShrink: 0,
                        borderRadius: 11,
                        overflow: "hidden",
                        background: "#202938",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {p.categoria !== "Películas" && p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.modelo}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 31 }}>
                          {p.categoria === "Películas" ? "▯" : "📱"}
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 15,
                          marginBottom: 7,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {p.modelo}
                      </strong>

                      {p.categoria === "Películas" ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          {itens.map((v) => (
                            <span
                              key={v.id}
                              style={{
                                fontSize: 11,
                                color: "#bec8d8",
                              }}
                            >
                              {v.nome}:{" "}
                              <b style={{ color: LARANJA }}>
                                {v.quantidade}
                              </b>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 9,
                          }}
                        >
                          <span style={{ fontSize: 11 }}>
                            <b style={{ color: ROSA, fontSize: 17 }}>
                              ♀
                            </b>{" "}
                            {feminino}
                          </span>

                          <span style={{ fontSize: 11 }}>
                            <b style={{ color: AZUL, fontSize: 17 }}>
                              ♂
                            </b>{" "}
                            {masculino}
                          </span>

                          {unissex > 0 && (
                            <span style={{ fontSize: 11 }}>
                              Unissex {unissex}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        background: "#1b2432",
                        borderRadius: 10,
                        padding: "9px 8px",
                        minWidth: 54,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ ...S.pequeno, fontSize: 10 }}>
                        Total
                      </div>

                      <strong style={{ fontSize: 23 }}>
                        {total}
                      </strong>

                      <div style={{ ...S.pequeno, fontSize: 10 }}>
                        un.
                      </div>
                    </div>
                  </div>

                  {funcionario && (
                    <div
                      style={{
                        ...S.linha,
                        marginTop: 11,
                        borderTop: "1px solid #283142",
                        paddingTop: 10,
                      }}
                    >
                      <Botao
                        variante="secundario"
                        onClick={() => editarProduto(p)}
                        style={{ minHeight: 34, fontSize: 12 }}
                      >
                        Editar modelo
                      </Botao>

                      <Botao
                        variante="perigo"
                        onClick={() => void excluirProduto(p)}
                        style={{ minHeight: 34, fontSize: 12 }}
                      >
                        Excluir
                      </Botao>
                    </div>
                  )}
                </section>
              );
            })}
              </>
            )}
          </>
        )}

        {tela === "estoque" && produtoAberto && abrirGaleria && (
  <GaleriaCapinhas
    produtoId={produtoAberto.id}
    modelo={produtoAberto.modelo}
    onFazerPedido={() => setAbrirGaleria(false)}
    podeEditar={perfil === "admin" || perfil === "funcionario"}
    onVoltar={() => {
      setAbrirGaleria(false);
      setProdutoAbertoId(null);
    }}
  />
)}

{tela === "estoque" && produtoAberto && !abrirGaleria && (
          <>
            <section
              style={{
                ...S.card,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 75,
                  height: 83,
                  background: "#202938",
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {produtoAberto.categoria !== "Películas" &&
                produtoAberto.imagem_url ? (
                  <img
                    src={produtoAberto.imagem_url}
                    alt={produtoAberto.modelo}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 31 }}>📱</span>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: 19,
                    margin: "0 0 6px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {produtoAberto.modelo}
                </h2>

                <span style={S.pequeno}>
                  {produtoAberto.categoria}
                </span>
              </div>
            </section>

            {produtoAberto.categoria !== "Películas" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 6,
                  marginBottom: 14,
                }}
              >
                {PUBLICOS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPublicoFiltro(p)}
                    style={{
                      ...S.secundario,
                      background:
                        publicoFiltro === p ? LARANJA : "#171e2a",
                      borderColor:
                        publicoFiltro === p ? LARANJA : "#283344",
                      padding: "10px 4px",
                      fontSize: 11,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        color:
                          publicoFiltro === p
                            ? "#fff"
                            : p === "Feminino"
                            ? ROSA
                            : p === "Masculino"
                            ? AZUL
                            : "#ddd",
                        fontSize: 17,
                      }}
                    >
                      {p === "Feminino"
                        ? "♀"
                        : p === "Masculino"
                        ? "♂"
                        : "◉"}
                    </span>{" "}
                    {p} (
                    {variacoesProduto
                      .filter((v) => v.publico === p)
                      .reduce(
                        (s, v) => s + Number(v.quantidade || 0),
                        0
                      )}
                    )
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  produtoAberto.categoria === "Películas"
                    ? "repeat(2,minmax(0,1fr))"
                    : "repeat(auto-fill,minmax(105px,1fr))",
                gap: 9,
                marginBottom: 17,
              }}
            >
              {variacoesVisiveis.map((v) => {
                const r = rascunhos[v.id];

                return (
                  <div
                    key={v.id}
                    style={{
                      background: "#131a25",
                      border: "1px solid #2b3444",
                      borderRadius: 12,
                      padding: 7,
                      minWidth: 0,
                    }}
                  >
                    {produtoAberto.categoria !== "Películas" && (
                      <div
                        style={{
                          height: 120,
                          background: "#0b1019",
                          borderRadius: 9,
                          overflow: "hidden",
                          display: "grid",
                          placeItems: "center",
                          marginBottom: 7,
                        }}
                      >
                        {v.imagem_url ? (
                          <img
                            src={v.imagem_url}
                            alt={v.nome}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 32 }}>📱</span>
                        )}
                      </div>
                    )}

                    <strong
                      style={{
                        display: "block",
                        fontSize: 12,
                        textAlign: "center",
                        minHeight: 29,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {v.nome}
                    </strong>

                    <div
                      style={{
                        color: LARANJA,
                        fontSize: 12,
                        fontWeight: 800,
                        textAlign: "center",
                        margin: "6px 0",
                      }}
                    >
                      Estoque:{" "}
                      {r?.quantidade ?? String(v.quantidade)}
                    </div>

                    {funcionario && (
                      <>
                        <Campo rotulo="Em estoque">
                          <input
                            style={{
                              ...S.input,
                              minHeight: 35,
                              padding: "6px 4px",
                              textAlign: "center",
                              fontSize: 14,
                            }}
                            type="number"
                            min="0"
                            value={
                              r?.quantidade ?? String(v.quantidade)
                            }
                            onChange={(e) =>
                              alterarRascunho(
                                v,
                                "quantidade",
                                e.target.value
                              )
                            }
                          />
                        </Campo>

                        <div
                          style={{
                            fontSize: 10,
                            color: "#9da7b8",
                            textAlign: "center",
                            marginBottom: 5,
                          }}
                        >
                          Precisa comprar
                        </div>

                        <ControleNumero
                          disabled={ocupado}
                          valor={
                            r?.quantidade_comprar ??
                            String(v.quantidade_comprar)
                          }
                          alterar={(valor) =>
                            alterarRascunho(
                              v,
                              "quantidade_comprar",
                              valor
                            )
                          }
                        />

                        <Botao
                          variante="secundario"
                          onClick={() => editarVariacao(v)}
                          style={{
                            width: "100%",
                            marginTop: 9,
                            minHeight: 32,
                            fontSize: 11,
                          }}
                        >
                          Editar
                        </Botao>

                        <Botao
                          variante="perigo"
                          onClick={() => void excluirVariacao(v)}
                          style={{
                            width: "100%",
                            marginTop: 5,
                            minHeight: 32,
                            fontSize: 11,
                          }}
                        >
                          Excluir
                        </Botao>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {variacoesVisiveis.length === 0 && (
              <section style={S.card}>
                <p style={S.pequeno}>
                  Nenhum item cadastrado nesta categoria.
                </p>
              </section>
            )}

            {produtoAberto.categoria !== "Películas" && (
              <>
                {(["Feminino", "Masculino", "Unissex"] as Publico[]).map(
                  (p) => {
                    const itens = variacoesProduto.filter(
                      (v) => v.publico === p
                    );

                    if (p === "Unissex" && !itens.length) return null;

                    const total = totalPublico(variacoesProduto, p);

                    const comprar = itens.reduce(
                      (s, v) =>
                        s +
                        Number(
                          rascunhos[v.id]?.quantidade_comprar ??
                            v.quantidade_comprar
                        ),
                      0
                    );

                    return (
                      <section
                        key={p}
                        style={{
                          ...S.card,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 9,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 31,
                                color:
                                  p === "Feminino"
                                    ? ROSA
                                    : p === "Masculino"
                                    ? AZUL
                                    : "#ccc",
                              }}
                            >
                              {p === "Feminino"
                                ? "♀"
                                : p === "Masculino"
                                ? "♂"
                                : "◉"}
                            </span>

                            <div>
                              <div style={S.pequeno}>
                                Total de capas {p.toLowerCase()}
                              </div>

                              <strong style={{ fontSize: 18 }}>
                                {total} capas
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              ...S.pequeno,
                              fontSize: 10,
                              marginBottom: 5,
                            }}
                          >
                            Precisa comprar
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              justifyContent: "center",
                            }}
                          >
                            {funcionario && (
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeCategoria(p, -1)
                                }
                                style={{
                                  ...S.principal,
                                  width: 31,
                                  minHeight: 34,
                                  padding: 0,
                                }}
                              >
                                −
                              </button>
                            )}

                            <strong
                              style={{
                                minWidth: 30,
                                fontSize: 19,
                              }}
                            >
                              {comprar}
                            </strong>

                            {funcionario && (
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeCategoria(p, 1)
                                }
                                style={{
                                  ...S.principal,
                                  width: 31,
                                  minHeight: 34,
                                  padding: 0,
                                }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  }
                )}
              </>
            )}

            {funcionario && (
              <>
                {Object.keys(rascunhos).length > 0 && (
                  <Botao
                    disabled={ocupado}
                    onClick={() => void salvarQuantidades()}
                    style={{
                      width: "100%",
                      marginBottom: 12,
                      minHeight: 51,
                    }}
                  >
                    🛒 Salvar atualização
                  </Botao>
                )}

                <Botao
                  variante="secundario"
                  onClick={() => {
                    if (mostrarVariacao) {
                      limparVariacao();
                    } else {
                      setFormVariacao({ ...variacaoVazia(), nome: produtoAberto.categoria === "Películas" ? tipoPeliculasAtivo : "" });
                      setEditandoVariacao(null);
                      setMostrarVariacao(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    marginBottom: 12,
                  }}
                >
                  {mostrarVariacao
                    ? "Fechar cadastro"
                    : produtoAberto.categoria === "Películas" ? "+ Adicionar tipo de película" : "+ Adicionar capinha / item"}
                </Botao>

                {mostrarVariacao && (
                  <FormularioVariacao
                    form={formVariacao}
                    setForm={setFormVariacao}
                    categoria={produtoAberto.categoria}
                    editando={!!editandoVariacao}
                    ocupado={ocupado}
                    enviando={enviandoFoto}
                    salvar={() => void salvarVariacao()}
                    cancelar={limparVariacao}
                    camera={() =>
                      escolherFoto("variacao", "camera")
                    }
                    galeria={() =>
                      escolherFoto("variacao", "galeria")
                    }
                  />
                )}
              </>
            )}
          </>
        )}

        {tela === "pedidos" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h1 style={{ ...S.titulo, margin: 0 }}>Pedidos</h1>
              {funcionario && <button type="button" aria-label="Novo pedido manual"
                onClick={() => setMostrarManual(a => !a)}
                style={{ ...S.principal, width: 45, height: 45, padding: 0, fontSize: 28 }}>
                {mostrarManual ? "×" : "+"}
              </button>}
            </div>

            {mostrarManual && funcionario && (
              <section style={S.card}>
                <h3>Novo pedido manual</h3>
                <Campo rotulo="Categoria">
                  <select style={S.input} value={formManual.categoria}
                    onChange={e => setFormManual(() => ({ ...manualVazio(), categoria: e.target.value as Categoria }))}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Campo>
                {formManual.categoria !== "Outros" ? <>
                  <Campo rotulo="Marca">
                    <select style={S.input} value={formManual.marca}
                      onChange={e => setFormManual(a => ({ ...a, marca: e.target.value }))}>
                      <option value="">Selecione</option>
                      {MARCAS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </Campo>
                  <Campo rotulo="Modelo">
                    <input style={S.input} placeholder="Ex.: Redmi 15C" value={formManual.modelo}
                      onChange={e => setFormManual(a => ({ ...a, modelo: e.target.value }))} />
                  </Campo>
                  {formManual.categoria === "Capas" ? <>
                    <Campo rotulo="Público / estilo">
                      <select style={S.input} value={formManual.publico}
                        onChange={e => setFormManual(a => ({ ...a, publico: e.target.value }))}>
                        {["Feminina", "Masculina", "Transparente"].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </Campo>
                    <Campo rotulo="Tipo">
                      <select style={S.input} value={formManual.tipo}
                        onChange={e => setFormManual(a => ({ ...a, tipo: e.target.value }))}>
                        {["Decorado", "Case"].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </Campo>
                  </> : <Campo rotulo="Tipo de película (digite livremente)">
                    <input style={S.input} value={formManual.tipo} placeholder="Ex.: 9D, fosca, privacidade"
                      onChange={e => setFormManual(a => ({ ...a, tipo: e.target.value }))} />
                  </Campo>}
                </> : <>
                  <Campo rotulo="Nome do produto">
                    <input style={S.input} value={formManual.nome_produto} placeholder="Ex.: Carregador 25W"
                      onChange={e => setFormManual(a => ({ ...a, nome_produto: e.target.value }))} />
                  </Campo>
                  <Campo rotulo="Marca (opcional)">
                    <input style={S.input} value={formManual.marca}
                      onChange={e => setFormManual(a => ({ ...a, marca: e.target.value }))} />
                  </Campo>
                  <Campo rotulo="Descrição / modelo (opcional)">
                    <input style={S.input} value={formManual.descricao}
                      onChange={e => setFormManual(a => ({ ...a, descricao: e.target.value }))} />
                  </Campo>
                </>}
                <Campo rotulo="Quantidade">
                  <input type="number" min="1" step="1" style={S.input} value={formManual.quantidade}
                    onChange={e => setFormManual(a => ({ ...a, quantidade: e.target.value }))} />
                </Campo>
                <Botao disabled={ocupado} onClick={() => void salvarManual()} style={{ width: "100%" }}>
                  Salvar pedido
                </Botao>
              </section>
            )}

            <section style={S.card}>
              <Campo rotulo="O que você vai pedir?">
                <select style={S.input} value={categoriaPedidoLista} onChange={e => setCategoriaPedidoLista(e.target.value as "Capas" | "Películas")}>
                  <option value="Películas">Películas</option><option value="Capas">Capas</option>
                </select>
              </Campo>
              {categoriaPedidoLista === "Películas" && <Campo rotulo="Tipo de película">
                <select style={S.input} value={tipoPedidoAtivo} onChange={e => setTipoPedidoLista(e.target.value)}>
                  {!tiposPedidoLista.length && <option value="">Nenhum tipo cadastrado</option>}
                  {tiposPedidoLista.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </Campo>}
              <strong>{categoriaPedidoLista === "Películas" ? `Películas ${tipoPedidoAtivo} para pedir` : "Capas para pedir"}</strong>
              {!itensListaPedido.length && <p style={S.pequeno}>Nenhum item pendente para estes filtros.</p>}
              {itensListaPedido.map(item => <div key={item.id} style={{display:"flex", justifyContent:"space-between", gap:10, padding:"10px 0", borderBottom:"1px solid #303744"}}>
                <span>{item.marca} {item.modelo}{item.detalhe ? ` — ${item.detalhe}` : ""}</span><strong style={{color:LARANJA, whiteSpace:"nowrap"}}>{item.quantidade} un.</strong>
              </div>)}
              <Botao disabled={!itensListaPedido.length} onClick={enviarListaPedidosWhatsApp} style={{width:"100%", background:"#168b50", marginTop:14}}>📲 Enviar lista pelo WhatsApp</Botao>
            </section>

            <section style={S.card}>
              <div
                style={{
                  ...S.linha,
                  justifyContent: "space-between",
                }}
              >
                <strong>Reposição de estoque</strong>

                <strong style={{ color: LARANJA }}>
                  {totalComprar} unidades
                </strong>
              </div>

              <p style={S.pequeno}>
                Selecione vários itens para registrar a compra ou a
                chegada.
              </p>
            </section>

            <h3 style={{ color: "#f0bf74" }}>
              ● Pendentes ({pendentes.length + manuaisPendentes.length})
            </h3>

            {pendentes.length > 0 && pedidosTabela(pendentes)}
            {manuaisPendentes.length > 0 && tabelaManuais(manuaisPendentes)}
            {!pendentes.length && !manuaisPendentes.length && (
              <p style={S.pequeno}>Nenhum pedido aguardando compra.</p>
            )}

            <h3 style={{ color: "#7ddd95" }}>
              ✓ Pedidos feitos ({comprados.length + manuaisFeitos.length})
            </h3>

            {comprados.length > 0 && pedidosTabela(comprados)}
            {manuaisFeitos.length > 0 && tabelaManuais(manuaisFeitos)}
            {!comprados.length && !manuaisFeitos.length && (
              <p style={S.pequeno}>Nenhum pedido aguardando chegada.</p>
            )}

            {funcionario && (pedidos.length + manuaisPendentes.length + manuaisFeitos.length) > 0 && (
              <section style={S.card}>
                <div style={{ ...S.linha, justifyContent: "space-between" }}>
                  <strong>
                    {selecionados.filter((id) =>
                      pedidos.some((v) => v.id === id) || manuais.some(m => m.id === id && m.status !== "recebido")
                    ).length}{" "}
                    selecionados
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setSelecionados(
                        [...pedidos.map(v => v.id), ...manuais.filter(m => m.status !== "recebido").map(m => m.id)]
                          .every(id => selecionados.includes(id))
                          ? []
                          : [...pedidos.map(v => v.id), ...manuais.filter(m => m.status !== "recebido").map(m => m.id)]
                      )
                    }
                    style={{
                      background: "transparent",
                      border: 0,
                      color: LARANJA,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Selecionar todos
                  </button>
                </div>

                <Botao
                  disabled={
                    ocupado ||
                    !selecionados.some((id) =>
                      pendentes.some((v) => v.id === id) || manuaisPendentes.some(m => m.id === id)
                    )
                  }
                  onClick={() => void marcarPedidosFeitos()}
                  style={{ width: "100%", marginTop: 13 }}
                >
                  ✓ Marcar como pedido feito
                </Botao>

                <Botao
                  variante="secundario"
                  disabled={
                    ocupado ||
                    !selecionados.some((id) =>
                      comprados.some((v) => v.id === id) || manuaisFeitos.some(m => m.id === id)
                    )
                  }
                  onClick={() => void confirmarChegada()}
                  style={{ width: "100%", marginTop: 9 }}
                >
                  📦 Confirmar chegada
                </Botao>

                <p style={S.pequeno}>
                  Ao confirmar a chegada, as unidades recebidas são
                  adicionadas ao estoque e os itens saem da lista.
                </p>
              </section>
            )}
          </>
        )}

        {tela === "pedidos_especiais" && (
          <>
            <h1 style={S.titulo}>Pedidos especiais</h1>

            <p style={S.pequeno}>
              Encomendas específicas dos clientes.
            </p>

            {funcionario && (
              <Botao
                onClick={() => setMostrarEspecial(!mostrarEspecial)}
                style={{ width: "100%", marginBottom: 14 }}
              >
                {mostrarEspecial
                  ? "Fechar cadastro"
                  : "+ Novo pedido especial"}
              </Botao>
            )}

            {mostrarEspecial && funcionario && (
              <FormularioEspecial
                form={formEspecial}
                setForm={setFormEspecial}
                ocupado={ocupado}
                salvar={() => void salvarEspecial()}
                cancelar={() => {
                  setMostrarEspecial(false);
                  setFormEspecial(especialVazio());
                }}
              />
            )}

            {especiais.length === 0 && (
              <section style={S.card}>
                Nenhum pedido especial cadastrado.
              </section>
            )}

            {especiais.map((p) => (
              <section key={p.id} style={S.card}>
                <div
                  style={{
                    ...S.linha,
                    justifyContent: "space-between",
                  }}
                >
                  <strong>{p.nome_cliente}</strong>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color:
                        p.status === "recebido"
                          ? "#7ddd95"
                          : p.status === "pedido_feito"
                          ? LARANJA
                          : "#f0bf74",
                    }}
                  >
                    {p.status === "pendente"
                      ? "PENDENTE"
                      : p.status === "pedido_feito"
                      ? "PEDIDO FEITO"
                      : "RECEBIDO"}
                  </span>
                </div>

                <p>📱 {p.modelo_aparelho}</p>

                <p
                  style={{
                    color: "#c9d1de",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {p.descricao}
                </p>

                <p style={S.pequeno}>
                  Telefone: {p.telefone}
                </p>

                <p style={S.pequeno}>
                  Cadastrado em{" "}
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>

                {funcionario && (
                  <div style={{ ...S.linha, justifyContent: "center", gap: 10 }}>
                    {p.status === "pendente" && (
                      <Botao
                        disabled={ocupado}
                        style={{ minWidth: 125, textAlign: "center" }}
                        onClick={() =>
                          void atualizarEspecial(p, "pedido_feito")
                        }
                      >
                        ✓ Pedido feito
                      </Botao>
                    )}

                    {p.status === "pedido_feito" && (
                      <Botao
                        disabled={ocupado}
                        style={{ minWidth: 125, textAlign: "center" }}
                        onClick={() =>
                          void atualizarEspecial(p, "recebido")
                        }
                      >
                        📦 Recebido
                      </Botao>
                    )}

                    <Botao
                      variante="perigo"
                      disabled={ocupado}
                        style={{ minWidth: 125, textAlign: "center" }}
                      onClick={() => void excluirEspecial(p)}
                    >
                      Apagar
                    </Botao>
                  </div>
                )}
              </section>
            ))}
          </>
        )}

        {tela === "acompanhar_servicos" && funcionario && (
          <>
            <h1 style={S.titulo}>Acompanhar serviços</h1>
            {funcionario && (
              <section style={{ ...S.card, borderColor: "#364252" }}>
                <div style={{ ...S.linha, justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Acompanhar serviços</h3>
                  <Botao variante="secundario" disabled={atualizandoServicos} onClick={() => {
                    setAtualizandoServicos(true);
                    void carregarServicosFuncionario().finally(() => setAtualizandoServicos(false));
                  }}>Atualizar</Botao>
                </div>
                {mensagemServico && <p role="status" style={{ color: "#ff9b53", fontWeight: 700 }}>{mensagemServico}</p>}
                {erroServicos && <p role="alert" style={{ color: "#ff9b9b" }}>Erro ao consultar status: {erroServicos}</p>}
                {!erroServicos && servicosFuncionario.length === 0 && <p style={S.pequeno}>Nenhum serviço enviado por este usuário.</p>}
                {servicosFuncionario.map((item) => {
                  const concluido = item.status === "concluido";
                  const finalizado = concluido || item.status === "nao_reparou";
                  const status = item.status === "nao_reparou" ? "Não reparou" : concluido ? "Concluído" : item.status === "pendente" ? "Pendente" : item.status === "em_andamento" ? "Em andamento" : item.status.replaceAll("_", " ");
                  return (
                    <article key={item.id} style={{ background: "#0d1420", padding: 13, borderRadius: 11, marginTop: 10, border: "1px solid #303744" }}>
                      <div style={{ ...S.linha, justifyContent: "space-between" }}>
                        <strong>{item.nome_cliente}</strong>
                        <span style={{ fontWeight: 800, color: concluido ? "#6ee7a1" : item.status === "nao_reparou" ? "#ff9999" : "#ff9b53" }}>{status}</span>
                      </div>
                      <p style={{ margin: "8px 0 3px" }}>{item.modelo_celular} — {item.servico}</p>
                      {item.descricao_peca && <p style={S.pequeno}>{item.descricao_peca}</p>}
                      <small style={S.pequeno}>Enviado: {new Date(item.created_at).toLocaleString("pt-BR")}</small>
                      {finalizado && <div style={{ marginTop: 12 }}><Botao variante="perigo" disabled={atualizandoServicos}
                        onClick={() => void apagarServico(item)}>🗑️ Apagar serviço</Botao></div>}
                      {item.concluido_em && <div style={S.pequeno}>Concluído: {new Date(item.concluido_em).toLocaleString("pt-BR")}</div>}
                    </article>
                  );
                })}
              </section>
            )}


          </>
        )}

        {tela === "pecas" && (
          <>
            <h1 style={S.titulo}>Consulta de Peças</h1>
            <div style={{ ...S.linha, marginBottom: 15 }}>
              <Botao
                variante="secundario"
                onClick={() => setSecaoPecas("consultar")}
              >
                Consultar
              </Botao>

              {admin && (
                <>
                  <Botao
                    variante="secundario"
                    onClick={() => {
                      limparPeca();
                      setSecaoPecas("cadastrar");
                    }}
                  >
                    Cadastrar
                  </Botao>

                  <Botao
                    variante="secundario"
                    onClick={() => {
                      setSecaoPecas("todos");
                      setPaginaPecas(1);
                    }}
                  >
                    Todos os preços
                  </Botao>
                </>
              )}
            </div>

            {secaoPecas === "consultar" && (
              <section style={S.card}>
                <p style={{ ...S.pequeno, marginTop: 0, marginBottom: 16 }}>
                  Escolha o tipo de peça na lista. Marca, modelo e qualidade
                  aparecem conforme as peças cadastradas, sem precisar digitar.
                </p>

                <Campo rotulo="Tipo de peça">
                  <select
                    style={S.input}
                    value={tipoPeca}
                    onChange={(e) => {
                      setTipoPeca(e.target.value);
                      setMarcaPeca("");
                      setModeloPeca("");
                      setQualidadePeca("");
                      setPesquisouPecas(false);
                      setPaginaPecas(1);
                    }}
                  >
                    <option value="">Selecione o tipo de peça</option>
                    {TIPOS_PECAS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Marca">
                  <select
                    style={{ ...S.input, opacity: tipoPeca ? 1 : 0.6 }}
                    value={marcaPeca}
                    disabled={!tipoPeca}
                    onChange={(e) => {
                      setMarcaPeca(e.target.value);
                      setModeloPeca("");
                      setQualidadePeca("");
                      setPesquisouPecas(false);
                      setPaginaPecas(1);
                    }}
                  >
                    <option value="">Selecione a marca</option>
                    {marcasDisponiveisPecas.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Modelo do celular">
                  <select
                    style={{ ...S.input, opacity: marcaPeca ? 1 : 0.6 }}
                    value={modeloPeca}
                    disabled={!tipoPeca || !marcaPeca}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setModeloPeca(valor);
                      setQualidadePeca("");
                      setPesquisouPecas(Boolean(valor));
                      setPaginaPecas(1);
                    }}
                  >
                    <option value="">Selecione o modelo</option>
                    {modelosPecas.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Campo>

                {modeloPeca && (
                  <>
                    <Campo rotulo="Qualidade da peça">
                      <select
                        style={S.input}
                        value={qualidadePeca}
                        onChange={(e) => {
                          setQualidadePeca(e.target.value);
                          setPaginaPecas(1);
                        }}
                      >
                        <option value="">Todas as qualidades disponíveis</option>
                        {qualidadesPecas.map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </Campo>

                    <div style={{
                      background: "#111b28", border: "1px solid #303744",
                      borderRadius: 12, padding: "12px 14px", marginTop: 4,
                    }}>
                      <strong style={{ color: LARANJA }}>
                        {resultadosPecas.length} {resultadosPecas.length === 1 ? "peça encontrada" : "peças encontradas"}
                      </strong>
                      <p style={{ ...S.pequeno, marginBottom: 0, marginTop: 5 }}>
                        {marcaPeca} {modeloPeca} — {tipoPeca}
                        {qualidadePeca ? ` — ${qualidadePeca}` : ""}
                      </p>
                    </div>
                  </>
                )}

                {!modeloPeca && (
                  <p style={{ ...S.pequeno, textAlign: "center", marginBottom: 0 }}>
                    {pecas.length === 0
                      ? "Ainda não há preços de peças cadastrados."
                      : tipoPeca && marcasDisponiveisPecas.length === 0
                      ? "Não há peças cadastradas para esse tipo."
                      : tipoPeca && marcaPeca && modelosPecas.length === 0
                      ? "Não há modelos cadastrados para essa combinação."
                      : "Selecione um modelo para visualizar as peças e os preços disponíveis."}
                  </p>
                )}

                <Botao
                  variante="secundario"
                  onClick={() => void carregarPecas().catch((e) => alert(erroTexto(e)))}
                  style={{ width: "100%", marginTop: 14 }}
                >
                  ↻ Atualizar lista de peças
                </Botao>
              </section>
            )}

            {secaoPecas === "cadastrar" && admin && (
              <section style={S.card}>
                <h3>
                  {editandoPeca ? "Editar preço" : "Cadastrar preço"}
                </h3>

                <Campo rotulo="Tipo de peça">
                  <select
                    style={S.input}
                    value={formPeca.tipo_peca}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        tipo_peca: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione</option>

                    {TIPOS_PECAS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Marca">
                  <select
                    style={S.input}
                    value={formPeca.marca}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        marca: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione</option>

                    {MARCAS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Modelo">
                  <input
                    style={S.input}
                    value={formPeca.modelo}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        modelo: e.target.value,
                      }))
                    }
                  />
                </Campo>

                <Campo rotulo="Qualidade">
                  <select
                    style={S.input}
                    value={formPeca.qualidade}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        qualidade: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione</option>

                    {[
                      ...new Set(
                        [...QUALIDADES, formPeca.qualidade].filter(Boolean)
                      ),
                    ].map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Valor de custo">
                  <input
                    style={S.input}
                    inputMode="decimal"
                    value={formPeca.valor_custo}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        valor_custo: e.target.value,
                      }))
                    }
                  />
                </Campo>

                <Campo rotulo="Valor final">
                  <input
                    style={S.input}
                    inputMode="decimal"
                    value={formPeca.valor_final}
                    onChange={(e) =>
                      setFormPeca((a) => ({
                        ...a,
                        valor_final: e.target.value,
                      }))
                    }
                  />
                </Campo>

                <Botao
                  disabled={ocupado}
                  onClick={() => void salvarPeca()}
                  style={{ width: "100%" }}
                >
                  Salvar preço
                </Botao>

                {editandoPeca && (
                  <Botao
                    variante="secundario"
                    onClick={limparPeca}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    Cancelar edição
                  </Botao>
                )}
              </section>
            )}

            {secaoPecas !== "cadastrar" &&
              listaPecas.length === 0 &&
              (secaoPecas === "todos" || podeExibirResultadosPecas) && (
                <p style={S.pequeno}>
                  Nenhuma peça encontrada.
                </p>
              )}

            {secaoPecas !== "cadastrar" &&
              pecasPagina.map((p) => (
                <section key={p.id} style={{ ...S.card, position: "relative" }}>
                  {padronizarTipoPeca(p.tipo_peca) === "Tela" && ["motorola", "samsung", "xiaomi", "realme"].includes(normalizar(p.marca)) && (
                    <label style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 7, color: "#70dc99", fontWeight: 700, marginBottom: 8, minHeight: 36 }}>
                      <input type="checkbox" checked={!!pecasComAro[p.id]} onChange={e => setPecasComAro(prev => ({ ...prev, [p.id]: e.target.checked }))} style={{ width: 20, height: 20, accentColor: "#20a660" }} />
                      Com aro
                    </label>
                  )}
                  <strong>
                    {p.marca} {p.modelo}
                  </strong>

                  <p style={S.pequeno}>
                    {p.tipo_peca} · {p.qualidade}
                  </p>

                  <strong
                    style={{
                      display: "block",
                      color: LARANJA,
                      fontSize: 21,
                      marginTop: 8,
                    }}
                  >
                    {dinheiro(Number(p.valor_final) + (pecasComAro[p.id] ? 20 : 0))}
                  </strong>

                  {funcionario && (
                    <Botao
                      onClick={() => {
                        setPecaSelecionada(p);
                        setAroSelecionado(!!pecasComAro[p.id]);
                        setMensagemServico("");
                        setServicoSolicitado(p.tipo_peca === "Tela" ? "Troca de tela" : `Troca de ${p.tipo_peca.toLowerCase()}`);
                      }}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      Selecionar peça / Enviar para o técnico
                    </Botao>
                  )}

                  {admin && (
                    <>
                      <p style={S.pequeno}>
                        Custo: {dinheiro(p.valor_custo)}
                      </p>

                      <div style={S.linha}>
                        <Botao
                          variante="secundario"
                          onClick={() => editarPeca(p)}
                        >
                          Editar
                        </Botao>

                        <Botao
                          variante="perigo"
                          onClick={() => void excluirPeca(p)}
                        >
                          Excluir
                        </Botao>
                      </div>
                    </>
                  )}
                </section>
              ))}

            {funcionario && mensagemServico && (
              <section style={S.card} role="status">{mensagemServico}</section>
            )}

            {funcionario && pecaSelecionada && (
              <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setPecaSelecionada(null)}>
              <section role="dialog" aria-modal="true" aria-label="Enviar peça para o técnico" onClick={(e) => e.stopPropagation()} style={{ ...S.card, borderColor: LARANJA, width: "100%", maxWidth: 510, maxHeight: "90dvh", overflowY: "auto", marginBottom: 0 }}>
                <h3>Enviar peça para o técnico</h3>
                <p style={S.pequeno}>
                  Peça: {pecaSelecionada.tipo_peca} - {pecaSelecionada.marca} {pecaSelecionada.modelo} ({pecaSelecionada.qualidade}) {aroSelecionado ? "— Com aro" : ""} — {dinheiro(Number(pecaSelecionada.valor_final) + (aroSelecionado ? 20 : 0))}
                </p>
                <Campo rotulo="Modelo do aparelho">
                  <input style={S.input} value={`${pecaSelecionada.marca} ${pecaSelecionada.modelo}`} readOnly />
                </Campo>
                <Campo rotulo="Nome do cliente">
                  <input style={S.input} value={clienteServico} onChange={(e) => setClienteServico(e.target.value)} />
                </Campo>
                <Campo rotulo="Serviço solicitado">
                  <input style={S.input} value={servicoSolicitado} onChange={(e) => setServicoSolicitado(e.target.value)} />
                </Campo>
                <Campo rotulo="Observações (opcional)">
                  <textarea style={{ ...S.input, minHeight: 85 }} value={observacoesServico} onChange={(e) => setObservacoesServico(e.target.value)} />
                </Campo>
                <Botao disabled={enviandoServico} onClick={() => void enviarPecaTecnico()} style={{ width: "100%" }}>
                  {enviandoServico ? "Enviando..." : "Confirmar envio para o técnico"}
                </Botao>
                <Botao variante="secundario" onClick={() => setPecaSelecionada(null)} style={{ width: "100%", marginTop: 8 }}>
                  Cancelar
                </Botao>
              </section>
              </div>
            )}

            {secaoPecas !== "cadastrar" &&
              totalPaginasPecas > 1 && (
                <div
                  style={{
                    ...S.linha,
                    justifyContent: "center",
                    marginTop: 15,
                  }}
                >
                  <Botao
                    variante="secundario"
                    disabled={paginaPecas <= 1}
                    onClick={() => setPaginaPecas((p) => p - 1)}
                  >
                    Anterior
                  </Botao>

                  <span style={S.pequeno}>
                    {paginaPecas} / {totalPaginasPecas}
                  </span>

                  <Botao
                    variante="secundario"
                    disabled={paginaPecas >= totalPaginasPecas}
                    onClick={() => setPaginaPecas((p) => p + 1)}
                  >
                    Próxima
                  </Botao>
                </div>
              )}
          </>
        )}

        {tela === "informacoes" && (
          <>
            <h1 style={S.titulo}>Informações técnicas</h1>

            {admin && (
              <section style={S.card}>
                <h3>
                  {editandoInfo
                    ? "Editar informação"
                    : "Cadastrar informação"}
                </h3>

                <Campo rotulo="Título">
                  <input
                    style={S.input}
                    value={tituloInfo}
                    onChange={(e) => setTituloInfo(e.target.value)}
                  />
                </Campo>

                <Campo rotulo="Conteúdo">
                  <textarea
                    style={{
                      ...S.input,
                      minHeight: 130,
                      resize: "vertical",
                    }}
                    value={conteudoInfo}
                    onChange={(e) => setConteudoInfo(e.target.value)}
                  />
                </Campo>

                <Botao
                  disabled={ocupado}
                  onClick={() => void salvarInfo()}
                  style={{ width: "100%" }}
                >
                  Salvar informação
                </Botao>

                {editandoInfo && (
                  <Botao
                    variante="secundario"
                    onClick={limparInfo}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    Cancelar edição
                  </Botao>
                )}
              </section>
            )}

            {informacoes.map((info) => (
              <section key={info.id} style={S.card}>
                <h3>{info.titulo}</h3>

                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.6,
                  }}
                >
                  {info.conteudo}
                </p>

                {admin && (
                  <div style={S.linha}>
                    <Botao
                      variante="secundario"
                      onClick={() => {
                        setEditandoInfo(info.id);
                        setTituloInfo(info.titulo);
                        setConteudoInfo(info.conteudo);
                        window.scrollTo(0, 0);
                      }}
                    >
                      Editar
                    </Botao>

                    <Botao
                      variante="perigo"
                      onClick={() => void excluirInfo(info)}
                    >
                      Excluir
                    </Botao>
                  </div>
                )}
              </section>
            ))}
          </>
        )}
      </main>

      <nav
  style={{
    ...S.nav,
    display: tela === "inicio" ? "none" : "grid",
  }}
>
        {(
          [
            ["inicio", "⌂", "Início"],
            ["pecas", "🔧", "Peças"],
            ["informacoes", "ⓘ", "Informações"],
            ["estoque", "▣", "Estoque"],
          ] as [Tela, string, string][]
        ).map(([destino, icone, nome]) => (
          <button
            key={destino}
            type="button"
            onClick={() => navegar(destino)}
            style={{
              background: "transparent",
              border: 0,
              color: tela === destino ? LARANJA : "#9da7b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "5px 2px",
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 21 }}>{icone}</span>

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {nome}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}