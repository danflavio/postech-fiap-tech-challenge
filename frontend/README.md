# Resolve Aí — Frontend

Interface web (React + Vite) do projeto **Resolve Aí**. A documentação completa está no [README da raiz](../README.md).

## Como rodar

```bash
npm install
npm run dev    # http://localhost:5173
```

Por padrão, a aplicação consome a API em `http://localhost:3100`. Para apontar para outro endereço, crie um arquivo `.env` nesta pasta:

```
VITE_API_URL=http://localhost:3100
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | ESLint |

## Estrutura

```
src/
├── components/   # Navbar, Layout, PrivateRoute
├── context/      # AuthContext / AuthProvider
├── hooks/        # useAuth
├── pages/        # Login, Cadastro, Dashboard, NovaOcorrencia, DetalheOcorrencia, Indicadores
└── services/     # api.js (axios) e ocorrencias.js
```
