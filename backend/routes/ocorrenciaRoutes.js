import express from 'express';
import {
  criarOcorrencia,
  listarOcorrencias,
  obterOcorrenciaPorId,
  atualizarStatus,
  avaliarOcorrencia,
} from '../controllers/ocorrenciaController.js';
import { adicionarComentario } from '../controllers/comentarioController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizePerfil } from '../middlewares/authorizePerfil.js';

const router = express.Router();

// Protege todas as rotas
router.use(authenticateToken);

router.post('/', criarOcorrencia);
router.get('/', listarOcorrencias);
router.get('/:id', obterOcorrenciaPorId);
router.patch('/:id/status', authorizePerfil('gestor'), atualizarStatus);

// Rota de Avaliação da resolução (Solicitante dono)
router.post('/:id/avaliacao', avaliarOcorrencia);

// Rota de Comentários
router.post('/:id/comentarios', adicionarComentario);

export default router;
