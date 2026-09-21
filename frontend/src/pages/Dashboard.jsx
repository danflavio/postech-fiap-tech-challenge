import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Tag, Calendar } from 'lucide-react';
import { listarOcorrencias } from '../services/ocorrencias';
import { useAuth } from '../hooks/useAuth';

const STATUS = ['Aberta', 'Em análise', 'Em atendimento', 'Resolvida', 'Cancelada'];
const CATEGORIAS = [
  'Infraestrutura',
  'Iluminação',
  'Limpeza',
  'Segurança',
  'Outros',
];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

const slug = (valor) => valor.toLowerCase().replace(/\s+/g, '-');

export const Dashboard = () => {
  const { user } = useAuth();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    status: '',
    categoria: '',
    prioridade: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await listarOcorrencias(filtros);
        if (!active) return;
        setOcorrencias(data);
        setError('');
      } catch {
        if (active) setError('Não foi possível carregar as ocorrências.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [filtros]);

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>Ocorrências</h1>
          <p>
            {user.perfil === 'gestor'
              ? 'Todas as ocorrências registradas'
              : 'Acompanhe as ocorrências que você registrou'}
          </p>
        </div>

        <Link to="/ocorrencias/nova" className="btn-primary">
          <Plus size={18} />
          Nova ocorrência
        </Link>
      </header>

      <div className="filters">
        <select name="status" value={filtros.status} onChange={handleFiltro}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select name="categoria" value={filtros.categoria} onChange={handleFiltro}>
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="prioridade"
          value={filtros.prioridade}
          onChange={handleFiltro}
        >
          <option value="">Todas as prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Carregando ocorrências...</p>
      ) : ocorrencias.length === 0 ? (
        <p className="muted">Nenhuma ocorrência encontrada.</p>
      ) : (
        <div className="ocorrencias-grid">
          {ocorrencias.map((o) => (
            <Link key={o.id} to={`/ocorrencias/${o.id}`} className="ocorrencia-card">
              <div className="card-top">
                <span className={`badge status-${slug(o.status)}`}>{o.status}</span>
                <span className={`badge prioridade-${slug(o.prioridade)}`}>
                  {o.prioridade}
                </span>
              </div>

              <h2>{o.titulo}</h2>
              <p className="descricao">{o.descricao}</p>

              <div className="card-meta">
                <span>
                  <Tag size={14} />
                  {o.categoria}
                </span>
                <span>
                  <MapPin size={14} />
                  {o.localizacao}
                </span>
                <span>
                  <Calendar size={14} />
                  {new Date(o.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
