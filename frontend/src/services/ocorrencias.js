import api from './api';

export const listarOcorrencias = (params) => api.get('/ocorrencias', { params });

export const criarOcorrencia = (data) => api.post('/ocorrencias', data);

export const obterOcorrencia = (id) => api.get(`/ocorrencias/${id}`);

export const atualizarStatus = (id, data) =>
  api.patch(`/ocorrencias/${id}/status`, data);

export const adicionarComentario = (id, texto) =>
  api.post(`/ocorrencias/${id}/comentarios`, { texto });
