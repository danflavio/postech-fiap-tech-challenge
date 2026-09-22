import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarOcorrencia } from '../services/ocorrencias';
import { comprimirImagem, formatarBytes } from '../utils/comprimirImagem';

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
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Infraestrutura',
    localizacao: '',
    prioridade: 'Média',
  });
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState('');
  const [infoImagem, setInfoImagem] = useState('');
  const [comprimindo, setComprimindo] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const previewRef = useRef('');

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const definirPreview = (url) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      definirPreview('');
      setImagem(null);
      setInfoImagem('');
      return;
    }

    // Mostra a original imediatamente e comprime em segundo plano.
    definirPreview(URL.createObjectURL(file));
    setImagem(file);
    setInfoImagem(`Imagem: ${formatarBytes(file.size)}`);
    setComprimindo(true);

    try {
      const comprimida = await comprimirImagem(file);
      setImagem(comprimida);

      if (comprimida !== file) {
        definirPreview(URL.createObjectURL(comprimida));
        setInfoImagem(
          `Imagem otimizada: ${formatarBytes(file.size)} → ${formatarBytes(comprimida.size)}`,
        );
      }
    } catch {
      setInfoImagem(`Imagem: ${formatarBytes(file.size)}`);
    } finally {
      setComprimindo(false);
    }
  };

  const handleRemoverImagem = () => {
    setImagem(null);
    definirPreview('');
    setInfoImagem('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (imagem) {
        data.append('imagem', imagem);
      }

      const response = await criarOcorrencia(data);
      navigate(`/ocorrencias/${response.data.ocorrencia.id}`);
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
          Imagem (opcional)
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </label>

        {preview && (
          <div className="preview-imagem">
            <img src={preview} alt="Pré-visualização da imagem" />
            {infoImagem && <small className="upload-info">{infoImagem}</small>}
            <button type="button" className="btn-secundario" onClick={handleRemoverImagem}>
              Remover imagem
            </button>
          </div>
        )}

        <button type="submit" disabled={loading || comprimindo}>
          {loading
            ? 'Registrando...'
            : comprimindo
              ? 'Otimizando imagem...'
              : 'Registrar ocorrência'}
        </button>
      </form>
    </div>
  );
};
