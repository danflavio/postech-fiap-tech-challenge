import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Calendar,
  User as UserIcon,
  MessageSquare,
  CheckCircle2,
  Wrench,
  Star,
} from 'lucide-react';
import {
  obterOcorrencia,
  adicionarComentario,
  atualizarStatus,
  avaliarOcorrencia,
} from '../services/ocorrencias';
import { useAuth } from '../hooks/useAuth';

const STATUS = ['Aberta', 'Em análise', 'Em atendimento', 'Resolvida', 'Cancelada'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

const slug = (valor) => valor.toLowerCase().replace(/\s+/g, '-');

export const DetalheOcorrencia = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isGestor = user.perfil === 'gestor';

  const [ocorrencia, setOcorrencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [gestorForm, setGestorForm] = useState({
    novo_status: '',
    prioridade: '',
    observacao: '',
    solucao_aplicada: '',
  });
  const [notaAvaliacao, setNotaAvaliacao] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [avaliando, setAvaliando] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await obterOcorrencia(id);
        if (!active) return;
        setOcorrencia(data);
        setGestorForm({
          novo_status: data.status,
          prioridade: data.prioridade,
          observacao: '',
          solucao_aplicada: data.solucao_aplicada || '',
        });
        setError('');
      } catch {
        if (active) setError('Ocorrência não encontrada.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const handleComentar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setEnviando(true);

    try {
      const { data } = await adicionarComentario(id, texto);
      setOcorrencia((prev) => ({
        ...prev,
        comentarios: [
          ...prev.comentarios,
          {
            ...data.comentario,
            usuario_nome: user.nome,
            usuario_perfil: user.perfil,
          },
        ],
      }));
      setTexto('');
    } catch {
      setError('Não foi possível enviar o comentário.');
    } finally {
      setEnviando(false);
    }
  };

  const handleGestorChange = (e) => {
    setGestorForm({ ...gestorForm, [e.target.name]: e.target.value });
  };

  const handleAtualizar = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      await atualizarStatus(id, gestorForm);
      setReloadKey((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível atualizar.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAvaliar = async (e) => {
    e.preventDefault();
    if (notaAvaliacao < 1) {
      setError('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setAvaliando(true);

    try {
      await avaliarOcorrencia(id, {
        nota: notaAvaliacao,
        comentario: comentarioAvaliacao,
      });
      setError('');
      setReloadKey((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível registrar a avaliação.');
    } finally {
      setAvaliando(false);
    }
  };

  if (loading) return <p className="muted">Carregando...</p>;
  if (error && !ocorrencia) return <p className="error">{error}</p>;

  // Regras de exibição do bloco de avaliação
  const jaAvaliada = Boolean(ocorrencia.avaliada_em);
  const ehSolicitanteDono =
    user.perfil === 'solicitante' && ocorrencia.solicitante_id === user.id;
  const podeAvaliar =
    ehSolicitanteDono && ocorrencia.status === 'Resolvida' && !jaAvaliada;

  return (
    <div className="detalhe">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <header className="detalhe-header">
        <div>
          <h1>{ocorrencia.titulo}</h1>
          <div className="card-top">
            <span className={`badge status-${slug(ocorrencia.status)}`}>
              {ocorrencia.status}
            </span>
            <span className={`badge prioridade-${slug(ocorrencia.prioridade)}`}>
              {ocorrencia.prioridade}
            </span>
          </div>
        </div>
      </header>

      <p className="descricao">{ocorrencia.descricao}</p>

      {ocorrencia.imagem_url && (
        <img
          className="detalhe-imagem"
          src={ocorrencia.imagem_url}
          alt={ocorrencia.titulo}
        />
      )}

      <div className="detalhe-meta">
        <span>
          <Tag size={15} />
          {ocorrencia.categoria}
        </span>
        <span>
          <MapPin size={15} />
          {ocorrencia.localizacao}
        </span>
        <span>
          <UserIcon size={15} />
          {ocorrencia.solicitante_nome}
        </span>
        <span>
          <Calendar size={15} />
          {new Date(ocorrencia.criado_em).toLocaleString('pt-BR')}
        </span>
      </div>

      {ocorrencia.solucao_aplicada && (
        <div className="solucao">
          <h3>
            <CheckCircle2 size={16} />
            Solução aplicada
          </h3>
          <p>{ocorrencia.solucao_aplicada}</p>
        </div>
      )}

      {jaAvaliada && (
        <div className="avaliacao avaliacao-registrada">
          <h3>
            <Star size={16} />
            Avaliação da resolução
          </h3>
          <div className="estrelas">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={20}
                fill={n <= ocorrencia.avaliacao_nota ? '#f5b301' : 'none'}
                color="#f5b301"
              />
            ))}
            <span className="nota-texto">{ocorrencia.avaliacao_nota} / 5</span>
          </div>
          {ocorrencia.avaliacao_comentario && (
            <p className="avaliacao-comentario">{ocorrencia.avaliacao_comentario}</p>
          )}
          <small>
            Avaliada em {new Date(ocorrencia.avaliada_em).toLocaleString('pt-BR')}
          </small>
        </div>
      )}

      {podeAvaliar && (
        <section className="secao avaliacao">
          <h2>
            <Star size={18} />
            Avaliar a resolução
          </h2>
          <p className="muted">
            Sua ocorrência foi resolvida. Como você avalia o atendimento?
          </p>

          <form onSubmit={handleAvaliar}>
            <div
              className="estrelas estrelas-input"
              onMouseLeave={() => setHoverNota(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className="estrela-btn"
                  onClick={() => setNotaAvaliacao(n)}
                  onMouseEnter={() => setHoverNota(n)}
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                >
                  <Star
                    size={28}
                    fill={n <= (hoverNota || notaAvaliacao) ? '#f5b301' : 'none'}
                    color="#f5b301"
                  />
                </button>
              ))}
            </div>

            <label>
              Comentário (opcional)
              <textarea
                rows={2}
                placeholder="Conte como foi a resolução..."
                value={comentarioAvaliacao}
                onChange={(e) => setComentarioAvaliacao(e.target.value)}
              />
            </label>

            <button type="submit" className="btn-primary" disabled={avaliando}>
              {avaliando ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </form>
        </section>
      )}

      {isGestor && (
        <section className="secao painel-gestor">
          <h2>
            <Wrench size={18} />
            Ações do gestor
          </h2>

          <form onSubmit={handleAtualizar}>
            <div className="form-row">
              <label>
                Status
                <select
                  name="novo_status"
                  value={gestorForm.novo_status}
                  onChange={handleGestorChange}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Prioridade
                <select
                  name="prioridade"
                  value={gestorForm.prioridade}
                  onChange={handleGestorChange}
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Observação
              <textarea
                name="observacao"
                rows={2}
                placeholder="Motivo da mudança (vai para o histórico)"
                value={gestorForm.observacao}
                onChange={handleGestorChange}
              />
            </label>

            <label>
              Solução aplicada
              <textarea
                name="solucao_aplicada"
                rows={2}
                placeholder="Descreva a solução (opcional)"
                value={gestorForm.solucao_aplicada}
                onChange={handleGestorChange}
              />
            </label>

            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Atualizar ocorrência'}
            </button>
          </form>
        </section>
      )}

      <section className="secao">
        <h2>Histórico</h2>
        <ul className="timeline">
          {ocorrencia.historico.map((h) => (
            <li key={h.id}>
              <div className="timeline-top">
                <strong>
                  {h.status_anterior
                    ? `${h.status_anterior} → ${h.novo_status}`
                    : h.novo_status}
                </strong>
                <span>{new Date(h.data_horario).toLocaleString('pt-BR')}</span>
              </div>
              <p>{h.observacao}</p>
              <small>{h.usuario_nome}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao">
        <h2>
          <MessageSquare size={18} />
          Comentários ({ocorrencia.comentarios.length})
        </h2>

        {ocorrencia.comentarios.length === 0 ? (
          <p className="muted">Nenhum comentário ainda.</p>
        ) : (
          <ul className="comentarios">
            {ocorrencia.comentarios.map((c) => (
              <li key={c.id}>
                <div className="comentario-top">
                  <strong>{c.usuario_nome}</strong>
                  <span>{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
                </div>
                <p>{c.texto}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="comentario-form" onSubmit={handleComentar}>
          <textarea
            rows={2}
            placeholder="Escreva um comentário..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Comentar'}
          </button>
        </form>
      </section>
    </div>
  );
};
