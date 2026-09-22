import pg from 'pg';
import dotenv from 'dotenv';

// Fora do Docker: carrega as variáveis do .env da raiz do projeto.
// Dentro do Docker: as variáveis vêm do ambiente (compose) e o dotenv
// simplesmente não encontra o arquivo — o que é inofensivo, pois o
// dotenv NUNCA sobrescreve variáveis já definidas no process.env.
dotenv.config({ path: '../.env' });
dotenv.config(); // fallback: .env no diretório atual, se existir

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Teste de conexão.
// Em testes automatizados o pool é substituído por um mock (tests/dbMock.js),
// então pulamos este probe para não abrir uma conexão real desnecessária.
if (!process.env.NODE_TEST_CONTEXT) {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
    } else {
      console.log('✅ Conectado ao PostgreSQL com sucesso!');
      console.log('🕐 PostgreSQL:', res.rows[0].now);
    }
  });
}