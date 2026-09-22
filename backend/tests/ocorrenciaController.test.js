import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarOcorrencia,
  listarOcorrencias,
  obterOcorrenciaPorId,
  atualizarStatus,
  avaliarOcorrencia,
  listarGestores,
} from '../controllers/ocorrenciaController.js';
import { dbMock, responder, linhas, nenhuma } from './dbMock.js';
import { criarRes } from './resMock.js';

beforeEach(() => dbMock.resetar());

// ---------------------------------------------------------------- criar
test('criarOcorrencia: campos obrigatórios ausentes → 400', async () => {
  const req = { body: { titulo: 'Só título' }, user: { id: 1 } };
  const res = criarRes();

  await criarOcorrencia(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(dbMock.chamadas.length, 0);
});

test('criarOcorrencia: sucesso → 201 e grava o histórico inicial', async () => {
  dbMock.usar(
    responder({
      'INSERT INTO ocorrencias': linhas([
        { id: 10, titulo: 'Buraco', status: 'Aberta', gestor_id: null },
      ]),
      'INSERT INTO historico_ocorrencias': nenhuma(),
    }),
  );

  const req = {
    body: {
      titulo: 'Buraco',
      descricao: 'Buraco na via',
      categoria: 'Infraestrutura',
      localizacao: 'Rua 1',
    },
    user: { id: 7 },
  };
  const res = criarRes();

  await criarOcorrencia(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ocorrencia.id, 10);
  assert.ok(dbMock.chamadaCom('INSERT INTO historico_ocorrencias'));
});

test('criarOcorrencia: aplica prioridade padrão e imagem nula', async () => {
  dbMock.usar(
    responder({
      'INSERT INTO ocorrencias': linhas([{ id: 11 }]),
      'INSERT INTO historico_ocorrencias': nenhuma(),
    }),
  );

  const req = {
    body: { titulo: 'T', descricao: 'D', categoria: 'C', localizacao: 'L' },
    user: { id: 7 },
  };
  const res = criarRes();

  await criarOcorrencia(req, res);

  const insert = dbMock.chamadaCom('INSERT INTO ocorrencias');
  assert.equal(insert.params[4], null); // imagem_url
  assert.equal(insert.params[5], 'Média'); // prioridade padrão
  assert.equal(insert.params[6], 7); // solicitante_id vem do token
});

// --------------------------------------------------------------- listar
test('listarOcorrencias: solicitante recebe filtro por solicitante_id', async () => {
  dbMock.usar(responder({ 'FROM ocorrencias o': linhas([]) }));

  const req = { user: { id: 42, perfil: 'solicitante' }, query: {} };
  const res = criarRes();

  await listarOcorrencias(req, res);

  const q = dbMock.chamadas[0];
  assert.match(q.sql, /o\.solicitante_id = \$1/);
  assert.equal(q.params[0], 42);
});

test('listarOcorrencias: gestor vê tudo e aplica filtros dinâmicos', async () => {
  dbMock.usar(responder({ 'FROM ocorrencias o': linhas([]) }));

  const req = {
    user: { id: 1, perfil: 'gestor' },
    query: { status: 'Aberta', categoria: 'Limpeza', prioridade: 'Alta' },
  };
  const res = criarRes();

  await listarOcorrencias(req, res);

  const q = dbMock.chamadas[0];
  assert.doesNotMatch(q.sql, /AND o\.solicitante_id/);
  assert.match(q.sql, /o\.status = \$1/);
  assert.match(q.sql, /o\.categoria = \$2/);
  assert.match(q.sql, /o\.prioridade = \$3/);
  assert.deepEqual(q.params, ['Aberta', 'Limpeza', 'Alta']);
});

// --------------------------------------------------------------- detalhe
test('obterOcorrenciaPorId: não encontrada → 404', async () => {
  dbMock.usar(responder({ 'SELECT o.*': nenhuma() }));

  const req = { params: { id: '99' }, user: { id: 1, perfil: 'gestor' } };
  const res = criarRes();

  await obterOcorrenciaPorId(req, res);

  assert.equal(res.statusCode, 404);
});

test('obterOcorrenciaPorId: solicitante dono → 200 com histórico e comentários', async () => {
  dbMock.usar(
    responder({
      'SELECT o.*': linhas([{ id: 5, solicitante_id: 3, titulo: 'X' }]),
      'SELECT h.*': linhas([{ id: 1 }]),
      'SELECT c.*': linhas([{ id: 1 }]),
    }),
  );

  const req = { params: { id: '5' }, user: { id: 3, perfil: 'solicitante' } };
  const res = criarRes();

  await obterOcorrenciaPorId(req, res);

  assert.equal(res.body.id, 5);
  assert.equal(res.body.historico.length, 1);
  assert.equal(res.body.comentarios.length, 1);
});

test('obterOcorrenciaPorId: solicitante não-dono → 403 (sem buscar detalhes)', async () => {
  dbMock.usar(
    responder({ 'SELECT o.*': linhas([{ id: 5, solicitante_id: 8 }]) }),
  );

  const req = { params: { id: '5' }, user: { id: 3, perfil: 'solicitante' } };
  const res = criarRes();

  await obterOcorrenciaPorId(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(dbMock.chamadas.length, 1);
});

test('obterOcorrenciaPorId: gestor acessa ocorrência de qualquer solicitante', async () => {
  dbMock.usar(
    responder({
      'SELECT o.*': linhas([{ id: 5, solicitante_id: 8 }]),
      'SELECT h.*': nenhuma(),
      'SELECT c.*': nenhuma(),
    }),
  );

  const req = { params: { id: '5' }, user: { id: 1, perfil: 'gestor' } };
  const res = criarRes();

  await obterOcorrenciaPorId(req, res);

  assert.equal(res.body.id, 5);
});

// --------------------------------------------------------- atualizarStatus
test('atualizarStatus: ocorrência inexistente → 404', async () => {
  dbMock.usar(responder({ 'SELECT status FROM ocorrencias': nenhuma() }));

  const req = {
    params: { id: '1' },
    body: { novo_status: 'Resolvida' },
    user: { id: 1 },
  };
  const res = criarRes();

  await atualizarStatus(req, res);

  assert.equal(res.statusCode, 404);
});

test('atualizarStatus: mudança de status registra histórico', async () => {
  dbMock.usar(
    responder({
      'SELECT status FROM ocorrencias': linhas([{ status: 'Aberta' }]),
      'UPDATE ocorrencias': linhas([{ id: 1, status: 'Em análise' }]),
      'INSERT INTO historico_ocorrencias': nenhuma(),
    }),
  );

  const req = {
    params: { id: '1' },
    body: { novo_status: 'Em análise', observacao: 'Triagem' },
    user: { id: 9 },
  };
  const res = criarRes();

  await atualizarStatus(req, res);

  const h = dbMock.chamadaCom('INSERT INTO historico_ocorrencias');
  assert.ok(h);
  assert.equal(h.params[1], 'Aberta'); // status_anterior
  assert.equal(h.params[2], 'Em análise'); // novo_status
});

test('atualizarStatus: status inalterado NÃO registra histórico', async () => {
  dbMock.usar(
    responder({
      'SELECT status FROM ocorrencias': linhas([{ status: 'Aberta' }]),
      'UPDATE ocorrencias': linhas([{ id: 1, status: 'Aberta' }]),
    }),
  );

  const req = {
    params: { id: '1' },
    body: { novo_status: 'Aberta' },
    user: { id: 9 },
  };
  const res = criarRes();

  await atualizarStatus(req, res);

  assert.equal(dbMock.chamadaCom('INSERT INTO historico_ocorrencias'), undefined);
});

// --------------------------------------------------------- avaliarOcorrencia
test('avaliarOcorrencia: nota fora de 1..5 ou não inteira → 400', async () => {
  for (const nota of [0, 6, 2.5, 'abc', null]) {
    dbMock.resetar();
    const req = { params: { id: '1' }, body: { nota }, user: { id: 1 } };
    const res = criarRes();

    await avaliarOcorrencia(req, res);

    assert.equal(res.statusCode, 400, `nota inválida aceita: ${nota}`);
    assert.equal(dbMock.chamadas.length, 0);
  }
});

test('avaliarOcorrencia: solicitante não-dono → 403', async () => {
  dbMock.usar(
    responder({
      'SELECT solicitante_id, status, avaliada_em': linhas([
        { solicitante_id: 8, status: 'Resolvida', avaliada_em: null },
      ]),
    }),
  );

  const req = { params: { id: '1' }, body: { nota: 5 }, user: { id: 3 } };
  const res = criarRes();

  await avaliarOcorrencia(req, res);

  assert.equal(res.statusCode, 403);
});

test('avaliarOcorrencia: status diferente de Resolvida → 400', async () => {
  dbMock.usar(
    responder({
      'SELECT solicitante_id, status, avaliada_em': linhas([
        { solicitante_id: 3, status: 'Em atendimento', avaliada_em: null },
      ]),
    }),
  );

  const req = { params: { id: '1' }, body: { nota: 5 }, user: { id: 3 } };
  const res = criarRes();

  await avaliarOcorrencia(req, res);

  assert.equal(res.statusCode, 400);
});

test('avaliarOcorrencia: já avaliada → 409', async () => {
  dbMock.usar(
    responder({
      'SELECT solicitante_id, status, avaliada_em': linhas([
        { solicitante_id: 3, status: 'Resolvida', avaliada_em: '2026-01-01' },
      ]),
    }),
  );

  const req = { params: { id: '1' }, body: { nota: 5 }, user: { id: 3 } };
  const res = criarRes();

  await avaliarOcorrencia(req, res);

  assert.equal(res.statusCode, 409);
});

test('avaliarOcorrencia: sucesso → 200 com a nota persistida', async () => {
  dbMock.usar(
    responder({
      'SELECT solicitante_id, status, avaliada_em': linhas([
        { solicitante_id: 3, status: 'Resolvida', avaliada_em: null },
      ]),
      'UPDATE ocorrencias': linhas([{ id: 1, avaliacao_nota: 5 }]),
    }),
  );

  const req = {
    params: { id: '1' },
    body: { nota: 5, comentario: 'Ótimo' },
    user: { id: 3 },
  };
  const res = criarRes();

  await avaliarOcorrencia(req, res);

  assert.equal(res.body.ocorrencia.avaliacao_nota, 5);
});

// --------------------------------------------------------- listarGestores
test('listarGestores: retorna id e nome dos gestores', async () => {
  dbMock.usar(
    responder({ 'FROM usuarios': linhas([{ id: 1, nome: 'Marina' }]) }),
  );

  const res = criarRes();
  await listarGestores({}, res);

  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].nome, 'Marina');
});
