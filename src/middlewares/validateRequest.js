const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().reduce((acc, err) => {
            acc[err.path] = err.msg;
            return acc;
        }, {});

        throw new AppError('Dados inválidos', 400, 'INVALID_PAYLOAD', errorMessages);
    }
    next();
};

module.exports = validateRequest;
