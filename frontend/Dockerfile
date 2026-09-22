# =========================================================
# ESTÁGIO 1 — Build: compila o React/Vite em arquivos estáticos
# =========================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copia manifests primeiro (aproveita cache de camadas do Docker).
COPY package*.json ./
RUN npm install

# A URL da API é embutida em BUILD TIME pelo Vite (import.meta.env).
# Com o Nginx fazendo proxy, o frontend chama /api na mesma origem.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copia o restante do código e gera a pasta dist/.
COPY . .
RUN npm run build

# =========================================================
# ESTÁGIO 2 — Runtime: Nginx servindo os estáticos + proxy /api
# =========================================================
FROM nginx:1.27-alpine

# Configuração customizada: SPA (try_files) + proxy reverso para a API.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia SOMENTE o resultado do build. Node e node_modules ficam para trás.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
