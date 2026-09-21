import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const ocorrencias = [
  {
    titulo: 'Poste apagado na Rua das Flores',
    descricao: 'O poste em frente ao nº 120 está sem iluminação há três noites.',
    categoria: 'Iluminação',
    localizacao: 'Rua das Flores, 120',
    prioridade: 'Alta',
    status: 'Em atendimento',
    solicitante: 'carlos',
    gestor: true,
    comentario: 'Equipe de manutenção agendada para amanhã.',
    comentarioDe: 'gestor',
  },
  {
    titulo: 'Buraco na calçada em frente ao nº 42',
    descricao: 'Buraco profundo que oferece risco de queda, principalmente à noite.',
    categoria: 'Infraestrutura',
    localizacao: 'Av. Central, 42',
    prioridade: 'Urgente',
    status: 'Resolvida',
    solicitante: 'carlos',
    gestor: true,
    solucao: 'Buraco preenchido e calçada nivelada com concreto.',
    nota: 5,
    avaliacaoComentario: 'Serviço rápido e bem feito. Obrigado!',
  },
  {
    titulo: 'Lixo acumulado na praça central',
    descricao: 'Lixo e entulho acumulados há mais de uma semana na praça.',
    categoria: 'Limpeza',
    localizacao: 'Praça Central',
    prioridade: 'Média',
    status: 'Resolvida',
    solicitante: 'ana',
    gestor: true,
    solucao: 'Mutirão de limpeza realizado e lixeiras extras instaladas.',
    nota: 4,
    avaliacaoComentario: 'Melhorou bastante, mas demorou um pouco.',
  },
  {
    titulo: 'Portão da garagem quebrado',
    descricao: 'O portão automático da garagem não fecha completamente.',
    categoria: 'Infraestrutura',
    localizacao: 'Bloco B - Garagem',
    prioridade: 'Alta',
    status: 'Aberta',
    solicitante: 'ana',
  },
  {
    titulo: 'Falta de rampa de acessibilidade',
    descricao: 'A entrada principal não possui rampa para cadeirantes.',
    categoria: 'Infraestrutura',
    localizacao: 'Entrada principal',
    prioridade: 'Média',
    status: 'Em análise',
    solicitante: 'carlos',
    gestor: true,
  },
  {
    titulo: 'Câmera de segurança desligada',
    descricao: 'A câmera da entrada está sem sinal há dois dias.',
    categoria: 'Segurança',
    localizacao: 'Portaria',
    prioridade: 'Urgente',
    status: 'Em atendimento',
    solicitante: 'ana',
    gestor: true,
    comentario: 'Técnico acionado para verificar o cabeamento.',
    comentarioDe: 'gestor',
  },
  {
    titulo: 'Vazamento no encanamento do 2º andar',
    descricao: 'Vazamento constante no teto do corredor do 2º andar.',
    categoria: 'Infraestrutura',
    localizacao: '2º andar - Corredor',
    prioridade: 'Urgente',
    status: 'Resolvida',
    solicitante: 'carlos',
    gestor: true,
    solucao: 'Tubulação substituída e infiltração tratada.',
    nota: 5,
    avaliacaoComentario: 'Resolveu completamente o problema.',
  },
  {
    titulo: 'Lâmpada queimada no corredor',
    descricao: 'Lâmpada queimada no corredor do 3º andar.',
    categoria: 'Iluminação',
    localizacao: '3º andar - Corredor',
    prioridade: 'Baixa',
    status: 'Cancelada',
    solicitante: 'ana',
  },
  {
    titulo: 'Mato alto no terreno ao lado',
    descricao: 'O terreno vizinho está com mato alto e aparecimento de insetos.',
    categoria: 'Limpeza',
    localizacao: 'Terreno lateral',
    prioridade: 'Baixa',
    status: 'Aberta',
    solicitante: 'carlos',
  },
  {
    titulo: 'Troca da fechadura da portaria',
    descricao: 'A fechadura da porta da portaria está travando.',
    categoria: 'Segurança',
    localizacao: 'Portaria',
    prioridade: 'Média',
    status: 'Em análise',
    solicitante: 'ana',
    gestor: true,
  },
];

const run = async () => {
  try {
    await pool.query(
      'TRUNCATE comentarios, historico_ocorrencias, ocorrencias, usuarios RESTART IDENTITY CASCADE',
    );

    const senhaGestor = await bcrypt.hash('123456', 10);
    const senhaSolicitante = await bcrypt.hash('123', 10);

    const usuarios = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, perfil) VALUES
         ($1, $2, $3, 'gestor'),
         ($4, $5, $6, 'solicitante'),
         ($7, $8, $9, 'solicitante')
       RETURNING id, email`,
      [
        'Marina Gestora',
        'gestor@resolveai.com',
        senhaGestor,
        'Carlos Solicitante',
        'carlos@email.com',
        senhaSolicitante,
        'Ana Souza',
        'ana@email.com',
        senhaSolicitante,
      ],
    );

    const idPorEmail = Object.fromEntries(usuarios.rows.map((u) => [u.email, u.id]));
    const ids = {
      gestor: idPorEmail['gestor@resolveai.com'],
      carlos: idPorEmail['carlos@email.com'],
      ana: idPorEmail['ana@email.com'],
    };

    for (const o of ocorrencias) {
      const { rows } = await pool.query(
        `INSERT INTO ocorrencias
           (titulo, descricao, categoria, localizacao, prioridade, status,
            solicitante_id, gestor_id, solucao_aplicada,
            avaliacao_nota, avaliacao_comentario, avaliada_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          o.titulo,
          o.descricao,
          o.categoria,
          o.localizacao,
          o.prioridade,
          o.status,
          ids[o.solicitante],
          o.gestor ? ids.gestor : null,
          o.solucao || null,
          o.nota || null,
          o.avaliacaoComentario || null,
          o.nota ? new Date() : null,
        ],
      );

      const ocorrenciaId = rows[0].id;

      await pool.query(
        `INSERT INTO historico_ocorrencias
           (ocorrencia_id, status_anterior, novo_status, usuario_id, observacao)
         VALUES ($1, $2, $3, $4, $5)`,
        [ocorrenciaId, null, 'Aberta', ids[o.solicitante], 'Ocorrência registrada no sistema.'],
      );

      if (o.status !== 'Aberta') {
        await pool.query(
          `INSERT INTO historico_ocorrencias
             (ocorrencia_id, status_anterior, novo_status, usuario_id, observacao)
           VALUES ($1, $2, $3, $4, $5)`,
          [ocorrenciaId, 'Aberta', o.status, ids.gestor, `Status alterado para ${o.status}.`],
        );
      }

      if (o.comentario) {
        await pool.query(
          'INSERT INTO comentarios (ocorrencia_id, usuario_id, texto) VALUES ($1, $2, $3)',
          [ocorrenciaId, ids[o.comentarioDe], o.comentario],
        );
      }
    }

    console.log(`Seed concluído: ${usuarios.rowCount} usuários e ${ocorrencias.length} ocorrências.`);
    console.log('Gestor: gestor@resolveai.com / 123456');
    console.log('Solicitantes: carlos@email.com / 123  e  ana@email.com / 123');
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
