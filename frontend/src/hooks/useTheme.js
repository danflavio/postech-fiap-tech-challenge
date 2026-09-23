import { useCallback, useEffect, useState } from 'react';

// Lê o tema atual direto do <html data-theme="...">.
// O index.html já definiu esse atributo antes da primeira pintura,
// então aqui só refletimos o estado para o React.
const temaDoDocumento = () =>
  (typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme')) ||
  'light';

export const useTheme = () => {
  const [tema, setTema] = useState(temaDoDocumento);

  // Sempre que o tema muda: aplica no <html> e persiste no navegador.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try {
      localStorage.setItem('theme', tema);
    } catch {
      // se o localStorage estiver bloqueado, apenas ignoramos
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }, []);

  return { tema, alternarTema };
};
