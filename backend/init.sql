-- Criação de Enums para Perfil, Status e Prioridade

CREATE TYPE perfil_usuario AS ENUM (
    'solicitante',
    'gestor'
);

CREATE TYPE status_ocorrencia AS ENUM (
    'Aberta',
    'Em análise',
    'Em atendimento',
    'Resolvida',
    'Cancelada'
);

CREATE TYPE prioridade_ocorrencia AS ENUM (
    'Baixa',
    'Média',
    'Alta',
    'Urgente'
);


-- 1. Tabela de Usuários

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL DEFAULT 'solicitante',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. Tabela de Ocorrências

CREATE TABLE IF NOT EXISTS ocorrencias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    localizacao VARCHAR(255) NOT NULL,
    imagem_url TEXT,
    prioridade prioridade_ocorrencia DEFAULT 'Média',
    status status_ocorrencia DEFAULT 'Aberta',
    solicitante_id INT NOT NULL REFERENCES usuarios(id),
    gestor_id INT REFERENCES usuarios(id),
    solucao_aplicada TEXT,
    avaliacao_nota SMALLINT CHECK (avaliacao_nota BETWEEN 1 AND 5),
    avaliacao_comentario TEXT,
    avaliada_em TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. Tabela de Histórico de Alterações de Status

CREATE TABLE IF NOT EXISTS historico_ocorrencias (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT NOT NULL
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE,
    status_anterior status_ocorrencia,
    novo_status status_ocorrencia NOT NULL,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    observacao TEXT,
    data_horario TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 4. Tabela de Comentários

CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INT NOT NULL
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    texto TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);