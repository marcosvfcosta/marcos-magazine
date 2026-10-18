
import { useState, type FormEvent } from "react";
import { supabase } from "./supabase";
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Smartphone,
  Wrench,
  X,
} from "lucide-react";

type TelaFuncionario =
  | "inicio"
  | "pecas"
  | "informacoes"
  | "estoque"
  | "compras"
  | "pedidos"
  | "solicitacao";

type Props = {
  onSair: () => void | Promise<void>;
  onAbrirPecas: () => void;
  onAbrirInformacoes: () => void;
};

const LARANJA = "#ff6600";
const FUNDO = "#080d13";
const CARTAO = "#121a24";
const BORDA = "#273342";

export default function FuncionarioApp({
  onSair,
  onAbrirPecas,
  onAbrirInformacoes,
}: Props) {
  const [tela, setTela] = useState<TelaFuncionario>("inicio");
  const [menuAberto, setMenuAberto] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [modeloCelular, setModeloCelular] = useState("");
  const [servico, setServico] = useState("");
  const [descricaoPeca, setDescricaoPeca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function enviarSolicitacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setMensagem("");
    setEnviando(true);
    try {
      const { data: { user }, error: erroUsuario } = await supabase.auth.getUser();
      if (erroUsuario || !user) {
        throw new Error("Sessão expirada. Entre novamente no sistema.");
      }
      const { error } = await supabase.from("solicitacoes_servico").insert({
        nome_cliente: nomeCliente.trim(),
        modelo_celular: modeloCelular.trim(),
        servico: servico.trim(),
        descricao_peca: descricaoPeca.trim() || null,
        status: "pendente",
        criado_por: user.id,
      });
      if (error) throw new Error(error.message);
      setNomeCliente("");
      setModeloCelular("");
      setServico("");
      setDescricaoPeca("");
      setMensagem("Solicitação enviada para o técnico com sucesso!");
    } catch (erro) {
      setMensagem("Não foi possível enviar: " + (erro instanceof Error ? erro.message : "erro desconhecido"));
    } finally {
      setEnviando(false);
    }
  }


  function navegar(destino: TelaFuncionario) {
    setTela(destino);
    setMenuAberto(false);

    if (destino === "pecas") {
      onAbrirPecas();
    }

    if (destino === "informacoes") {
      onAbrirInformacoes();
    }
  }

  const itensInferiores = [
    { id: "inicio", nome: "Início", Icone: Home },
    { id: "pecas", nome: "Peças", Icone: Wrench },
    { id: "informacoes", nome: "Informações", Icone: BookOpen },
    { id: "estoque", nome: "Estoque", Icone: Package },
  ] as const;

  return (
    <div className="funcionario-app">
      <style>{`
        .funcionario-app {
          min-height: 100dvh;
          background: ${FUNDO};
          color: #f5f7fa;
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .funcionario-app * {
          box-sizing: border-box;
        }

        .funcionario-app button {
          font-family: inherit;
          cursor: pointer;
        }

        .funcionario-cabecalho {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 20px;
          background: #0b1119;
          border-bottom: 1px solid ${BORDA};
        }

        .funcionario-icone-botao {
          width: 43px;
          height: 43px;
          border: 1px solid ${BORDA};
          border-radius: 12px;
          color: #fff;
          background: #151e29;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .funcionario-logo {
          text-align: center;
          line-height: 1;
        }

        .funcionario-logo-principal {
          font-size: 28px;
          font-weight: 900;
          color: ${LARANJA};
          letter-spacing: -1.2px;
        }

        .funcionario-logo-secundaria {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-align: right;
          margin-right: 3px;
        }

        .funcionario-perfil {
          font-size: 12px;
          color: #aebaca;
          white-space: nowrap;
        }

        .funcionario-conteudo {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 18px 110px;
        }

        .funcionario-titulo {
          font-size: 27px;
          margin: 0 0 8px;
          font-weight: 800;
        }

        .funcionario-subtitulo {
          color: #9facbe;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 25px;
        }

        .funcionario-grade {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .funcionario-card {
          background: ${CARTAO};
          border: 1px solid ${BORDA};
          border-radius: 17px;
          padding: 22px;
          color: white;
          text-align: left;
          min-width: 0;
        }

        .funcionario-card:hover {
          border-color: ${LARANJA};
        }

        .funcionario-card-icone {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          background: #38200f;
          color: ${LARANJA};
          margin-bottom: 18px;
        }

        .funcionario-card-titulo {
          display: block;
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .funcionario-card-texto {
          color: #9facbe;
          font-size: 13px;
          line-height: 1.5;
        }

        .funcionario-destaque {
          margin-bottom: 24px;
          padding: 24px;
          border-radius: 18px;
          background: linear-gradient(135deg, #39200f, #141a23);
          border: 1px solid #74401d;
        }

        .funcionario-destaque h2 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .funcionario-destaque p {
          color: #d5c3b7;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .funcionario-barra-inferior {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          background: #0b1119;
          border-top: 1px solid ${BORDA};
          display: flex;
          justify-content: center;
          padding: 9px 12px max(9px, env(safe-area-inset-bottom));
        }

        .funcionario-navegacao {
          width: 100%;
          max-width: 650px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .funcionario-nav-item {
          border: none;
          background: transparent;
          color: #a4b0c1;
          border-radius: 12px;
          min-height: 59px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
        }

        .funcionario-nav-item.ativo {
          background: #38200f;
          color: ${LARANJA};
        }

        .funcionario-sombra-menu {
          position: fixed;
          inset: 0;
          z-index: 29;
          background: rgba(0, 0, 0, 0.65);
        }

        .funcionario-menu-lateral {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 30;
          width: min(310px, 85vw);
          background: #101720;
          border-right: 1px solid ${BORDA};
          padding: 25px 16px;
          box-shadow: 15px 0 40px rgba(0, 0, 0, 0.4);
        }

        .funcionario-menu-topo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 35px;
        }

        .funcionario-menu-opcao {
          width: 100%;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: white;
          padding: 16px 13px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .funcionario-menu-opcao:hover {
          background: #1c2835;
        }

        .funcionario-menu-opcao svg {
          color: ${LARANJA};
        }

        .funcionario-pagina-card {
          background: ${CARTAO};
          border: 1px solid ${BORDA};
          border-radius: 17px;
          padding: 24px;
          margin-bottom: 16px;
        }

        .funcionario-pagina-card h2 {
          font-size: 18px;
          margin: 0 0 12px;
        }

        .funcionario-pagina-card p {
          color: #9facbe;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .funcionario-botao-laranja {
          border: none;
          background: ${LARANJA};
          color: white;
          padding: 14px 18px;
          border-radius: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .funcionario-opcoes-estoque {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        @media (min-width: 850px) {
          .funcionario-grade {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .funcionario-conteudo {
            padding-top: 40px;
          }

          .funcionario-card {
            min-height: 210px;
          }
        }

        @media (max-width: 480px) {
          .funcionario-cabecalho {
            padding: 0 13px;
          }

          .funcionario-logo-principal {
            font-size: 24px;
          }

          .funcionario-perfil {
            font-size: 10px;
          }

          .funcionario-card {
            padding: 17px 14px;
          }

          .funcionario-card-titulo {
            font-size: 15px;
          }

          .funcionario-titulo {
            font-size: 24px;
          }
        }
      `}</style>

      <header className="funcionario-cabecalho">
        <button
          type="button"
          className="funcionario-icone-botao"
          aria-label="Abrir menu"
          onClick={() => setMenuAberto(true)}
        >
          <Menu size={23} />
        </button>

        <div className="funcionario-logo">
          <div className="funcionario-logo-principal">Marcos</div>
          <span className="funcionario-logo-secundaria">
            magazine
          </span>
        </div>

        <span className="funcionario-perfil">
          Funcionário
        </span>
      </header>

      <main className="funcionario-conteudo">
        {tela === "inicio" && (
          <>
            <h1 className="funcionario-titulo">
              Início
            </h1>

            <p className="funcionario-subtitulo">
              Bem-vindo ao sistema interno da Marcos Magazine.
            </p>

            <div className="funcionario-destaque">
              <h2>Seu trabalho mais organizado.</h2>
              <p>
                Consulte peças, acesse informações técnicas,
                acompanhe o estoque e organize os pedidos
                da loja em um só lugar.
              </p>
            </div>

            <div className="funcionario-grade">
              <button
                type="button"
                className="funcionario-card"
                onClick={() => navegar("pecas")}
              >
                <span className="funcionario-card-icone">
                  <Wrench size={25} />
                </span>
                <span className="funcionario-card-titulo">
                  Consultar Peças
                </span>
                <span className="funcionario-card-texto">
                  Pesquise os preços de peças e componentes.
                </span>
              </button>

              <button
                type="button"
                className="funcionario-card"
                onClick={() => navegar("informacoes")}
              >
                <span className="funcionario-card-icone">
                  <BookOpen size={25} />
                </span>
                <span className="funcionario-card-titulo">
                  Informações
                </span>
                <span className="funcionario-card-texto">
                  Consulte orientações técnicas cadastradas.
                </span>
              </button>

              <button
                type="button"
                className="funcionario-card"
                onClick={() => navegar("estoque")}
              >
                <span className="funcionario-card-icone">
                  <Package size={25} />
                </span>
                <span className="funcionario-card-titulo">
                  Estoque
                </span>
                <span className="funcionario-card-texto">
                  Organize capas e películas por modelo.
                </span>
              </button>

              <button
                type="button"
                className="funcionario-card"
                onClick={() => navegar("pedidos")}
              >
                <span className="funcionario-card-icone">
                  <ClipboardList size={25} />
                </span>
                <span className="funcionario-card-titulo">
                  Pedidos Especiais
                </span>
                <span className="funcionario-card-texto">
                  Acompanhe produtos encomendados pelos clientes.
                </span>
              </button>
            </div>
          </>
        )}

        {tela === "pecas" && (
          <>
            <h1 className="funcionario-titulo">
              Consultar Peças
            </h1>
            <p className="funcionario-subtitulo">
              Consulte os preços cadastrados no sistema.
            </p>

            <div className="funcionario-pagina-card">
              <button type="button" className="funcionario-botao-laranja"
                onClick={() => navegar("solicitacao")}>
                <ClipboardList size={20} /> Enviar para o técnico
              </button>
            </div>

            <div className="funcionario-pagina-card">
              <h2>Pesquisa de peças</h2>
              <p>
                A pesquisa existente será integrada a esta
                interface na próxima etapa.
              </p>
            </div>
          </>
        )}

        {tela === "solicitacao" && (
          <>
            <h1 className="funcionario-titulo">Enviar para o técnico</h1>
            <p className="funcionario-subtitulo">
              Preencha os dados do serviço. A solicitação será salva no Supabase.
            </p>
            <div className="funcionario-pagina-card">
              <form className="funcionario-formulario" onSubmit={(e) => void enviarSolicitacao(e)}>
                <label className="funcionario-campo">
                  Nome do cliente
                  <input required maxLength={150} value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)} />
                </label>
                <label className="funcionario-campo">
                  Modelo do celular
                  <input required maxLength={150} value={modeloCelular}
                    onChange={(e) => setModeloCelular(e.target.value)} />
                </label>
                <label className="funcionario-campo">
                  Serviço solicitado
                  <input required maxLength={250} value={servico}
                    onChange={(e) => setServico(e.target.value)}
                    placeholder="Ex.: Troca de tela" />
                </label>
                <label className="funcionario-campo">
                  Peça / observações (opcional)
                  <textarea value={descricaoPeca}
                    onChange={(e) => setDescricaoPeca(e.target.value)}
                    placeholder="Informe a peça e detalhes do serviço" />
                </label>
                <button type="submit" disabled={enviando}
                  className="funcionario-botao-laranja">
                  {enviando ? "Enviando..." : "Enviar para o técnico"}
                </button>
                {mensagem && <p role="status" className="funcionario-mensagem">{mensagem}</p>}
              </form>
            </div>
          </>
        )}

        {tela === "informacoes" && (
          <>
            <h1 className="funcionario-titulo">
              Informações
            </h1>
            <p className="funcionario-subtitulo">
              Conteúdos técnicos da Marcos Magazine.
            </p>

            <div className="funcionario-pagina-card">
              <h2>Informações técnicas</h2>
              <p>
                Os conteúdos já cadastrados serão conectados
                a esta tela na próxima etapa.
              </p>
            </div>
          </>
        )}

        {tela === "estoque" && (
          <>
            <h1 className="funcionario-titulo">
              Estoque
            </h1>

            <p className="funcionario-subtitulo">
              Controle manual de capas e películas.
            </p>

            <div className="funcionario-opcoes-estoque">
              <button
                type="button"
                className="funcionario-card"
                onClick={() =>
                  alert(
                    "O cadastro de capas será implementado na próxima etapa."
                  )
                }
              >
                <span className="funcionario-card-icone">
                  <Smartphone size={26} />
                </span>
                <span className="funcionario-card-titulo">
                  Capas
                </span>
                <span className="funcionario-card-texto">
                  Fotos, modelos, quantidades e reposição.
                </span>
              </button>

              <button
                type="button"
                className="funcionario-card"
                onClick={() =>
                  alert(
                    "O cadastro de películas será implementado na próxima etapa."
                  )
                }
              >
                <span className="funcionario-card-icone">
                  <Search size={26} />
                </span>
                <span className="funcionario-card-titulo">
                  Películas
                </span>
                <span className="funcionario-card-texto">
                  Tipos, quantidades e necessidade de compra.
                </span>
              </button>
            </div>
          </>
        )}

        {tela === "compras" && (
          <>
            <h1 className="funcionario-titulo">
              Lista de Compras
            </h1>
            <p className="funcionario-subtitulo">
              Produtos que precisam ser comprados.
            </p>

            <div className="funcionario-pagina-card">
              <h2>Reposição de estoque</h2>
              <p>
                Aqui reuniremos as quantidades informadas
                manualmente pelos funcionários.
              </p>
            </div>
          </>
        )}

        {tela === "pedidos" && (
          <>
            <h1 className="funcionario-titulo">
              Pedidos Especiais
            </h1>
            <p className="funcionario-subtitulo">
              Encomendas de produtos solicitados por clientes.
            </p>

            <div className="funcionario-pagina-card">
              <h2>Encomendas da loja</h2>
              <p>
                Nesta área construiremos o cadastro e
                acompanhamento de pedidos especiais.
              </p>
            </div>
          </>
        )}
      </main>

      <nav
        className="funcionario-barra-inferior"
        aria-label="Navegação principal"
      >
        <div className="funcionario-navegacao">
          {itensInferiores.map(({ id, nome, Icone }) => (
            <button
              key={id}
              type="button"
              className={
                "funcionario-nav-item" +
                (tela === id ? " ativo" : "")
              }
              onClick={() => navegar(id)}
            >
              <Icone size={22} />
              <span>{nome}</span>
            </button>
          ))}
        </div>
      </nav>

      {menuAberto && (
        <>
          <div
            className="funcionario-sombra-menu"
            onClick={() => setMenuAberto(false)}
          />

          <aside className="funcionario-menu-lateral">
            <div className="funcionario-menu-topo">
              <strong style={{ color: LARANJA, fontSize: 19 }}>
                Marcos Magazine
              </strong>

              <button
                type="button"
                className="funcionario-icone-botao"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
              >
                <X size={21} />
              </button>
            </div>

            <button type="button" className="funcionario-menu-opcao"
              onClick={() => navegar("solicitacao")}>
              <ClipboardList size={21} />
              <span style={{ flex: 1 }}>Enviar para o técnico</span>
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              className="funcionario-menu-opcao"
              onClick={() => navegar("compras")}
            >
              <ShoppingCart size={21} />
              <span style={{ flex: 1 }}>Lista de Compras</span>
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              className="funcionario-menu-opcao"
              onClick={() => navegar("pedidos")}
            >
              <ClipboardList size={21} />
              <span style={{ flex: 1 }}>Pedidos Especiais</span>
              <ChevronRight size={17} />
            </button>

            <div
              style={{
                height: 1,
                background: BORDA,
                margin: "20px 0",
              }}
            />

            <button
              type="button"
              className="funcionario-menu-opcao"
              onClick={() => void onSair()}
            >
              <LogOut size={21} />
              <span>Sair</span>
            </button>
          </aside>
        </>
      )}
    </div>
  );
}
