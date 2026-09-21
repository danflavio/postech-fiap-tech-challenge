import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { criarRes } from './resMock.js';

process.env.JWT_SECRET = 'segredo_de_teste';

test('sem token: responde 401 e não chama next', () => {
  const req = { headers: {} };
  const res = criarRes();
  let chamouNext = false;

  authenticateToken(req, res, () => {
    chamouNext = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(chamouNext, false);
});

test('token inválido: responde 403 e não chama next', () => {
  const req = { headers: { authorization: 'Bearer token.invalido.aqui' } };
  const res = criarRes();
  let chamouNext = false;

  authenticateToken(req, res, () => {
    chamouNext = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(chamouNext, false);
});

test('token válido: injeta req.user e chama next', () => {
  const token = jwt.sign(
    { id: 7, nome: 'Teste', perfil: 'gestor' },
    process.env.JWT_SECRET,
  );
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = criarRes();
  let chamouNext = false;

  authenticateToken(req, res, () => {
    chamouNext = true;
  });

  assert.equal(chamouNext, true);
  assert.equal(req.user.id, 7);
  assert.equal(req.user.perfil, 'gestor');
});
