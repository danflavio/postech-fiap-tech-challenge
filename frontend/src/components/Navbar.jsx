import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Resolve Aí
      </Link>

      {user && (
        <div className="nav-user">
          <span className="nav-profile">
            <User size={16} />
            {user.nome} · {user.perfil}
          </span>

          <button type="button" className="btn-ghost" onClick={logout}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </nav>
  );
};
