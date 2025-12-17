const express = require('express');
const couponController = require('./couponController');
const authMiddleware = require('../../middlewares/authMiddleware');
const AppError = require('../../utils/AppError');

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return next(new AppError('Acesso restrito a administradores', 403, 'FORBIDDEN'));
    }
    next();
};

router.use(authMiddleware);
router.post('/', adminOnly, couponController.create);
router.get('/', adminOnly, couponController.list);

module.exports = router;
