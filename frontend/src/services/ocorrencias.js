import api from './api';

export const listarOcorrencias = (params) => api.get('/ocorrencias', { params });

export const criarOcorrencia = (data) => api.post('/ocorrencias', data);

export const obterOcorrencia = (id) => api.get(`/ocorrencias/${id}`);

export const atualizarStatus = (id, data) =>
  api.patch(`/ocorrencias/${id}/status`, data);

export const adicionarComentario = (id, texto) =>
  api.post(`/ocorrencias/${id}/comentarios`, { texto });

export const avaliarOcorrencia = (id, data) =>
  api.post(`/ocorrencias/${id}/avaliacao`, data);

export const obterIndicadores = () => api.get('/ocorrencias/indicadores');

export const listarGestores = () => api.get('/ocorrencias/gestores');
