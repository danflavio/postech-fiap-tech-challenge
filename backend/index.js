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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});