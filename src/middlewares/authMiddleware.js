const { verifyAccessToken } = require('../utils/token');
const AppError = require('../utils/AppError');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Token de acesso não fornecido', 401, 'UNAUTHORIZED');
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // { sub: userId, role: role }
        next();
    } catch (error) {
        throw new AppError('Token inválido ou expirado', 401, 'UNAUTHORIZED');
    }
};

module.exports = authMiddleware;
