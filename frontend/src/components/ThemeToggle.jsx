import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = () => {
  const { tema, alternarTema } = useTheme();
  const escuro = tema === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={alternarTema}
      aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={escuro ? 'Tema claro (Solarized Light)' : 'Tema escuro (Dracula)'}
    >
      {escuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
