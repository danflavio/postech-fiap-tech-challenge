import pg from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis do .env
dotenv.config({ path: '../.env' });

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

// Teste de conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    console.log('🕐 PostgreSQL:', res.rows[0].now);
  }
});