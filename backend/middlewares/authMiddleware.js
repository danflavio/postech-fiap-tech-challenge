import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    // Pega o cabeçalho Authorization (ex: "Bearer eyJhbGci...")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Se não enviou o token, bloqueia na hora
    if (!token) {
        return res.status(401).json({
            message: 'Acesso negado. Token não fornecido.',
        });
    }

    try {
        // Valida o token com a nossa chave secreta do .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Salva os dados do usuário (id, nome, perfil)
        // na requisição para o controller usar
        req.user = verified;

        // Libera a passagem para o próximo passo (o controller)
        next();
    } catch (error) {
        return res.status(403).json({
            message: 'Token inválido ou expirado.',
        });
    }
};