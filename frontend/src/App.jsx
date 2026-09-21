import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { Dashboard } from './pages/Dashboard';
import { NovaOcorrencia } from './pages/NovaOcorrencia';
import { DetalheOcorrencia } from './pages/DetalheOcorrencia';
import { Indicadores } from './pages/Indicadores';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/ocorrencias/nova" element={<NovaOcorrencia />} />
        <Route path="/ocorrencias/:id" element={<DetalheOcorrencia />} />
        <Route path="/indicadores" element={<Indicadores />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
