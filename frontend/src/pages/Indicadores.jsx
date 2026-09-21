import { useEffect, useState } from 'react';
import { BarChart3, Star, ListChecks, Tag, Flag } from 'lucide-react';
import { obterIndicadores } from '../services/ocorrencias';

const STATUS = ['Aberta', 'Em análise', 'Em atendimento', 'Resolvida', 'Cancelada'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

const slug = (valor) => valor.toLowerCase().replace(/\s+/g, '-');

const contar = (lista, campo, valor) => {
  const item = lista.find((i) => i[campo] === valor);
  return item ? item.total : 0;
};

export const Indicadores = () => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await obterIndicadores();
        if (!active) return;
        setDados(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              'Não foi possível carregar os indicadores.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="muted">Carregando indicadores...</p>;
  if (error) return <p className="error">{error}</p>;

  const maxCategoria = Math.max(
    1,
    ...dados.por_categoria.map((c) => c.total),
  );

  return (
    <div className="indicadores">
      <header className="page-header">
        <div>
          <h1>Indicadores</h1>
          <p>Visão geral das ocorrências</p>
        </div>
      </header>

      <div className="indicadores-top">
        <div className="indicador-destaque">
          <ListChecks size={22} />
          <span>Total de ocorrências</span>
          <strong>{dados.total}</strong>
        </div>

        <div className="indicador-destaque">
          <Star size={22} />
          <span>Avaliação média</span>
          <strong>
            {dados.avaliacoes.nota_media ?? '—'}
            <small> ({dados.avaliacoes.avaliadas} avaliadas)</small>
          </strong>
        </div>
      </div>

      <section className="secao">
        <h2>
          <BarChart3 size={18} />
          Por status
        </h2>
        <div className="indicadores-grid">
          {STATUS.map((s) => (
            <div key={s} className={`indicador-card status-${slug(s)}`}>
              <span>{s}</span>
              <strong>{contar(dados.por_status, 'status', s)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="secao">
        <h2>
          <Flag size={18} />
          Por prioridade
        </h2>
        <div className="indicadores-grid">
          {PRIORIDADES.map((p) => (
            <div key={p} className={`indicador-card prioridade-${slug(p)}`}>
              <span>{p}</span>
              <strong>{contar(dados.por_prioridade, 'prioridade', p)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="secao">
        <h2>
          <Tag size={18} />
          Por categoria
        </h2>
        <ul className="barras">
          {dados.por_categoria.map((c) => (
            <li key={c.categoria}>
              <span className="barra-label">{c.categoria}</span>
              <div className="barra-trilha">
                <div
                  className="barra-preenchida"
                  style={{ width: `${(c.total / maxCategoria) * 100}%` }}
                />
              </div>
              <span className="barra-valor">{c.total}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
