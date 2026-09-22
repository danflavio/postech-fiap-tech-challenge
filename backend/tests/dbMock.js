import { pool } from '../db.js';

// Estado interno do mock (handler + registro de chamadas).
const estado = { handler: null, chamadas: [] };

// Substitui o pool real por um fake programável.
// Como é a MESMA instância exportada por db.js, os controllers enxergam o mock.
pool.query = (sql, params) => {
  estado.chamadas.push({ sql, params });

  if (!estado.handler) {
    return Promise.reject(
      new Error(`dbMock: nenhum handler configurado.\nQuery: ${sql}`),
    );
  }

  return Promise.resolve(estado.handler(sql, params));
};

// Helpers para montar respostas no formato do pg.
export const linhas = (rows) => ({ rows, rowCount: rows.length });
export const nenhuma = () => ({ rows: [], rowCount: 0 });

// Cria um handler a partir de um mapa { "fragmento da SQL": resposta }.
// A resposta pode ser um objeto fixo ou uma função (params) => objeto.
export const responder = (mapa) => (sql, params) => {
  for (const [fragmento, resposta] of Object.entries(mapa)) {
    if (sql.includes(fragmento)) {
      return typeof resposta === 'function' ? resposta(params) : resposta;
    }
  }
  throw new Error(`dbMock: query não mapeada.\nQuery: ${sql}`);
};

export const dbMock = {
  // Define o comportamento do banco para o teste atual.
  usar(handler) {
    estado.handler = handler;
  },
  // Limpa handler e histórico (usar em beforeEach).
  resetar() {
    estado.handler = null;
    estado.chamadas.length = 0;
  },
  chamadas: estado.chamadas,
  // Primeira query cujo SQL contém o fragmento.
  chamadaCom(fragmento) {
    return estado.chamadas.find((c) => c.sql.includes(fragmento));
  },
  // Todas as queries cujo SQL contém o fragmento.
  todasCom(fragmento) {
    return estado.chamadas.filter((c) => c.sql.includes(fragmento));
  },
};
