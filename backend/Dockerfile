# Imagem base enxuta com Node 20 (Alpine = distribuição Linux mínima).
FROM node:20-alpine

# Diretório de trabalho dentro do container. Todo o código vive aqui.
WORKDIR /app

# Copiamos APENAS os manifests primeiro. Isso aproveita o cache de camadas
# do Docker: enquanto package.json/package-lock não mudam, o npm install
# não é reexecutado a cada build de código.
COPY package*.json ./

# Instala só as dependências de produção (ignora nodemon etc.).
RUN npm install --omit=dev

# Agora sim copiamos o restante do código-fonte.
COPY . .

# Porta que o Express escuta (definida por PORT; default 3100 no index.js).
EXPOSE 3100

# Comando de produção: node direto, sem nodemon.
CMD ["node", "index.js"]
