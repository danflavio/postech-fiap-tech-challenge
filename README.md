# Resolve Aí

Plataforma Full Stack (MVP) para **gestão de ocorrências** em condomínios, empresas, bairros e organizações. Usuários registram ocorrências e acompanham todo o processo até a resolução; gestores analisam, priorizam, atendem e medem os resultados.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Usuários de teste (seed)](#usuários-de-teste-seed)
- [API](#api)
- [Modelo de dados](#modelo-de-dados)
- [Ciclo de vida da ocorrência](#ciclo-de-vida-da-ocorrência)
- [Segurança](#segurança)
- [Testes](#testes)

---

## Funcionalidades

### Solicitante
- Criar conta e autenticar-se
- Registrar ocorrência (título, descrição, categoria, localização, imagem, prioridade)
- Acompanhar o andamento e consultar o histórico
- Adicionar comentários
- **Avaliar a resolução** (nota de 1 a 5 + comentário), quando o status for `Resolvida`

### Gestor
- Visualizar **todas** as ocorrências
- Filtrar por **status**, **categoria** e **prioridade**
- Alterar **prioridade** e **status** (com registro automático no histórico)
- Registrar a **solução aplicada**
- Adicionar comentários
- Visualizar **indicadores** em um dashboard

---

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Node.js (ES Modules), Express, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), `pg` |
| Banco de dados | PostgreSQL 15 (via Docker) |
| Frontend | React 19, Vite 6, React Router 7, Axios, Lucide React |
| Infra | Docker, Docker Compose, variáveis de ambiente centralizadas no `.env` |
| Testes | `node:test` (test runner nativo do Node) |

---

## Arquitetura

```
   NAVEGADOR (React)              SERVIDOR (Node/Express)           BANCO (PostgreSQL)
  ┌─────────────────┐            ┌────────────────────┐          ┌──────────────────┐
  │  React + Vite   │   HTTP     │  Express + JWT     │   SQL    │  PostgreSQL 15   │
  │  :5173          │ ─JSON────► │  :3100             │ ───────► │  :5432           │
  │                 │ ◄──JSON─── │                    │ ◄─────── │                  │
  └─────────────────┘            └────────────────────┘          └──────────────────┘
```

Fluxo de uma requisição: `React` → `axios (services/api.js)` → `Express (routes)` → `middlewares` (JWT/perfil) → `controller` → `SQL` → resposta JSON → `React` atualiza o estado.

---

## Estrutura de pastas

```
postech-fiap-tech-challenge/
├── backend/
│   ├── controllers/        # Regras de negócio (auth, ocorrências, comentários, indicadores)
│   ├── middlewares/        # authenticateToken (JWT) e authorizePerfil (cargo)
│   ├── routes/             # Definição dos endpoints
│   ├── tests/              # Testes dos middlewares (node:test)
│   ├── db.js               # Pool de conexões do PostgreSQL
│   ├── index.js            # Servidor Express
│   ├── init.sql            # Criação das tabelas/enums
│   └── seed.js             # Popula o banco com dados de exemplo
├── frontend/
│   └── src/
│       ├── components/     # Navbar, Layout, PrivateRoute
│       ├── context/        # AuthContext / AuthProvider
│       ├── hooks/          # useAuth
│       ├── pages/          # Login, Cadastro, Dashboard, NovaOcorrencia, Detalhe, Indicadores
│       └── services/       # api.js (axios) e ocorrencias.js
├── docker-compose.yml      # PostgreSQL
└── .env.example            # Modelo de variáveis de ambiente
```

---

## Como rodar

### Pré-requisitos
- Node.js 18+
- Docker + Docker Compose

### 1. Variáveis de ambiente
Na raiz do projeto, copie o modelo e ajuste os valores:

```bash
cp .env.example .env
```

### 2. Banco de dados (PostgreSQL)
```bash
docker compose up -d
```
Na primeira execução, o `backend/init.sql` cria automaticamente as tabelas e os enums.

### 3. Backend
```bash
cd backend
npm install
npm run seed   # (opcional) popula o banco com dados de exemplo
npm run dev    # inicia em http://localhost:3100
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev    # inicia em http://localhost:5173
```

Acesse `http://localhost:5173`.

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `password` |
| `DB_NAME` | Nome do banco | `resolve_ai_db` |
| `DB_PORT` | Porta do banco | `5432` |
| `JWT_SECRET` | Chave para assinar os tokens JWT | (string longa e aleatória) |
| `PORT` | Porta do backend (opcional) | `3100` |
| `VITE_API_URL` | URL da API usada pelo frontend | `http://localhost:3100` |

> O frontend usa `VITE_API_URL` se estiver definida em `frontend/.env`; caso contrário, usa `http://localhost:3100` como padrão.

---

## Usuários de teste (seed)

Após `npm run seed` (na pasta `backend`):

| Perfil | E-mail | Senha |
|---|---|---|
| Gestor | `gestor@resolveai.com` | `123456` |
| Solicitante | `carlos@email.com` | `123` |
| Solicitante | `ana@email.com` | `123` |

O seed cria 10 ocorrências de exemplo cobrindo todos os status, prioridades e categorias, com histórico, comentários e avaliações.

---

## API

Base: `http://localhost:3100`

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cadastra usuário (`nome`, `email`, `senha`, `perfil`) |
| POST | `/auth/login` | Público | Autentica e retorna `token` JWT + dados do usuário |

### Ocorrências

Todas exigem `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/ocorrencias` | Autenticado | Lista ocorrências. Solicitante vê as suas; gestor vê todas. Filtros: `?status=&categoria=&prioridade=` |
| POST | `/ocorrencias` | Autenticado | Cria ocorrência (`titulo`, `descricao`, `categoria`, `localizacao`, `imagem_url`, `prioridade`) |
| GET | `/ocorrencias/indicadores` | Gestor | Indicadores agregados (status, prioridade, categoria, média de avaliações) |
| GET | `/ocorrencias/:id` | Autenticado | Detalhe + histórico + comentários. Solicitante só acessa as próprias |
| PATCH | `/ocorrencias/:id/status` | Gestor | Atualiza `novo_status`, `prioridade`, `solucao_aplicada`, `observacao` (gera histórico) |
| POST | `/ocorrencias/:id/avaliacao` | Solicitante dono | Avalia a resolução (`nota` 1–5, `comentario`), só se `Resolvida` e uma única vez |
| POST | `/ocorrencias/:id/comentarios` | Autenticado | Adiciona comentário (`texto`). Solicitante só nas próprias |

### Códigos de status

| Código | Significado |
|---|---|
| 200 / 201 | Sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado (token ausente/inválido) |
| 403 | Sem permissão (perfil ou dono) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex.: ocorrência já avaliada) |
| 500 | Erro interno |

---

## Modelo de dados

- **usuarios** — `id`, `nome`, `email` (único), `senha` (hash bcrypt), `perfil` (`solicitante` | `gestor`), `criado_em`
- **ocorrencias** — `id`, `titulo`, `descricao`, `categoria`, `localizacao`, `imagem_url`, `prioridade`, `status`, `solicitante_id`, `gestor_id`, `solucao_aplicada`, `avaliacao_nota`, `avaliacao_comentario`, `avaliada_em`, timestamps
- **historico_ocorrencias** — `id`, `ocorrencia_id`, `status_anterior`, `novo_status`, `usuario_id`, `observacao`, `data_horario`
- **comentarios** — `id`, `ocorrencia_id`, `usuario_id`, `texto`, `criado_em`

Enums: `perfil_usuario`, `status_ocorrencia`, `prioridade_ocorrencia`.

---

## Ciclo de vida da ocorrência

```
Aberta → Em análise → Em atendimento → Resolvida
                                     ↘ Cancelada
```

Toda mudança de status grava um registro em `historico_ocorrencias` com: **status anterior**, **novo status**, **data/hora**, **usuário responsável** e **observação**.

---

## Segurança

- **Senhas** criptografadas com **bcrypt** (nunca armazenadas em texto puro).
- **Autenticação** via **JWT** (expira em 1 dia); o token é validado no servidor a cada requisição.
- **Autorização em duas camadas:**
  - **Por cargo** (`authorizePerfil`): ações exclusivas de gestor.
  - **Por dono** (ownership): solicitante só acessa/avalia/comenta as próprias ocorrências.
- **SQL parametrizado** (`$1`, `$2`, ...) em todas as consultas — previne SQL Injection.
- O cliente **nunca** é fonte de verdade: o servidor valida cargo e propriedade a partir do token e do banco.

---

## Testes

Testes mínimos das regras de segurança (middlewares), sem dependência de banco:

```bash
cd backend
npm test
```

Cobrem: token ausente/inválido/válido em `authenticateToken` e as regras de cargo em `authorizePerfil`.
