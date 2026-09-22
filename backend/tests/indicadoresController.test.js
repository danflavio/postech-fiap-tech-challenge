import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { obterIndicadores } from '../controllers/indicadoresController.js';
import { dbMock, responder, linhas } from './dbMock.js';
import { criarRes } from './resMock.js';

beforeEach(() => dbMock.resetar());

test('obterIndicadores: agrega totais por status/prioridade/categoria e avaliações', async () => {
  // A ordem das chaves importa: os fragmentos mais específicos vêm primeiro.
  dbMock.usar(
    responder({
      'GROUP BY status': linhas([
        { status: 'Aberta', total: 3 },
        { status: 'Resolvida', total: 5 },
      ]),
      'GROUP BY prioridade': linhas([{ prioridade: 'Alta', total: 4 }]),
      'GROUP BY categoria': linhas([{ categoria: 'Limpeza', total: 6 }]),
      'COUNT(avaliacao_nota)': linhas([{ avaliadas: 2, nota_media: '4.50' }]),
      'COUNT(*)::int AS total FROM ocorrencias': linhas([{ total: 10 }]),
    }),
  );

  const res = criarRes();
  await obterIndicadores({}, res);

  assert.equal(res.body.total, 10);
  assert.equal(res.body.por_status.length, 2);
  assert.equal(res.body.por_prioridade[0].total, 4);
  assert.equal(res.body.por_categoria[0].categoria, 'Limpeza');
  assert.equal(res.body.avaliacoes.nota_media, '4.50');
});

test('obterIndicadores: erro no banco → 500', async () => {
  dbMock.usar(() => {
    throw new Error('falha simulada');
  });

  const res = criarRes();
  await obterIndicadores({}, res);

  assert.equal(res.statusCode, 500);
});
