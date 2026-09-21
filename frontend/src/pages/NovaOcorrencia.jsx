import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarOcorrencia } from '../services/ocorrencias';

const CATEGORIAS = [
  'Infraestrutura',
  'Iluminação',
  'Limpeza',
  'Segurança',
  'Outros',
];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const NovaOcorrencia = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Infraestrutura',
    localizacao: '',
    prioridade: 'Média',
    imagem_url: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await criarOcorrencia(form);
      navigate(`/ocorrencias/${data.ocorrencia.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>Nova ocorrência</h1>

        {error && <p className="error">{error}</p>}

        <label>
          Título
          <input
            type="text"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Descrição
          <textarea
            name="descricao"
            rows={4}
            value={form.descricao}
            onChange={handleChange}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Categoria
            <select name="categoria" value={form.categoria} onChange={handleChange}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label>
            Prioridade
            <select
              name="prioridade"
              value={form.prioridade}
              onChange={handleChange}
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
          Localização
          <input
            type="text"
            name="localizacao"
            value={form.localizacao}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          URL da imagem (opcional)
          <input
            type="url"
            name="imagem_url"
            value={form.imagem_url}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar ocorrência'}
        </button>
      </form>
    </div>
  );
};
