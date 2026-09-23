# Resolve Aí

Plataforma Full Stack (MVP) para **gestão de ocorrências** em condomínios, empresas, bairros e organizações. Usuários registram ocorrências e acompanham todo o processo até a resolução; gestores analisam, priorizam, atendem e medem os resultados.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar](#como-rodar)
- [Deploy (Cloud)](#deploy-cloud)
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
   NAVEGADOR                     NGINX (frontend)                 SERVIDOR (Node/Express)        BANCO (PostgreSQL)
  ┌─────────────────┐          ┌────────────────────┐           ┌────────────────────┐        ┌──────────────────┐
  │  React (build)  │  HTTP    │  Nginx :80 (:8080) │  /api →    │  Express + JWT     │  SQL   │  PostgreSQL 15   │
  │  servido pelo   │ ───────► │  - serve estáticos │ ─proxy──►  │  :3100             │ ─────► │  :5432           │
  │  Nginx          │ ◄─────── │  - proxy /api      │ ◄───────── │                    │ ◄───── │                  │
  └─────────────────┘          └────────────────────┘           └────────────────────┘        └──────────────────┘
```

No Docker, o navegador acessa o Nginx em `http://localhost:8080`. Chamadas a `/api/*` são encaminhadas pelo Nginx ao serviço `backend` na rede interna do Compose (sem CORS, pois é a mesma origem). No modo manual (dev), o React roda no Vite (`:5173`) e chama a API direto em `:3100`.

Fluxo de uma requisição: `React` → `axios (services/api.js)` → `Nginx (proxy /api)` → `Express (routes)` → `middlewares` (JWT/perfil) → `controller` → `SQL` → resposta JSON → `React` atualiza o estado.

---

## Estrutura de pastas

```
postech-fiap-tech-challenge/
├── backend/
│   ├── controllers/        # Regras de negócio (auth, ocorrências, comentários, indicadores)
│   ├── middlewares/        # authenticateToken (JWT) e authorizePerfil (cargo)
│   ├── routes/             # Definição dos endpoints
│   ├── tests/              # Testes de middlewares e controllers (node:test)
│   ├── db.js               # Pool de conexões do PostgreSQL
│   ├── index.js            # Servidor Express
│   ├── init.sql            # Criação das tabelas/enums
│   ├── seed.js             # Popula o banco com dados de exemplo
│   └── Dockerfile          # Imagem de produção do backend (Node)
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Layout, PrivateRoute
│   │   ├── context/        # AuthContext / AuthProvider
│   │   ├── hooks/          # useAuth
│   │   ├── pages/          # Login, Cadastro, Dashboard, NovaOcorrencia, Detalhe, Indicadores
│   │   └── services/       # api.js (axios) e ocorrencias.js
│   ├── Dockerfile          # Build multi-stage (Vite) + Nginx
│   └── nginx.conf          # Serve a SPA e faz proxy de /api → backend
├── docker-compose.yml      # PostgreSQL + backend + frontend (Nginx)
└── .env.example            # Modelo de variáveis de ambiente
```

---

## Como rodar

### Pré-requisitos
- Docker + Docker Compose (v2)
- (Apenas para o modo manual) Node.js 18+

### Variáveis de ambiente
Na raiz do projeto, copie o modelo e ajuste os valores:

```bash
cp .env.example .env
```

### Opção 1 — Tudo no Docker (recomendado)

Um único comando compila e sobe **banco + backend + frontend**:

```bash
docker compose up --build
```

O que acontece:
- O **PostgreSQL** sobe primeiro; na primeira execução, o `backend/init.sql` cria tabelas e enums. Um *healthcheck* garante que o banco só é considerado pronto quando aceita conexões.
- O **backend** (Node/Express) só inicia depois que o banco está saudável (`depends_on: service_healthy`).
- O **frontend** é compilado (`npm run build`) e servido por **Nginx**, que também faz proxy de `/api` para o backend.

Acesse:
- Frontend: **http://localhost:8080**
- API (acesso direto, opcional): **http://localhost:3100**

Popular o banco com dados de exemplo (seed), com os containers no ar:

```bash
docker compose exec backend npm run seed
```

> O seed é executado **manualmente e de forma explícita** porque ele recria os dados (`TRUNCATE`). Assim um `docker compose up` não apaga o banco a cada reinício.

Para parar tudo: `docker compose down` (adicione `-v` para apagar também o volume do banco).

### Opção 2 — Modo manual (desenvolvimento)

Sobe só o banco no Docker e roda backend/frontend localmente (hot reload):

```bash
docker compose up -d db      # apenas o PostgreSQL

cd backend
npm install
npm run seed   # (opcional) popula o banco
npm run dev    # http://localhost:3100

cd ../frontend
npm install
npm run dev    # http://localhost:5173
```

> No modo manual, `DB_HOST` deve ser `localhost`. No Docker, o host do banco é o nome do serviço (`db`), definido no próprio `docker-compose.yml`.

---

## Deploy (Cloud)

A aplicação está publicada em **serviços gratuitos**, cada um com uma responsabilidade:

```
   NAVEGADOR
      │
      ▼
  VERCEL (frontend)          RENDER (backend)           NEON (PostgreSQL)
  React compilado    HTTPS   Express + JWT      SQL/TLS  Postgres gerenciado
  *.vercel.app  ──────────►  *.onrender.com  ─────────►  nuvem
                                   │
                                   └──► CLOUDINARY (imagens: guarda só a URL)

  Domínios diferentes (Vercel ≠ Render) → CORS restrito via CORS_ORIGIN
```

| Camada | Provedor | Endereço |
|---|---|---|
| Frontend | Vercel | https://postech-fiap-tech-challenge.vercel.app |
| API | Render | https://resolve-ai-backend-g2j5.onrender.com |
| Banco | Neon | connection string **pooled**, via `DATABASE_URL` |
| Imagens | Cloudinary | plano gratuito |

> Verificação rápida da API: `GET /` retorna `{ "message": "API Resolve Aí rodando com sucesso!" }`.

### Diferenças em relação ao Docker local
- **Não há Nginx** fazendo proxy: o frontend chama a API **direto**, pela URL absoluta definida em `VITE_API_URL`.
- Frontend e API ficam em **domínios diferentes** (Vercel ≠ Render), então o **CORS** importa → restringimos com `CORS_ORIGIN`.
- O banco é gerenciado e **exige TLS** → o `db.js` liga o SSL automaticamente quando `DATABASE_URL` está definida.

### Variáveis de ambiente de produção
| Onde | Variável | Valor |
|---|---|---|
| Render | `DATABASE_URL` | connection string **pooled** do Neon |
| Render | `JWT_SECRET` | chave longa e aleatória |
| Render | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | credenciais do Cloudinary |
| Render | `CORS_ORIGIN` | `https://postech-fiap-tech-challenge.vercel.app` |
| Vercel | `VITE_API_URL` | `https://resolve-ai-backend-g2j5.onrender.com` |

> No **Render** use **Root Directory = `backend`** (o `package.json` fica nessa subpasta), runtime **Node**, build `npm install` e start `npm start`. No **Vercel** use **Root Directory = `frontend`** com preset **Vite**.

### Passo a passo (resumo)
1. **Neon** — criar o projeto, rodar o `backend/init.sql` no SQL Editor e popular o banco apontando o seed para o Neon:
   ```powershell
   cd backend
   $env:DATABASE_URL='<connection string pooled>'; npm run seed
   Remove-Item Env:DATABASE_URL
   ```
2. **Render** — *Web Service* do repositório: Root Directory `backend`, runtime Node, build `npm install`, start `npm start`, plano **Free**, e as variáveis da tabela acima.
3. **Vercel** — *Project* do repositório: Root Directory `frontend`, preset **Vite**, variável `VITE_API_URL` com a URL do Render.
4. **CORS** — definir `CORS_ORIGIN` no Render com a URL do Vercel (aceita lista separada por vírgula).

> O deploy é automático a cada `git push` na branch `master`: o Render rebuilda o backend e o Vercel rebuilda o frontend.

### Observações do plano gratuito
- O **Render free** "dorme" após ~15 min ociosos; a **primeira** requisição pode levar ~50 s. Para a demo, um *uptime pinger* gratuito (ex.: cron-job.org) chamando `GET /` a cada 10–14 min mantém o serviço acordado.
- O **Neon free** suspende o *compute* quando ocioso, mas acorda em milissegundos.

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
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary (upload de imagens) | `meu_cloud` |
| `CLOUDINARY_API_KEY` | API key do Cloudinary | `1234567890` |
| `CLOUDINARY_API_SECRET` | API secret do Cloudinary | (secret do painel) |
| `VITE_API_URL` | URL da API usada pelo frontend | `http://localhost:3100` |

> O frontend usa `VITE_API_URL` (lida em tempo de build pelo Vite, do `.env` da raiz ou de variáveis de ambiente); na ausência dela, usa `http://localhost:3100` como padrão.

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
| POST | `/ocorrencias` | Autenticado | Cria ocorrência (`titulo`, `descricao`, `categoria`, `localizacao`, `prioridade`). Aceita `multipart/form-data` com arquivo opcional no campo `imagem` (enviado ao Cloudinary); alternativamente `imagem_url` em JSON |
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

Testes automatizados com o runner nativo do Node (`node:test`), **sem dependência de banco de dados**:

```bash
cd backend
npm test
```

**Cobertura (37 casos):**

- **Middlewares de segurança** (`authMiddleware`, `authorizePerfil`): token ausente/inválido/válido e regras de cargo.
- **`authController`**: cadastro (campos obrigatórios, e-mail duplicado, senha gravada como hash bcrypt) e login (credenciais inválidas, geração de JWT).
- **`ocorrenciaController`**: criação (validação, prioridade padrão, histórico inicial), listagem (isolamento do solicitante, filtros do gestor), detalhe (ownership e 404), atualização de status (histórico só em mudança real) e avaliação (nota 1–5, só dono, só "Resolvida", avaliação única).
- **`comentarioController`**: validação, 404, ownership e comentário do gestor.
- **`indicadoresController`**: agregações e tratamento de erro.

**Como funciona o mock do banco:** os controllers usam o `pool` do PostgreSQL. Em teste, o helper `tests/dbMock.js` substitui `pool.query` por um fake programável (mesma instância do objeto), e `db.js` pula o probe de conexão quando `NODE_TEST_CONTEXT` está definido — ou seja, nenhum acesso real ao banco é feito.
