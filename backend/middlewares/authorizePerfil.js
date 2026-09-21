export const authorizePerfil = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !perfisPermitidos.includes(req.user.perfil)) {
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para esta ação.',
      });
    }

    next();
  };
};
