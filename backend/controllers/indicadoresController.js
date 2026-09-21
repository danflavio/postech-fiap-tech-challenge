import { pool } from '../db.js';

export const obterIndicadores = async (req, res) => {
  try {
    const [total, porStatus, porPrioridade, porCategoria, avaliacoes] =
      await Promise.all([
        pool.query('SELECT COUNT(*)::int AS total FROM ocorrencias'),
        pool.query(
          `SELECT status, COUNT(*)::int AS total
           FROM ocorrencias
           GROUP BY status
           ORDER BY status`,
        ),
        pool.query(
          `SELECT prioridade, COUNT(*)::int AS total
           FROM ocorrencias
           GROUP BY prioridade`,
        ),
        pool.query(
          `SELECT categoria, COUNT(*)::int AS total
           FROM ocorrencias
           GROUP BY categoria
           ORDER BY total DESC`,
        ),
        pool.query(
          `SELECT COUNT(avaliacao_nota)::int AS avaliadas,
                  ROUND(AVG(avaliacao_nota)::numeric, 2) AS nota_media
           FROM ocorrencias`,
        ),
      ]);

    res.json({
      total: total.rows[0].total,
      por_status: porStatus.rows,
      por_prioridade: porPrioridade.rows,
      por_categoria: porCategoria.rows,
      avaliacoes: avaliacoes.rows[0],
    });
  } catch (error) {
    console.error('Erro ao obter indicadores:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};
