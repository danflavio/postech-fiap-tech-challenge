import pg from 'pg';
import dotenv from 'dotenv';

// Fora do Docker: carrega as variáveis do .env da raiz do projeto.
// Dentro do Docker: as variáveis vêm do ambiente (compose) e o dotenv
// simplesmente não encontra o arquivo — o que é inofensivo, pois o
// dotenv NUNCA sobrescreve variáveis já definidas no process.env.
dotenv.config({ path: '../.env' });
dotenv.config(); // fallback: .env no diretório atual, se existir

const { Pool } = pg;

// Conexão com o banco. Duas formas aceitas:
//   1) DATABASE_URL -> string única (banco gerenciado: Neon, Render, Supabase)
//   2) DB_HOST/DB_USER/... -> variáveis separadas (Postgres local / Docker)
const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    };

// Bancos gerenciados exigem TLS. Ligamos o SSL quando:
//   - DB_SSL=true (explícito), ou
//   - existe DATABASE_URL e DB_SSL não foi desligado (padrão dos clouds).
// No Docker local usamos variáveis separadas, então segue sem SSL.
const usarSSL =
  process.env.DB_SSL === 'true' ||
  (Boolean(process.env.DATABASE_URL) && process.env.DB_SSL !== 'false');

if (usarSSL) {
  connection.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(connection);

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