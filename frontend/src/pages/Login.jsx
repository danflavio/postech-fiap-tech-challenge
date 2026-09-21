import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', senha: '' });
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
      await login(form.email, form.senha);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Resolve Aí</h1>
        <p>Entre para acompanhar as ocorrências</p>

        {error && <p className="error">{error}</p>}

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

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p>
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
};
