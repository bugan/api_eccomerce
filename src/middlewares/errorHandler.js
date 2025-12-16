const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';
    const code = err.code || 'INTERNAL_SERVER_ERROR';

    // Log do erro (apenas se for server error ou algo importante)
    if (statusCode >= 500) {
        logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        logger.error(err.stack);
    } else {
        logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    res.status(statusCode).json({
        error: {
            code,
            message,
            details: err.details || {},
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;
