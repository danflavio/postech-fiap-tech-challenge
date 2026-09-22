import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { adicionarComentario } from '../controllers/comentarioController.js';
import { dbMock, responder, linhas, nenhuma } from './dbMock.js';
import { criarRes } from './resMock.js';

beforeEach(() => dbMock.resetar());

test('adicionarComentario: texto ausente → 400', async () => {
  const req = { params: { id: '1' }, body: {}, user: { id: 1 } };
  const res = criarRes();

  await adicionarComentario(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(dbMock.chamadas.length, 0);
});

test('adicionarComentario: ocorrência inexistente → 404', async () => {
  dbMock.usar(responder({ 'FROM ocorrencias': nenhuma() }));

  const req = { params: { id: '1' }, body: { texto: 'oi' }, user: { id: 1 } };
  const res = criarRes();

  await adicionarComentario(req, res);

  assert.equal(res.statusCode, 404);
});

test('adicionarComentario: solicitante não-dono → 403', async () => {
  dbMock.usar(
    responder({ 'FROM ocorrencias': linhas([{ id: 1, solicitante_id: 9 }]) }),
  );

  const req = {
    params: { id: '1' },
    body: { texto: 'oi' },
    user: { id: 2, perfil: 'solicitante' },
  };
  const res = criarRes();

  await adicionarComentario(req, res);

  assert.equal(res.statusCode, 403);
});

test('adicionarComentario: gestor comenta em qualquer ocorrência → 201', async () => {
  dbMock.usar(
    responder({
      'FROM ocorrencias': linhas([{ id: 1, solicitante_id: 9 }]),
      'INSERT INTO comentarios': linhas([{ id: 55, texto: 'ok' }]),
    }),
  );

  const req = {
    params: { id: '1' },
    body: { texto: 'ok' },
    user: { id: 2, perfil: 'gestor' },
  };
  const res = criarRes();

  await adicionarComentario(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.comentario.id, 55);
});
