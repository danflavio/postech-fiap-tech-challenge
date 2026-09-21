import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizePerfil } from '../middlewares/authorizePerfil.js';
import { criarRes } from './resMock.js';

test('perfil permitido: chama next e não responde erro', () => {
  const req = { user: { perfil: 'gestor' } };
  const res = criarRes();
  let chamouNext = false;

  authorizePerfil('gestor')(req, res, () => {
    chamouNext = true;
  });

  assert.equal(chamouNext, true);
  assert.equal(res.statusCode, null);
});

test('perfil não permitido: responde 403 e não chama next', () => {
  const req = { user: { perfil: 'solicitante' } };
  const res = criarRes();
  let chamouNext = false;

  authorizePerfil('gestor')(req, res, () => {
    chamouNext = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(chamouNext, false);
});

test('sem usuário (não autenticado): responde 403', () => {
  const req = {};
  const res = criarRes();
  let chamouNext = false;

  authorizePerfil('gestor')(req, res, () => {
    chamouNext = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(chamouNext, false);
});
