import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Cadastro = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'solicitante',
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
      await register(form);
      await login(form.email, form.senha);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Criar conta</h1>
        <p>Preencha os dados para começar</p>

        {error && <p className="error">{error}</p>}

        <label>
          Nome
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            name="senha"
            value={form.senha}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Perfil
          <select name="perfil" value={form.perfil} onChange={handleChange}>
            <option value="solicitante">Solicitante</option>
            <option value="gestor">Gestor</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
};
