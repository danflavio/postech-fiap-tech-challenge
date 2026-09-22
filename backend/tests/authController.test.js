import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { register, login } from '../controllers/authController.js';
import { dbMock, responder, linhas, nenhuma } from './dbMock.js';
import { criarRes } from './resMock.js';

process.env.JWT_SECRET = 'segredo_de_teste';

beforeEach(() => dbMock.resetar());

// ---------------------------------------------------------- register
test('register: campos obrigatórios ausentes → 400', async () => {
  const req = { body: { nome: 'Ana' } };
  const res = criarRes();

  await register(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(dbMock.chamadas.length, 0);
});

test('register: e-mail já cadastrado → 400', async () => {
  dbMock.usar(responder({ 'SELECT id FROM usuarios': linhas([{ id: 1 }]) }));

  const req = { body: { nome: 'Ana', email: 'ana@a.com', senha: 'x' } };
  const res = criarRes();

  await register(req, res);

  assert.equal(res.statusCode, 400);
});

test('register: sucesso → 201 e a senha é gravada como hash (nunca em texto puro)', async () => {
  dbMock.usar(
    responder({
      'SELECT id FROM usuarios': nenhuma(),
      'INSERT INTO usuarios': linhas([
        { id: 2, nome: 'Ana', email: 'ana@a.com', perfil: 'solicitante' },
      ]),
    }),
  );

  const req = { body: { nome: 'Ana', email: 'ana@a.com', senha: 'senha123' } };
  const res = criarRes();

  await register(req, res);

  assert.equal(res.statusCode, 201);
  const insert = dbMock.chamadaCom('INSERT INTO usuarios');
  assert.notEqual(insert.params[2], 'senha123');
  assert.ok(await bcrypt.compare('senha123', insert.params[2]));
});

// ---------------------------------------------------------- login
test('login: campos ausentes → 400', async () => {
  const req = { body: { email: 'ana@a.com' } };
  const res = criarRes();

  await login(req, res);

  assert.equal(res.statusCode, 400);
});

test('login: usuário não encontrado → 401', async () => {
  dbMock.usar(responder({ 'SELECT * FROM usuarios': nenhuma() }));

  const req = { body: { email: 'nao@existe.com', senha: 'x' } };
  const res = criarRes();

  await login(req, res);

  assert.equal(res.statusCode, 401);
});

test('login: senha incorreta → 401', async () => {
  const hash = await bcrypt.hash('senha_certa', 10);
  dbMock.usar(
    responder({
      'SELECT * FROM usuarios': linhas([
        { id: 1, nome: 'Ana', email: 'ana@a.com', perfil: 'gestor', senha: hash },
      ]),
    }),
  );

  const req = { body: { email: 'ana@a.com', senha: 'senha_errada' } };
  const res = criarRes();

  await login(req, res);

  assert.equal(res.statusCode, 401);
});

test('login: sucesso → token JWT e dados do usuário (sem a senha)', async () => {
  const hash = await bcrypt.hash('senha_certa', 10);
  dbMock.usar(
    responder({
      'SELECT * FROM usuarios': linhas([
        { id: 1, nome: 'Ana', email: 'ana@a.com', perfil: 'gestor', senha: hash },
      ]),
    }),
  );

  const req = { body: { email: 'ana@a.com', senha: 'senha_certa' } };
  const res = criarRes();

  await login(req, res);

  assert.ok(res.body.token);
  assert.equal(res.body.user.perfil, 'gestor');
  assert.equal(res.body.user.id, 1);
  assert.equal(res.body.user.senha, undefined);
});
