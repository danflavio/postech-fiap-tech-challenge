import { pool } from '../db.js';

// Adicionar comentário a uma ocorrência
export const adicionarComentario = async (req, res) => {
  const { id: ocorrencia_id } = req.params;
  const { texto } = req.body;
  const usuario_id = req.user.id; // Injetado pelo authMiddleware

  try {
    if (!texto) {
      return res.status(400).json({ message: 'O texto do comentário é obrigatório.' });
    }

    // Verifica se a ocorrência existe
    const ocorrenciaExists = await pool.query(
      'SELECT id, solicitante_id FROM ocorrencias WHERE id = $1',
      [ocorrencia_id],
    );

    if (ocorrenciaExists.rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência não encontrada.' });
    }

    const ocorrencia = ocorrenciaExists.rows[0];

    if (
      req.user.perfil === 'solicitante' &&
      ocorrencia.solicitante_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'Acesso negado a esta ocorrência.' });
    }

    // Insere o comentário no banco
    const newComentario = await pool.query(
      `INSERT INTO comentarios (ocorrencia_id, usuario_id, texto)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ocorrencia_id, usuario_id, texto],
    );

    res.status(201).json({
      message: 'Comentário adicionado com sucesso!',
      comentario: newComentario.rows[0],
    });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};
