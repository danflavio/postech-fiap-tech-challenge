import { pool } from '../db.js';

// 1. Criar Ocorrência (Solicitante)
export const criarOcorrencia = async (req, res) => {
  const { titulo, descricao, categoria, localizacao, imagem_url, prioridade } = req.body;

  // req.user vem injetado pelo nosso authMiddleware após validar o Token JWT!
  const solicitante_id = req.user.id;

  try {
    if (!titulo || !descricao || !categoria || !localizacao) {
      return res.status(400).json({
        message: 'Título, descrição, categoria e localização são obrigatórios.',
      });
    }

    // Insere a ocorrência no banco
    const newOcorrencia = await pool.query(
      `INSERT INTO ocorrencias (titulo, descricao, categoria, localizacao, imagem_url, prioridade, solicitante_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [titulo, descricao, categoria, localizacao, imagem_url || null, prioridade || 'Média', solicitante_id],
    );

    const ocorrenciaCriada = newOcorrencia.rows[0];

    // Grava o primeiro registro de auditoria no histórico
    await pool.query(
      `INSERT INTO historico_ocorrencias (ocorrencia_id, novo_status, usuario_id, observacao)
       VALUES ($1, $2, $3, $4)`,
      [ocorrenciaCriada.id, 'Aberta', solicitante_id, 'Ocorrência registrada no sistema.'],
    );

    res.status(201).json({
      message: 'Ocorrência registrada com sucesso!',
      ocorrencia: ocorrenciaCriada,
    });
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// 2. Listar Ocorrências (Com Filtros para Gestores e Isolamento por Usuário para Solicitantes)
export const listarOcorrencias = async (req, res) => {
  const { perfil, id: usuario_id } = req.user;
  const { status, categoria, prioridade } = req.query;

  try {
    let query = `
      SELECT o.*, u.nome as solicitante_nome, g.nome as gestor_nome
      FROM ocorrencias o
      JOIN usuarios u ON o.solicitante_id = u.id
      LEFT JOIN usuarios g ON o.gestor_id = g.id
      WHERE 1=1
    `;
    const params = [];

    // Solicitante só pode visualizar as suas próprias ocorrências
    if (perfil === 'solicitante') {
      params.push(usuario_id);
      query += ` AND o.solicitante_id = $${params.length}`;
    }

    // Filtros dinâmicos (muito úteis para o Gestor no Dashboard)
    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (categoria) {
      params.push(categoria);
      query += ` AND o.categoria = $${params.length}`;
    }

    if (prioridade) {
      params.push(prioridade);
      query += ` AND o.prioridade = $${params.length}`;
    }

    query += ' ORDER BY o.criado_em DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// 3. Obter Detalhes Completos (Ocorrência + Histórico de Mudanças + Comentários)
export const obterOcorrenciaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    // Busca dados da ocorrência
    const ocorrenciaQuery = await pool.query(
      `SELECT o.*, u.nome as solicitante_nome, u.email as solicitante_email, g.nome as gestor_nome
       FROM ocorrencias o
       JOIN usuarios u ON o.solicitante_id = u.id
       LEFT JOIN usuarios g ON o.gestor_id = g.id
       WHERE o.id = $1`,
      [id],
    );

    if (ocorrenciaQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência não encontrada.' });
    }

    // Busca histórico de alterações de status
    const historicoQuery = await pool.query(
      `SELECT h.*, u.nome as usuario_nome
       FROM historico_ocorrencias h
       JOIN usuarios u ON h.usuario_id = u.id
       WHERE h.ocorrencia_id = $1
       ORDER BY h.data_horario ASC`,
      [id],
    );

    // Busca comentários
    const comentariosQuery = await pool.query(
      `SELECT c.*, u.nome as usuario_nome, u.perfil as usuario_perfil
       FROM comentarios c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.ocorrencia_id = $1
       ORDER BY c.criado_em ASC`,
      [id],
    );

    res.json({
      ...ocorrenciaQuery.rows[0],
      historico: historicoQuery.rows,
      comentarios: comentariosQuery.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da ocorrência:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// 4. Atualizar Status/Prioridade e Registrar Histórico (Gestor)
export const atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { novo_status, observacao, solucao_aplicada, prioridade, gestor_id } = req.body;
  const usuario_id = req.user.id;

  try {
    // Busca o status atual antes de mudar
    const ocorrenciaAtual = await pool.query('SELECT status FROM ocorrencias WHERE id = $1', [id]);

    if (ocorrenciaAtual.rows.length === 0) {
      return res.status(404).json({ message: 'Ocorrência não encontrada.' });
    }

    const status_anterior = ocorrenciaAtual.rows[0].status;

    // Atualiza a ocorrência no banco
    const updateResult = await pool.query(
      `UPDATE ocorrencias
       SET status = COALESCE($1, status),
           prioridade = COALESCE($2, prioridade),
           gestor_id = COALESCE($3, gestor_id),
           solucao_aplicada = COALESCE($4, solucao_aplicada),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [novo_status, prioridade, gestor_id || usuario_id, solucao_aplicada, id],
    );

    // Se houve mudança de status, salva no histórico obrigatoriamente
    if (novo_status && novo_status !== status_anterior) {
      await pool.query(
        `INSERT INTO historico_ocorrencias (ocorrencia_id, status_anterior, novo_status, usuario_id, observacao)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, status_anterior, novo_status, usuario_id, observacao || `Status alterado para ${novo_status}`],
      );
    }

    res.json({
      message: 'Ocorrência atualizada com sucesso!',
      ocorrencia: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao atualizar ocorrência:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};
