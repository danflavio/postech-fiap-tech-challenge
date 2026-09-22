import express from 'express';
import {
  criarOcorrencia,
  listarOcorrencias,
  obterOcorrenciaPorId,
  atualizarStatus,
  avaliarOcorrencia,
  listarGestores,
} from '../controllers/ocorrenciaController.js';
import { adicionarComentario } from '../controllers/comentarioController.js';
import { obterIndicadores } from '../controllers/indicadoresController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizePerfil } from '../middlewares/authorizePerfil.js';
import { uploadImagem } from '../middlewares/upload.js';

const router = express.Router();

// Protege todas as rotas
router.use(authenticateToken);

router.post('/', uploadImagem, criarOcorrencia);
router.get('/', listarOcorrencias);

// Indicadores (somente gestor) — deve vir ANTES de '/:id'
router.get('/indicadores', authorizePerfil('gestor'), obterIndicadores);

// Lista de gestores para atribuição de responsável (somente gestor)
// Também precisa vir ANTES de '/:id' para não ser capturado como parâmetro.
router.get('/gestores', authorizePerfil('gestor'), listarGestores);

router.get('/:id', obterOcorrenciaPorId);
router.patch('/:id/status', authorizePerfil('gestor'), atualizarStatus);

// Rota de Avaliação da resolução (Solicitante dono)
router.post('/:id/avaliacao', avaliarOcorrencia);

// Rota de Comentários
router.post('/:id/comentarios', adicionarComentario);

export default router;
