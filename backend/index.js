import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './db.js';
import authRoutes from './routes/authRoutes.js';
import ocorrenciaRoutes from './routes/ocorrenciaRoutes.js';

dotenv.config({ path: '../.env' });
dotenv.config(); // fallback: dentro do container as variáveis vêm do ambiente

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

// Registra as rotas de autenticação
app.use('/auth', authRoutes);

// Rotas de Ocorrências (Protegidas) 
app.use('/ocorrencias', ocorrenciaRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API Resolve Aí rodando com sucesso!',
    });
});

// Tratamento global de erros (inclui erros do multer no upload de imagem).
app.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
        const mensagem =
            err.code === 'LIMIT_FILE_SIZE'
                ? 'Imagem muito grande (máximo 5 MB).'
                : err.message;
        return res.status(400).json({ message: mensagem });
    }
    if (err.message === 'Somente arquivos de imagem são permitidos.') {
        return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});