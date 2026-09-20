import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// 1. Cadastro de Usuário (Solicitante ou Gestor)
export const register = async (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  try {
    if (!nome || !email || !senha) {
      return res.status(400).json({
        message: "Nome, e-mail e senha são obrigatórios.",
      });
    }

    // Verifica se o e-mail já existe
    const userExists = await pool.query(
      "SELECT id FROM usuarios WHERE email = \$1",
      [email],
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: "E-mail já cadastrado.",
      });
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Insere no banco (perfil padrão: 'solicitante')
    const newUser = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, perfil)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, email, perfil, criado_em`,
      [nome, email, hashedPassword, perfil || "solicitante"],
    );

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: newUser.rows,
    });
  } catch (error) {
    console.error("Erro no registro:", error);

    res.status(500).json({
      message: "Erro interno no servidor.",
    });
  }
};

// 2. Login
export const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    if (!email || !senha) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios.",
      });
    }

    // Busca usuário pelo e-mail
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = \$1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    const user = result.rows;

    // Compara a senha informada com a senha criptografada do banco
    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    // Gera o token de acesso JWT (válido por 1 dia)
    const token = jwt.sign(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
      process.env.JWT_SECRET || "chave_secreta_padrao",
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    res.status(500).json({
      message: "Erro interno no servidor.",
    });
  }
};
